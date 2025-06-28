# Multi-stage build untuk aplikasi lengkap dalam 1 container
FROM node:18-alpine AS frontend-builder

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

# Main application stage dengan semua services
FROM python:3.11-slim

# Install system dependencies termasuk PostgreSQL dan Redis
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    wget \
    unzip \
    xvfb \
    netcat-openbsd \
    postgresql \
    postgresql-contrib \
    redis-server \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js untuk serving frontend
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Setup PostgreSQL
USER postgres
RUN /etc/init.d/postgresql start && \
    psql --command "CREATE USER traffic_user WITH SUPERUSER PASSWORD 'traffic_password';" && \
    createdb -O traffic_user traffic_power_tool
USER root

# Setup aplikasi
WORKDIR /app

# Copy dan install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright dan browsers
RUN playwright install --with-deps chromium

# Copy backend source code
COPY backend/ ./

# Copy built frontend dari stage sebelumnya
COPY --from=frontend-builder /app/frontend/.next ./static/.next/
COPY --from=frontend-builder /app/frontend/out ./static/

# Setup database schema
COPY init.sql /docker-entrypoint-initdb.d/

# Create directories
RUN mkdir -p /app/output/profiles /app/logs /app/config /var/log/supervisor

# Setup Nginx configuration
COPY nginx.conf /etc/nginx/sites-available/default

# Setup Supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
RUN chown -R postgres:postgres /var/lib/postgresql

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start all services dengan supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]