# Traffic Power Tool - Professional Docker Setup

Enterprise-grade website traffic simulation platform with advanced international demographics, behavioral personas, and comprehensive analytics.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 10GB+ free disk space

### One-Command Setup

```bash
# Clone and start the application
git clone <repository-url>
cd traffic-power-tool
docker-compose up -d
```

The application will be available at: http://localhost:8000

## 🏗️ Architecture

### Single Container Design
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Python Flask with SocketIO for real-time updates
- **Database**: PostgreSQL for data persistence
- **Cache**: Redis for session management and caching
- **Browser Automation**: Playwright with Chromium

### Professional Components Used

#### Frontend Libraries
- **@headlessui/react**: Accessible UI components
- **@heroicons/react**: Professional icon set
- **@tanstack/react-query**: Data fetching and caching
- **@tanstack/react-table**: Advanced data tables
- **@radix-ui/***: Primitive UI components
- **recharts**: Professional charts and graphs
- **framer-motion**: Smooth animations
- **react-hook-form**: Form management
- **zustand**: State management
- **socket.io-client**: Real-time communication

#### Backend Libraries
- **Flask + SocketIO**: Web framework with WebSocket support
- **SQLAlchemy**: Database ORM
- **PostgreSQL**: Production database
- **Redis**: Caching and session storage
- **Playwright**: Browser automation
- **Pandas**: Data processing
- **Plotly**: Data visualization

## 🐳 Docker Configuration

### Services

1. **traffic-power-tool**: Main application container
   - Combines frontend and backend
   - Includes Playwright browsers
   - Health checks enabled
   - Auto-restart policy

2. **postgres**: PostgreSQL database
   - Persistent data storage
   - Automatic schema initialization
   - Performance optimized

3. **redis**: Redis cache
   - Session management
   - Real-time data caching
   - Persistent storage

### Volumes
- `postgres_data`: Database persistence
- `redis_data`: Cache persistence
- `./data`: Application output data
- `./logs`: Application logs
- `./config`: Configuration files

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
POSTGRES_DB=traffic_power_tool
POSTGRES_USER=traffic_user
POSTGRES_PASSWORD=your_secure_password

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Application Configuration
SECRET_KEY=your_secret_key_here
NODE_ENV=production
PYTHONPATH=/app

# Optional: External Services
GOOGLE_ANALYTICS_CREDENTIALS_PATH=/app/config/ga-credentials.json
```

### Custom Configuration

1. **Database Settings**: Modify `docker-compose.yml` PostgreSQL section
2. **Resource Limits**: Add resource constraints to services
3. **Network Settings**: Configure custom networks
4. **SSL/TLS**: Add reverse proxy configuration

## 📊 Features

### 🌍 International Traffic Simulation
- 200+ countries with realistic distribution
- Geolocation-aware fingerprinting
- Country-specific behavior patterns
- Multi-language support

### 👥 Advanced Demographics
- Age distribution control (18-75 years)
- Gender targeting with ratios
- Device distribution (Desktop/Mobile/Tablet)
- Returning vs new visitor simulation

### 🎭 Intelligent Personas
- 20+ pre-built behavioral personas
- Custom persona creation
- Goal-oriented behavior simulation
- International characteristics

### 📈 Real-time Analytics
- Live dashboard with interactive charts
- Web vitals collection (TTFB, FCP, DOM Load)
- Performance metrics tracking
- Export capabilities (CSV, Excel, JSON)

### 🔧 Enterprise Features
- Preset configuration management
- Simulation history and archiving
- Advanced scheduling capabilities
- Comprehensive logging and monitoring

## 🚀 Usage

### 1. Access the Application
Open http://localhost:8000 in your browser

### 2. Configure Simulation
- Set target URL and session parameters
- Choose countries and demographics
- Select behavioral personas
- Review and launch

### 3. Monitor Progress
- Real-time dashboard updates
- Live session tracking
- Performance metrics
- Error monitoring

### 4. Analyze Results
- Comprehensive analytics dashboard
- Export data in multiple formats
- Historical comparison
- Performance insights

## 🔍 Monitoring

### Health Checks
```bash
# Check application health
curl http://localhost:8000/health

# Check service status
docker-compose ps

# View logs
docker-compose logs -f traffic-power-tool
```

### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U traffic_user -d traffic_power_tool

# Connect to Redis
docker-compose exec redis redis-cli
```

## 📈 Performance Optimization

### Resource Allocation
```yaml
# Add to docker-compose.yml services
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 4G
    reservations:
      cpus: '1.0'
      memory: 2G
```

### Scaling
```bash
# Scale application instances
docker-compose up -d --scale traffic-power-tool=3

# Use load balancer (nginx/traefik)
# Configure in separate docker-compose.override.yml
```

## 🔒 Security

### Production Deployment
1. **Change default passwords**
2. **Use environment variables for secrets**
3. **Enable SSL/TLS with reverse proxy**
4. **Configure firewall rules**
5. **Regular security updates**

### Network Security
```yaml
# Custom network configuration
networks:
  traffic_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## 🛠️ Development

### Local Development
```bash
# Start in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Frontend development
cd frontend && npm run dev

# Backend development
cd backend && python app.py
```

### Debugging
```bash
# Access container shell
docker-compose exec traffic-power-tool bash

# View application logs
docker-compose logs -f --tail=100 traffic-power-tool

# Database debugging
docker-compose exec postgres psql -U traffic_user -d traffic_power_tool -c "SELECT * FROM simulations;"
```

## 📚 API Documentation

### REST Endpoints
- `GET /health` - Health check
- `GET /api/config/default` - Get default configuration
- `POST /api/config/validate` - Validate configuration
- `POST /api/simulation/start` - Start simulation
- `GET /api/simulation/{id}/status` - Get simulation status
- `POST /api/simulation/{id}/stop` - Stop simulation

### WebSocket Events
- `simulation_started` - Simulation began
- `simulation_completed` - Simulation finished
- `live_update` - Real-time session updates
- `log_update` - Log messages

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Next.js** - React framework
- **Flask** - Python web framework
- **Playwright** - Browser automation
- **PostgreSQL** - Database system
- **Redis** - Caching solution
- **Docker** - Containerization platform

---

**Traffic Power Tool v2.0** - Professional Traffic Simulation Platform 🚀