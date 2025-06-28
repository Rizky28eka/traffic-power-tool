import os
import asyncio
import logging
from pathlib import Path
from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import redis
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, 
           static_folder='static',
           static_url_path='')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')

# Enable CORS
CORS(app, origins=["*"])

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Initialize Redis connection
try:
    redis_client = redis.Redis(
        host=os.environ.get('REDIS_HOST', 'redis'),
        port=int(os.environ.get('REDIS_PORT', 6379)),
        db=0,
        decode_responses=True
    )
    redis_client.ping()
    logger.info("Redis connection established")
except Exception as e:
    logger.error(f"Redis connection failed: {e}")
    redis_client = None

# Initialize PostgreSQL connection
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.environ.get('POSTGRES_HOST', 'postgres'),
            port=int(os.environ.get('POSTGRES_PORT', 5432)),
            database=os.environ.get('POSTGRES_DB', 'traffic_power_tool'),
            user=os.environ.get('POSTGRES_USER', 'traffic_user'),
            password=os.environ.get('POSTGRES_PASSWORD', 'traffic_password'),
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None

# Import core modules
from src.core.generator import AdvancedTrafficGenerator
from src.core.config import TrafficConfig, DEFAULT_PERSONAS
from src.utils.reporting import create_report_excel

# Global simulation state
active_simulations = {}

