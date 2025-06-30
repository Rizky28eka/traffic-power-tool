# Traffic Power Tool

Professional website traffic simulation platform with advanced international demographics and behavioral personas.

## Installation

This project can be run in two ways: using Docker Compose for a containerized setup, or manually for more direct control.

### Option 1: Running with Docker Compose (Recommended)

This method uses Docker to run all services in isolated containers, ensuring consistency across different environments.

**Prerequisites:**
- Docker & Docker-Compose

**Steps:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/traffic-power-tool.git
    cd traffic-power-tool
    ```

2.  **Set up environment variables:**
    Copy the example environment file and customize it if needed.
    ```bash
    cp .env.example .env
    ```

3.  **Build and start the services:**
    ```bash
    docker-compose up --build -d
    ```
    This command builds the images for the frontend and backend and starts all services in detached mode.

4.  **Access the application:**
    -   **Frontend:** [http://localhost](http://localhost)
    -   **Backend API:** [http://localhost:8000](http://localhost:8000)
    -   **API Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

### Option 2: Running Manually Without Docker

This method gives you more flexibility and is useful for debugging or for environments where Docker is not available.

**Prerequisites:**
- Node.js (v18 or higher) and pnpm
- Python (v3.9 or higher) and pip
- MySQL Server
- Redis Server
- Nginx (optional, for production deployment)

**Steps:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/traffic-power-tool.git
    cd traffic-power-tool
    ```

2.  **Set up the database:**
    -   Ensure your MySQL and Redis servers are running.
    -   Create a MySQL database (e.g., `traffic_power_tool`).
    -   Run the database migrations located in `mysql/migrations/0000_init.sql`.

3.  **Configure the Backend:**
    -   Navigate to the backend directory: `cd backend`
    -   Install Python dependencies: `pip install -r requirements.txt`
    -   Set the required environment variables. You can use a `.env` file or set them in your shell:
        ```bash
        export MYSQL_HOST=localhost
        export MYSQL_PORT=3306
        export MYSQL_DB=traffic_power_tool
        export MYSQL_USER=your_mysql_user
        export MYSQL_PASSWORD=your_mysql_password
        export REDIS_HOST=localhost
        export REDIS_PORT=6379
        export SECRET_KEY=a-secure-secret
        ```
    -   Run the backend server:
        ```bash
        python app.py
        ```
        The backend will be available at `http://localhost:8000`.

4.  **Configure the Frontend:**
    -   Navigate to the frontend directory: `cd ../frontend`
    -   Install Node.js dependencies: `pnpm install`
    -   Set the backend URL environment variable:
        ```bash
        export NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
        ```
    -   Run the frontend development server:
        ```bash
        pnpm dev
        ```
        The frontend will be available at `http://localhost:3000`.

5.  **Access the application:**
    -   Open your browser and go to `http://localhost:3000`.

## Architecture

### Services
- **Frontend**: Next.js 15 with TypeScript (Port 3000)
- **Backend**: Python Flask with SocketIO (Port 8000)
- **Database**: MySQL 8.0 (Port 3306)
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
MYSQL_HOST=mysql
MYSQL_USER=traffic_user
MYSQL_PASSWORD=your_password
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
docker-compose exec mysql mysql -u traffic_user -p traffic_power_tool
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