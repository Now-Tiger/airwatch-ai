#!/bin/sh
set -e

echo "Running migrations..."
alembic upgrade head

echo "Running database seeders..."
python -m scripts.seed_escalation_matrix

echo "Starting API..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
