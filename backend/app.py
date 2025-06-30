import os
import asyncio
import logging
import signal
import threading
from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
import redis
import mysql.connector
from mysql.connector import errorcode
import json
from datetime import datetime
from contextlib import contextmanager

# --- Configuration ---
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables
SECRET_KEY = os.environ.get('SECRET_KEY')
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
MYSQL_HOST = os.environ.get('MYSQL_HOST', 'mysql')
MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
MYSQL_DB = os.environ.get('MYSQL_DB', 'traffic_power_tool')
MYSQL_USER = os.environ.get('MYSQL_USER', 'traffic_user')
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'traffic_password')
APP_ENV = os.environ.get('APP_ENV', 'development')
OUTPUT_DIR = Path(os.environ.get('OUTPUT_DIR', '/app/output'))
LOGS_DIR = Path(os.environ.get('LOGS_DIR', '/app/logs'))

# Validate essential configuration
if not SECRET_KEY and APP_ENV == 'production':
    logger.error("FATAL: SECRET_KEY is not set in production environment.")
    exit(1)
if not CORS_ALLOWED_ORIGINS and APP_ENV == 'production':
    logger.warning("Warning: CORS_ALLOWED_ORIGINS is not set. Allowing all origins.")

# --- Application Initialization ---
app = Flask(__name__, static_folder='static', static_url_path='')
app.config['SECRET_KEY'] = SECRET_KEY or 'dev-secret-key-for-dev-only'

# Enable CORS
CORS(app, origins=CORS_ALLOWED_ORIGINS if APP_ENV == 'production' else "*")

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins=CORS_ALLOWED_ORIGINS if APP_ENV == 'production' else "*", async_mode='threading')

# --- Service Connections ---
# Initialize Redis connection
try:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=0,
        decode_responses=True
    )
    redis_client.ping()
    logger.info("Redis connection established")
except Exception as e:
    logger.error(f"Redis connection failed: {e}")
    redis_client = None

# Initialize MySQL connection
@contextmanager
def get_db_connection():
    """Provide a transactional scope around a series of operations."""
    conn = None
    try:
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            database=MYSQL_DB,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD
        )
        yield conn
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            logger.error("Something is wrong with your user name or password")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            logger.error("Database does not exist")
        else:
            logger.error(f"Database connection failed: {err}")
        raise
    finally:
        if conn and conn.is_connected():
            conn.close()

# --- Core Application Imports ---
from src.core.generator import AdvancedTrafficGenerator
from src.core.config import TrafficConfig, DEFAULT_PERSONAS

# --- Global State ---
active_simulations = {}
simulation_threads = {}

# --- Utility Functions ---
def run_simulation_in_background(simulation_id, config_data):
    """Runs the traffic generation simulation in a separate thread."""
    def simulation_runner():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            config = TrafficConfig(project_root=OUTPUT_DIR.parent, **config_data)
            generator = AdvancedTrafficGenerator(config)
            
            active_simulations[simulation_id] = {
                'generator': generator,
                'status': 'running',
                'started_at': datetime.utcnow()
            }
            
            socketio.emit('simulation_started', {'simulation_id': simulation_id})
            logger.info(f"Simulation {simulation_id} started.")
            
            loop.run_until_complete(generator.run())
            
            status = 'completed' if not generator.stop_event.is_set() else 'stopped'
            active_simulations[simulation_id]['status'] = status
            
            with get_db_connection() as conn:
                with conn.cursor(dictionary=True) as cur:
                    cur.execute("UPDATE simulations SET status = %s, finished_at = %s, stats = %s WHERE id = %s",
                                (status, datetime.utcnow(), json.dumps(generator.session_stats), simulation_id))
                    conn.commit()

            socketio.emit('simulation_completed', {
                'simulation_id': simulation_id,
                'stats': generator.session_stats
            })
            logger.info(f"Simulation {simulation_id} finished with status: {status}")

        except Exception as e:
            logger.error(f"Simulation {simulation_id} failed: {e}", exc_info=True)
            active_simulations[simulation_id]['status'] = 'failed'
            with get_db_connection() as conn:
                with conn.cursor(dictionary=True) as cur:
                    cur.execute("UPDATE simulations SET status = %s, finished_at = %s, error_message = %s WHERE id = %s",
                                ('failed', datetime.utcnow(), str(e), simulation_id))
                    conn.commit()
            socketio.emit('simulation_error', {'simulation_id': simulation_id, 'error': str(e)})
        finally:
            loop.close()
            if simulation_id in simulation_threads:
                del simulation_threads[simulation_id]

    thread = threading.Thread(target=simulation_runner)
    thread.daemon = True
    thread.start()
    simulation_threads[simulation_id] = thread

