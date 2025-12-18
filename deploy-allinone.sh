#!/bin/bash

echo "========================================"
echo "  EduPortal - All-in-One Docker Deploy"
echo "  Frontend + Backend + AI + Database"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Docker
echo "[1/4] Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Docker is not installed"
    echo "Please install from: https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Docker found"

if ! docker info &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Docker is not running"
    echo "Please start Docker and try again"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Docker is running"

# Build image
echo ""
echo "[2/4] Building all-in-one Docker image..."
echo "This will take 10-15 minutes on first build..."
echo ""
docker build -f Dockerfile.allinone -t eduportal-allinone .

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERROR]${NC} Build failed"
    echo "Check the error messages above"
    exit 1
fi
echo ""
echo -e "${GREEN}[OK]${NC} Image built successfully"

# Stop old container
echo ""
echo "[3/4] Stopping old container if exists..."
docker stop eduportal 2>/dev/null
docker rm eduportal 2>/dev/null
echo -e "${GREEN}[OK]${NC} Cleanup complete"

# Start container
echo ""
echo "[4/4] Starting EduPortal container..."
docker run -d \
  --name eduportal \
  -p 80:80 \
  -p 5000:5000 \
  -p 11434:11434 \
  -v eduportal-data:/app/data \
  -v eduportal-ollama:/root/.ollama \
  --restart unless-stopped \
  eduportal-allinone

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERROR]${NC} Failed to start container"
    exit 1
fi

echo ""
echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
echo "Container is starting up..."
echo "This may take 2-3 minutes for:"
echo "  - Database initialization"
echo "  - Ollama AI model download (~2.3GB)"
echo "  - Services startup"
echo ""
echo "View startup progress:"
echo "  docker logs -f eduportal"
echo ""
echo "Access the application:"
echo "  http://localhost"
echo ""
echo "Default credentials:"
echo "  Teacher: teacher / teacher123"
echo "  Student: student / student123"
echo ""
echo "========================================"
echo "  Useful Commands"
echo "========================================"
echo "View logs:        docker logs -f eduportal"
echo "Stop:             docker stop eduportal"
echo "Start:            docker start eduportal"
echo "Restart:          docker restart eduportal"
echo "Remove:           docker rm -f eduportal"
echo "Shell access:     docker exec -it eduportal bash"
echo ""
echo "Services inside container:"
echo "  Backend:   http://localhost:5000 (internal)"
echo "  Frontend:  http://localhost:80"
echo "  Ollama:    http://localhost:11434 (internal)"
echo "  Database:  /app/data/eduportal.db (SQLite)"
echo ""
echo "Data volumes:"
echo "  Database:  eduportal-data"
echo "  AI Model:  eduportal-ollama"
echo ""

# Make scripts executable
chmod +x deploy-allinone.sh

# Open browser
sleep 2
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost
elif command -v open &> /dev/null; then
    open http://localhost
fi
