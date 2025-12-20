#!/bin/bash
# ============================================
# EduPortal Entrypoint Script
# Optimized for fast startup and reliability
# ============================================

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "============================================="
echo "  EduPortal Learning Management System"
echo "  Version: 1.0 | Environment: Production"
echo "============================================="
echo ""

# ============================================
# 1. Initialize Data Directory
# ============================================
log_info "Initializing data directories..."
mkdir -p /data/db /data/ollama /data/backups

# Create symlinks for Ollama
ln -sfn /data/ollama /home/eduportal/.ollama
ln -sfn /data/ollama /root/.ollama

# Fix permissions
chown -R eduportal:eduportal /data /home/eduportal/.ollama
chmod -R 755 /data

log_success "Data directories ready"

# ============================================
# 2. Database Setup
# ============================================
log_info "Checking database..."
DB_PATH="/data/db/eduportal.db"

if [ ! -f "$DB_PATH" ]; then
    log_warn "Database not found - will be created on first API start"
    log_info "Sample data will be seeded automatically"
else
    DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
    log_success "Database exists (${DB_SIZE})"
    
    # Create backup
    BACKUP_FILE="/data/backups/eduportal_$(date +%Y%m%d_%H%M%S).db"
    cp "$DB_PATH" "$BACKUP_FILE" 2>/dev/null || true
    log_info "Backup created: $(basename $BACKUP_FILE)"
fi

# ============================================
# 3. Ollama Service Initialization
# ============================================
log_info "Starting Ollama AI service..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    log_error "Ollama not found - AI features will be unavailable"
    log_info "Application will continue without AI evaluation"
else
    # Start Ollama in background
    log_info "Initializing Ollama service..."
    ollama serve > /var/log/supervisor/ollama.log 2>&1 &
    OLLAMA_PID=$!

    # Wait for Ollama to be ready with timeout
    log_info "Waiting for Ollama service (max 45s)..."
    COUNTER=0
    OLLAMA_READY=false

    while [ $COUNTER -lt 45 ]; do
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            OLLAMA_READY=true
            break
        fi
        
        # Check if Ollama process died
        if ! kill -0 $OLLAMA_PID 2>/dev/null; then
            log_error "Ollama process exited unexpectedly - check /var/log/supervisor/ollama.log"
            cat /var/log/supervisor/ollama.log
            break
        fi
        
        sleep 1
        COUNTER=$((COUNTER + 1))
        [ $((COUNTER % 10)) -eq 0 ] && log_info "Still waiting... (${COUNTER}s)"
    done

    if [ "$OLLAMA_READY" = true ]; then
        log_success "Ollama service started successfully"
        
        # Pull model in background
        MODEL_NAME="qwen2.5:3b"
        log_info "Checking AI model: $MODEL_NAME"
        
        if ollama list 2>/dev/null | grep -q "$MODEL_NAME"; then
            log_success "AI model found: $MODEL_NAME"
        else
            log_info "AI model not found - downloading (qwen2.5:3b - ~2.3GB)..."
            log_info "This is a one-time download, please be patient (5-15 minutes)"
            
            # Download model in background
            (
                ollama pull $MODEL_NAME > /var/log/supervisor/model-download.log 2>&1
                if [ $? -eq 0 ]; then
                    log_success "AI model downloaded successfully: $MODEL_NAME"
                    log_info "AI evaluation is now available"
                else
                    log_error "Failed to download AI model - check /var/log/supervisor/model-download.log"
                fi
            ) &
            
            log_info "Model download started in background (PID: $!)"
        fi
    else
        log_error "Ollama service failed to start - AI features will be unavailable"
        log_info "Application will continue with manual grading only"
        
        # Kill Ollama process if still running
        kill $OLLAMA_PID 2>/dev/null || true
    fi
fi

# ============================================
# 4. Nginx Configuration
# ============================================
log_info "Verifying Nginx configuration..."
nginx -t > /dev/null 2>&1
if [ $? -eq 0 ]; then
    log_success "Nginx configuration valid"
else
    log_error "Nginx configuration invalid - check syntax"
    nginx -t
fi

# ============================================
# 5. System Information
# ============================================
echo ""
echo "============================================="
echo "  System Information"
echo "============================================="
echo "  Hostname:     $(hostname)"
echo "  OS:           $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2 2>/dev/null || echo 'Linux')"

# .NET version (runtime only, no SDK in production)
DOTNET_VERSION=$(/app/EduPortal.Api --version 2>/dev/null || echo "8.0 (Runtime)")
echo "  .NET:         $DOTNET_VERSION"

# Disk usage
DISK_USAGE=$(df -h /data 2>/dev/null | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}' || echo "N/A")
echo "  Disk Usage:   $DISK_USAGE"

# Memory (install procps if needed, otherwise skip)
if command -v free >/dev/null 2>&1; then
    MEMORY=$(free -h 2>/dev/null | grep Mem | awk '{print $3 "/" $2}' || echo "N/A")
    echo "  Memory:       $MEMORY"
fi
echo "============================================="
echo ""

# ============================================
# 6. Service Endpoints
# ============================================
echo "============================================="
echo "  Service Endpoints"
echo "============================================="
echo "  Frontend:     http://localhost"
echo "  Backend API:  http://localhost/api"
echo "  Swagger UI:   http://localhost/api/swagger"
echo "  Ollama API:   http://localhost:11434 (if available)"
echo "  Health Check: http://localhost/api/health"
echo "============================================="
echo ""

# ============================================
# 7. Default Credentials
# ============================================
echo "============================================="
echo "  Default Credentials (CHANGE IN PRODUCTION)"
echo "============================================="
echo "  Teacher: teacher/teacher123"
echo "  Student: student/student123"
echo "============================================="
echo ""

# ============================================
# 8. Start Supervisor
# ============================================
log_info "Starting all services via Supervisor..."
echo ""

# Execute the command passed to the entrypoint
if [ "$1" = "supervisord" ]; then
    exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
else
    exec "$@"
fi