@app.route('/')
def index():
    """Serve the Next.js frontend"""
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files from Next.js build"""
    try:
        return send_from_directory('static', path)
    except:
        # Fallback to index.html for client-side routing
        return send_from_directory('static', 'index.html')

@app.route('/health')
def health_check():
    """Health check endpoint"""
    status = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'services': {
            'redis': 'connected' if redis_client else 'disconnected',
            'postgres': 'connected' if get_db_connection() else 'disconnected'
        }
    }
    return jsonify(status)

@app.route('/api/config/default')
def get_default_config():
    """Get default configuration"""
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
            'personas': DEFAULT_PERSONAS[:5],  # First 5 personas
            'device_distribution': {'Desktop': 60, 'Mobile': 30, 'Tablet': 10},
            'country_distribution': {
                'United States': 25,
                'Indonesia': 15,
                'India': 12,
                'China': 10,
                'Brazil': 8
            },
            'age_distribution': {
                '18-24': 20,
                '25-34': 30,
                '35-44': 25,
                '45-54': 15,
                '55+': 10
            }
        }
        return jsonify({'success': True, 'data': config})
    except Exception as e:
        logger.error(f"Error getting default config: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/config/validate', methods=['POST'])
def validate_config():
    """Validate simulation configuration"""
    try:
        config_data = request.get_json()
        
        # Basic validation
        required_fields = ['target_url', 'total_sessions', 'max_concurrent']
        for field in required_fields:
            if field not in config_data:
                return jsonify({
                    'success': False, 
                    'error': f'Missing required field: {field}'
                }), 400
        
        # URL validation
        if not config_data['target_url'].startswith(('http://', 'https://')):
            return jsonify({
                'success': False, 
                'error': 'Target URL must start with http:// or https://'
            }), 400
        
        # Numeric validations
        if config_data['total_sessions'] < 1 or config_data['total_sessions'] > 10000:
            return jsonify({
                'success': False, 
                'error': 'Total sessions must be between 1 and 10,000'
            }), 400
        
        if config_data['max_concurrent'] < 1 or config_data['max_concurrent'] > 100:
            return jsonify({
                'success': False, 
                'error': 'Max concurrent sessions must be between 1 and 100'
            }), 400
        
        return jsonify({'success': True, 'data': True})
    except Exception as e:
        logger.error(f"Error validating config: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/simulation/start', methods=['POST'])
def start_simulation():
    """Start a new traffic simulation"""
    try:
        config_data = request.get_json()
        simulation_id = f"sim_{int(datetime.utcnow().timestamp())}"
        
        # Create TrafficConfig object
        config = TrafficConfig(
            project_root=Path('/app'),
            **config_data
        )
        
        # Store simulation in database
        conn = get_db_connection()
        if conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO simulations (id, config, status, created_at)
                    VALUES (%s, %s, %s, %s)
                """, (simulation_id, json.dumps(config_data), 'starting', datetime.utcnow()))
                conn.commit()
            conn.close()
        
        # Start simulation in background
        def run_simulation():
            try:
                generator = AdvancedTrafficGenerator(config)
                active_simulations[simulation_id] = {
                    'generator': generator,
                    'status': 'running',
                    'started_at': datetime.utcnow()
                }
                
                # Emit start event
                socketio.emit('simulation_started', {
                    'simulation_id': simulation_id
                })
                
                # Run simulation
                asyncio.run(generator.run())
                
                # Update status
                active_simulations[simulation_id]['status'] = 'completed'
                socketio.emit('simulation_completed', {
                    'simulation_id': simulation_id,
                    'stats': generator.session_stats
                })
                
            except Exception as e:
                logger.error(f"Simulation {simulation_id} failed: {e}")
                if simulation_id in active_simulations:
                    active_simulations[simulation_id]['status'] = 'failed'
                socketio.emit('simulation_error', {
                    'simulation_id': simulation_id,
                    'error': str(e)
                })
        
        # Start simulation in background thread
        import threading
        thread = threading.Thread(target=run_simulation)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True, 
            'data': {'simulation_id': simulation_id}
        })
        
    except Exception as e:
        logger.error(f"Error starting simulation: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/simulation/<simulation_id>/status')
def get_simulation_status(simulation_id):
    """Get simulation status"""
    try:
        if simulation_id in active_simulations:
            sim = active_simulations[simulation_id]
            return jsonify({
                'success': True,
                'data': {
                    'id': simulation_id,
                    'status': sim['status'],
                    'started_at': sim['started_at'].isoformat(),
                    'stats': getattr(sim.get('generator'), 'session_stats', {})
                }
            })
        else:
            # Check database
            conn = get_db_connection()
            if conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT * FROM simulations WHERE id = %s", (simulation_id,))
                    result = cur.fetchone()
                    if result:
                        return jsonify({
                            'success': True,
                            'data': dict(result)
                        })
                conn.close()
            
            return jsonify({
                'success': False, 
                'error': 'Simulation not found'
            }), 404
            
    except Exception as e:
        logger.error(f"Error getting simulation status: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/simulation/<simulation_id>/stop', methods=['POST'])
def stop_simulation(simulation_id):
    """Stop a running simulation"""
    try:
        if simulation_id in active_simulations:
            sim = active_simulations[simulation_id]
            if hasattr(sim.get('generator'), 'stop_event'):
                sim['generator'].stop_event.set()
            sim['status'] = 'stopped'
            
            socketio.emit('simulation_stopped', {
                'simulation_id': simulation_id
            })
            
            return jsonify({'success': True, 'data': True})
        else:
            return jsonify({
                'success': False, 
                'error': 'Simulation not found or not running'
            }), 404
            
    except Exception as e:
        logger.error(f"Error stopping simulation: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/personas/default')
def get_default_personas():
    """Get default personas"""
    try:
        personas = [
            {
                'name': persona.name,
                'goal_keywords': persona.goal_keywords,
                'generic_keywords': persona.generic_keywords,
                'navigation_depth': persona.navigation_depth,
                'avg_time_per_page': persona.avg_time_per_page,
                'can_fill_forms': persona.can_fill_forms,
                'gender': persona.gender,
                'age_range': persona.age_range
            }
            for persona in DEFAULT_PERSONAS
        ]
        return jsonify({'success': True, 'data': personas})
    except Exception as e:
        logger.error(f"Error getting default personas: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f"Client connected: {request.sid}")
    emit('connected', {'status': 'Connected to Traffic Power Tool'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('join_simulation')
def handle_join_simulation(data):
    """Join simulation room for live updates"""
    simulation_id = data.get('simulation_id')
    if simulation_id:
        join_room(simulation_id)
        emit('joined_simulation', {'simulation_id': simulation_id})

if __name__ == '__main__':
    # Ensure required directories exist
    os.makedirs('/app/output/profiles', exist_ok=True)
    os.makedirs('/app/logs', exist_ok=True)
    
    # Start the application
    port = int(os.environ.get('PORT', 8000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False)