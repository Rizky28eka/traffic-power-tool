# Traffic Power Tool

Professional website traffic simulation platform with advanced international demographics and behavioral personas.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- 4GB+ RAM
- 10GB+ disk space

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd traffic-power-tool
```

2. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start application**
```bash
docker-compose up -d
```

4. **Access application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Health check: http://localhost:8000/health

## Architecture

### Services
- **Frontend**: Next.js 15 with TypeScript (Port 3000)
- **Backend**: Python Flask with SocketIO (Port 8000)
- **Database**: PostgreSQL 15 (Port 5432)
- **Cache**: Redis 7 (Port 6379)

### Key Features
- 🌍 International traffic simulation (200+ countries)
- 👥 Advanced demographics and personas
- 📊 Real-time monitoring and analytics
- 🎭 Intelligent behavioral simulation
- 📈 Web vitals collection

## Development

### Backend Development
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/config/default` - Default configuration
- `POST /api/simulation/start` - Start simulation
- `GET /api/simulation/{id}/status` - Simulation status

## Configuration

### Environment Variables
```env
POSTGRES_HOST=postgres
POSTGRES_USER=traffic_user
POSTGRES_PASSWORD=your_password
REDIS_HOST=redis
SECRET_KEY=your_secret_key
```

### Simulation Parameters
- Target URL
- Session count (1-10,000)
- Concurrent sessions (1-100)
- Demographics distribution
- Behavioral personas

## Monitoring

### Check Status
```bash
docker-compose ps
docker-compose logs -f backend
```

### Database Access
```bash
docker-compose exec postgres psql -U traffic_user -d traffic_power_tool
```

### Redis Access
```bash
docker-compose exec redis redis-cli
```

## Troubleshooting

### Common Issues
1. **Port conflicts**: Change ports in docker-compose.yml
2. **Memory issues**: Increase Docker memory limits
3. **Database connection**: Check PostgreSQL container status

### Reset Application
```bash
docker-compose down -v
docker-compose up -d
```

## License

MIT License - see LICENSE file for details.

---

**Traffic Power Tool v2.0** - Professional Traffic Simulation Platform