#!/bin/bash
set -e

# Wait for database to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "PostgreSQL is ready!"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
while ! nc -z redis 6379; do
  sleep 1
done
echo "Redis is ready!"

# Run database migrations if needed
echo "Running database setup..."
python -c "
import psycopg2
import os
try:
    conn = psycopg2.connect(
        host=os.environ.get('POSTGRES_HOST', 'postgres'),
        port=int(os.environ.get('POSTGRES_PORT', 5432)),
        database=os.environ.get('POSTGRES_DB', 'traffic_power_tool'),
        user=os.environ.get('POSTGRES_USER', 'traffic_user'),
        password=os.environ.get('POSTGRES_PASSWORD', 'traffic_password')
    )
    print('Database connection successful')
    conn.close()
except Exception as e:
    print(f'Database connection failed: {e}')
    exit(1)
"

# Create necessary directories
mkdir -p /app/output/profiles
mkdir -p /app/logs
mkdir -p /app/config

# Set proper permissions
chmod -R 755 /app/output
chmod -R 755 /app/logs

echo "Starting Traffic Power Tool..."
exec "$@"