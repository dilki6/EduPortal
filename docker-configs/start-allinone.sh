#!/bin/bash
set -e

echo "========================================="
echo "  EduPortal All-in-One Container"
echo "========================================="
echo ""

# Create data directory if not exists
mkdir -p /app/data

# Check if database exists
if [ ! -f /app/data/eduportal.db ]; then
    echo "[INFO] First time setup - Database will be created automatically by EF Core"
    echo "[INFO] Demo data will be seeded on first run"
fi

# Start Ollama service in background
echo "[INFO] Starting Ollama service..."
ollama serve > /var/log/supervisor/ollama-startup.log 2>&1 &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "[INFO] Waiting for Ollama to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "[OK] Ollama service is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "[WARNING] Ollama service did not start in time, continuing anyway..."
    fi
    sleep 1
done

# Check if model exists, download if not
echo "[INFO] Checking for AI model..."
if ! ollama list | grep -q "qwen2.5:3b"; then
    echo "[INFO] Downloading Ollama model (qwen2.5:3b - ~2.3GB)..."
    echo "[INFO] This is a one-time download, please be patient..."
    echo "[INFO] You can monitor progress in the logs"
    (ollama pull qwen2.5:3b > /var/log/supervisor/ollama-download.log 2>&1 && \
     echo "[OK] AI model downloaded successfully" || \
     echo "[WARNING] Model download failed, AI evaluation will not work") &
else
    echo "[OK] AI model already exists"
fi

# Start all services with supervisor
echo "[INFO] Starting all services (Backend, Frontend, Nginx)..."
echo ""
echo "========================================="
echo "  Services Starting..."
echo "========================================="
echo "  Backend API:  http://localhost:5000"
echo "  Frontend:     http://localhost:80"
echo "  Ollama:       http://localhost:11434"
echo "========================================="
echo ""
echo "Default credentials:"
echo "  Teacher: teacher1 / password123"
echo "  Student: student1 / password123"
echo ""

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
