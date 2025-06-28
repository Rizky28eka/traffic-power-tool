#!/bin/bash
set -e

echo "Waiting for PostgreSQL to start..."
while ! pg_isready -h localhost -p 5432 -U traffic_user; do
  sleep 1
done

echo "PostgreSQL is ready!"

# Initialize database schema
psql -h localhost -U traffic_user -d traffic_power_tool -f /app/init.sql || true

echo "Database initialization completed!"