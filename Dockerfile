# Stage 1: Frontend Builder
# Build the Next.js frontend and create a standalone server.
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
# Use npm ci for reproducible builds, including devDependencies needed for build
RUN npm ci
COPY frontend/ ./
# Build the Next.js application
RUN npm run build

# Stage 2: Backend Builder
# Install Python dependencies in a virtual environment.
FROM python:3.11-slim AS backend-builder
WORKDIR /app
# Create a virtual environment
RUN python -m venv /app/venv
# Copy and install Python dependencies
COPY backend/requirements.txt .
RUN . /app/venv/bin/activate && pip install --no-cache-dir -r requirements.txt
# Install Playwright and its browser dependencies
# We set PLAYWRIGHT_BROWSERS_PATH to a known location inside this stage
ENV PLAYWRIGHT_BROWSERS_PATH=/browsers
RUN . /app/venv/bin/activate && playwright install --with-deps chromium
# Copy backend source code
COPY backend/ ./

# Stage 3: Final Production Image
# Combine frontend, backend, and necessary services into a single image.
FROM python:3.11-slim
# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/venv/bin:$PATH" \
    PLAYWRIGHT_BROWSERS_PATH="/opt/playwright" \
    APP_ENV="production" \
    OUTPUT_DIR="/app/output" \
    LOGS_DIR="/app/logs"

# Install system dependencies: PostgreSQL, Redis, Nginx, Supervisor, and Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gnupg wget unzip xvfb netcat-openbsd \
    postgresql postgresql-contrib redis-server nginx supervisor \
    && rm -rf /var/lib/apt/lists/*
# Install Node.js for serving the frontend
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Create a non-root user for security
RUN groupadd -r appuser && useradd --no-create-home -r -g appuser appuser

# Set up PostgreSQL
USER postgres
RUN /etc/init.d/postgresql start && \
    psql --command "CREATE USER traffic_user WITH SUPERUSER PASSWORD 'traffic_password';" && \
    createdb -O traffic_user traffic_power_tool
USER root

# Set up application directory
WORKDIR /app

# Copy built artifacts from builder stages
COPY --from=backend-builder /app /app
COPY --from=frontend-builder /app/frontend /app/frontend
# Correctly copy the Playwright browsers from the location defined in the backend-builder stage
COPY --from=backend-builder /browsers /opt/playwright

# Copy configuration files
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY nginx.conf /etc/nginx/sites-available/default
# Copy database initialization script
COPY supabase/migrations/0000_init.sql /docker-entrypoint-initdb.d/

# Create necessary directories and set permissions
RUN mkdir -p ${OUTPUT_DIR}/profiles ${LOGS_DIR} /var/log/supervisor \
    && chown -R appuser:appuser /app ${OUTPUT_DIR} ${LOGS_DIR} /opt/playwright \
    && chown -R postgres:postgres /var/lib/postgresql /docker-entrypoint-initdb.d \
    && chown -R appuser:appuser /var/log/supervisor

# Expose the main port (Nginx)
EXPOSE 80

# Health check to verify that the main proxy is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1

# Start all services using Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]