# --- API Endpoints ---
@app.route('/')
def index():
    """Serve the Next.js frontend's entry point."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files from the Next.js build directory."""
    try:
        return send_from_directory(app.static_folder, path)
    except FileNotFoundError:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health')
def health_check():
    """Health check endpoint for monitoring."""
    db_ok = False
    try:
        with get_db_connection() as conn:
            if conn.is_connected():
                db_ok = True
    except Exception:
        db_ok = False
        
    status = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'services': {
            'redis': 'connected' if redis_client and redis_client.ping() else 'disconnected',
            'mysql': 'connected' if db_ok else 'disconnected'
        }
    }
    return jsonify(status)

@app.route('/api/config/default')
def get_default_config():
    """Get default simulation configuration."""
    try:
        config = {
            'target_url': '',
            'total_sessions': 100,
            'max_concurrent': 10,
            'headless': True,
            'returning_visitor_rate': 30,
            'navigation_timeout': 60000,
            'max_retries_per_session': 2,
            'mode_type': 'Bot',
            'network_type': 'Default',
            'personas': DEFAULT_PERSONAS[:5],
            'device_distribution': {'Desktop': 60, 'Mobile': 30, 'Tablet': 10},
            'country_distribution': {'United States': 25, 'Indonesia': 15, 'India': 12, 'China': 10, 'Brazil': 8},
            'age_distribution': {'18-24': 20, '25-34': 30, '35-44': 25, '45-54': 15, '55+': 10}
        }
        return jsonify({'success': True, 'data': config})
    except Exception as e:
        logger.error(f"Error getting default config: {e}", exc_info=True)
        return jsonify({'success': False, 'error': 'Failed to retrieve default configuration.'}), 500

@app.route('/api/config/validate', methods=['POST'])
def validate_config():
    """Validate simulation configuration from user."""
    try:
        config_data = request.get_json()
        if not config_data:
            return jsonify({'success': False, 'error': 'Request body must be JSON.'}), 400

        required_fields = ['target_url', 'total_sessions', 'max_concurrent']
        for field in required_fields:
            if field not in config_data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        if not config_data['target_url'].startswith(('http://', 'https://')):
            return jsonify({'success': False, 'error': 'Target URL must start with http:// or https://'}), 400
        
        if not (1 <= config_data['total_sessions'] <= 10000):
            return jsonify({'success': False, 'error': 'Total sessions must be between 1 and 10,000'}), 400
        
        if not (1 <= config_data['max_concurrent'] <= 100):
            return jsonify({'success': False, 'error': 'Max concurrent sessions must be between 1 and 100'}), 400
        
        return jsonify({'success': True, 'data': True})
    except Exception as e:
        logger.error(f"Error validating config: {e}", exc_info=True)
        return jsonify({'success': False, 'error': 'An unexpected error occurred during validation.'}), 500

@app.route('/api/simulation/start', methods=['POST'])
def start_simulation():
    """Start a new traffic simulation."""
    try:
        config_data = request.get_json()
        if not config_data:
            return jsonify({'success': False, 'error': 'Request body must be JSON.'}), 400
            
        simulation_id = f"sim_{int(datetime.utcnow().timestamp())}"
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Note: Always use query parameterization to prevent SQL injection.
                cur.execute("""
                    INSERT INTO simulations (id, config, status, created_at)
                    VALUES (%s, %s, %s, %s)
                """, (simulation_id, json.dumps(config_data), 'starting', datetime.utcnow()))
                conn.commit()
        
        run_simulation_in_background(simulation_id, config_data)
        
        return jsonify({'success': True, 'data': {'simulation_id': simulation_id}}), 202
        
    except Exception as e:
        logger.error(f"Error starting simulation: {e}", exc_info=True)
        return jsonify({'success': False, 'error': 'Failed to start simulation.'}), 500

