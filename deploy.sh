#!/bin/bash
# ============================================
# EduPortal - Linux/Mac Deployment Script
# Optimized Build and Run
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "============================================"
echo "  EduPortal Docker Deployment"
echo "============================================"
echo ""

# ============================================
# Check Docker
# ============================================
log_info "[1/6] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    echo "Please install Docker from https://docker.com"
    exit 1
fi
log_success "Docker is installed ($(docker --version))"
echo ""

# ============================================
# Configuration
# ============================================
IMAGE_NAME="eduportal"
IMAGE_TAG="latest"
CONTAINER_NAME="eduportal"
DATA_DIR="${PWD}/data"

# ============================================
# Stop and Remove Existing Container
# ============================================
log_info "[2/6] Stopping existing container (if any)..."
docker stop ${CONTAINER_NAME} 2>/dev/null || true
docker rm ${CONTAINER_NAME} 2>/dev/null || true
log_success "Cleanup completed"
echo ""

# ============================================
# Build Image
# ============================================
log_info "[3/6] Building Docker image..."
log_info "This may take 5-10 minutes on first build"
echo ""

docker build \
    --tag ${IMAGE_NAME}:${IMAGE_TAG} \
    --build-arg VITE_API_BASE_URL=/api \
    --progress=plain \
    --file Dockerfile \
    .

log_success "Image built successfully"
echo ""

# ============================================
# Create Data Directory
# ============================================
log_info "[4/6] Creating data directory..."
mkdir -p ${DATA_DIR}/{db,ollama,backups}
log_success "Data directory ready: ${DATA_DIR}"
echo ""

# ============================================
# Run Container
# ============================================
log_info "[5/6] Starting container..."
echo ""

docker run -d \
    --name ${CONTAINER_NAME} \
    --restart unless-stopped \
    -p 80:80 \
    -p 5000:5000 \
    -p 11434:11434 \
    -v "${DATA_DIR}:/data" \
    -e TZ=America/New_York \
    --health-cmd "curl -f http://localhost/api/health || exit 1" \
    --health-interval 30s \
    --health-timeout 10s \
    --health-retries 3 \
    --health-start-period 120s \
    ${IMAGE_NAME}:${IMAGE_TAG}

log_success "Container started successfully"
echo ""

# ============================================
# Wait and Display Status
# ============================================
log_info "[6/6] Waiting for services to initialize..."
log_info "This may take 2-3 minutes..."
echo ""

sleep 10

# Show logs
echo "============================================"
echo "  Container Logs (Last 20 lines)"
echo "============================================"
docker logs --tail 20 ${CONTAINER_NAME}
echo ""

# ============================================
# Display Information
# ============================================
echo "============================================"
echo "  Deployment Complete!"
echo "============================================"
echo ""
echo "  Frontend:     http://localhost"
echo "  Backend API:  http://localhost/api"
echo "  Swagger:      http://localhost/api/swagger"
echo "  Health Check: http://localhost/api/health"
echo ""
echo "============================================"
echo "  Default Credentials"
echo "============================================"
echo "  Teacher: teacher/teacher123"
echo "  Student: student/student123"
echo ""
echo "============================================"
echo "  Useful Commands"
echo "============================================"
echo "  View logs:    docker logs -f ${CONTAINER_NAME}"
echo "  Stop:         docker stop ${CONTAINER_NAME}"
echo "  Start:        docker start ${CONTAINER_NAME}"
echo "  Restart:      docker restart ${CONTAINER_NAME}"
echo "  Shell:        docker exec -it ${CONTAINER_NAME} /bin/bash"
echo "  Remove:       docker stop ${CONTAINER_NAME} && docker rm ${CONTAINER_NAME}"
echo ""
echo "============================================"
echo "  Data Location: ${DATA_DIR}"
echo "============================================"
echo ""

# Open browser (if available)
if command -v xdg-open &> /dev/null; then
    log_info "Opening browser..."
    sleep 2
    xdg-open http://localhost &
elif command -v open &> /dev/null; then
    log_info "Opening browser..."
    sleep 2
    open http://localhost &
fi