@app.route('/api/simulation/<simulation_id>/status')
def get_simulation_status(simulation_id):
    """Get the status of a specific simulation."""
    try:
        if simulation_id in active_simulations:
            sim = active_simulations[simulation_id]
            generator = sim.get('generator')
            stats = generator.session_stats if generator else {}
            return jsonify({
                'success': True,
                'data': {
                    'id': simulation_id,
                    'status': sim['status'],
                    'started_at': sim['started_at'].isoformat(),
                    'stats': stats
                }
            })
        else:
            with get_db_connection() as conn:
                with conn.cursor(dictionary=True) as cur:
                    cur.execute("SELECT id, status, created_at, finished_at, stats, error_message FROM simulations WHERE id = %s", (simulation_id,))
                    result = cur.fetchone()
                    if result:
                        return jsonify({'success': True, 'data': result})
            
            return jsonify({'success': False, 'error': 'Simulation not found'}), 404
            
    except Exception as e:
        logger.error(f"Error getting simulation status for {simulation_id}: {e}", exc_info=True)
        return jsonify({'success': False, 'error': 'Failed to retrieve simulation status.'}), 500

@app.route('/api/simulation/<simulation_id>/stop', methods=['POST'])
def stop_simulation(simulation_id):
    """Stop a running simulation."""
    try:
        if simulation_id in active_simulations:
            sim = active_simulations[simulation_id]
            generator = sim.get('generator')
            if generator and hasattr(generator, 'stop_event'):
                generator.stop_event.set()
            sim['status'] = 'stopping'
            
            socketio.emit('simulation_stopping', {'simulation_id': simulation_id})
            logger.info(f"Stopping simulation {simulation_id}...")
            
            return jsonify({'success': True, 'message': 'Simulation stopping process initiated.'})
        else:
            return jsonify({'success': False, 'error': 'Simulation not found or not running'}), 404
            
    except Exception as e:
        logger.error(f"Error stopping simulation {simulation_id}: {e}", exc_info=True)
        return jsonify({'success': False, 'error': 'Failed to stop simulation.'}), 500

@app.route('/api/personas/default')
def get_default_personas():
    """Get the list of default personas."""
    try:
        personas = [p.to_dict() for p in DEFAULT_PERSONAS]
        return jsonify({'success': True, 'data': personas})
    except Exception as e:
        logger.error(f"Error getting default personas: {e}", exc_info=True)
        return jsonify({'success': False, 'error': 'Failed to retrieve personas.'}), 500

# --- WebSocket Handlers ---
@socketio.on('connect')
def handle_connect():
    """Handle new client connection."""
    logger.info(f"Client connected: {request.sid}")
    emit('connected', {'status': 'Connected to Traffic Power Tool'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('join_simulation')
def handle_join_simulation(data):
    """Allow a client to join a simulation room for live updates."""
    simulation_id = data.get('simulation_id')
    if simulation_id:
        join_room(simulation_id)
        logger.info(f"Client {request.sid} joined room for simulation {simulation_id}")
        emit('joined_simulation', {'simulation_id': simulation_id})

# --- Graceful Shutdown ---
def graceful_shutdown(signum, frame):
    logger.info("Shutdown signal received. Stopping all simulations...")
    for sim_id, sim_data in active_simulations.items():
        generator = sim_data.get('generator')
        if generator:
            generator.stop_event.set()
    
    # Wait for threads to finish
    for thread in simulation_threads.values():
        thread.join(timeout=10)

    logger.info("All simulations stopped. Exiting.")
    exit(0)

# --- Main Execution ---
if __name__ == '__main__':
    # Ensure required directories exist
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / 'profiles').mkdir(exist_ok=True)
    LOGS_DIR.mkdir(exist_ok=True)
    
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, graceful_shutdown)
    signal.signal(signal.SIGTERM, graceful_shutdown)
    
    # Start the application
    port = int(os.environ.get('PORT', 8000))
    logger.info(f"Starting server on port {port} in {APP_ENV} mode...")
    socketio.run(app, host='0.0.0.0', port=port, debug=(APP_ENV == 'development'))