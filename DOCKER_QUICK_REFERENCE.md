# 🐳 EduPortal Docker - Quick Reference Card

## 🚀 Quick Start

### One-Line Deployment
```bash
# Windows
deploy.bat

# Linux/Mac
./deploy.sh
```

---

## 📋 Essential Commands

### Container Management
```bash
# Start
docker start eduportal

# Stop
docker stop eduportal

# Restart
docker restart eduportal

# Remove
docker stop eduportal && docker rm eduportal

# Status
docker ps -a | grep eduportal
```

### Logs & Debugging
```bash
# View all logs
docker logs -f eduportal

# Last 100 lines
docker logs --tail 100 eduportal

# Shell access
docker exec -it eduportal /bin/bash

# Service status
docker exec eduportal supervisorctl status

# Resource usage
docker stats eduportal
```

### Service-Specific Logs
```bash
# Backend API
docker exec eduportal tail -f /var/log/supervisor/backend-stdout.log

# Nginx
docker exec eduportal tail -f /var/log/supervisor/nginx-stdout.log

# Ollama AI
docker exec eduportal tail -f /var/log/supervisor/ollama-stdout.log
```

---

## 🔧 Build Commands

### Standard Build
```bash
docker build -t eduportal:latest .
```

### Rebuild from Scratch
```bash
docker build --no-cache -t eduportal:latest .
```

### Custom API URL
```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  -t eduportal:latest .
```

### Docker Compose
```bash
# Development
docker-compose up

# Production (detached)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Rebuild
docker-compose build --parallel

# Stop all
docker-compose down
```

---

## 🌐 Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost/api |
| Swagger UI | http://localhost/api/swagger |
| Health Check | http://localhost/api/health |
| Ollama API | http://localhost:11434 |
| Nginx Status | http://localhost/nginx_status (internal) |

---

## 👤 Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Teacher | teacher | teacher123 |
| Student | student | student123 |

**⚠️ Change these in production!**

---

## 💾 Data Persistence

### Volume Location
```
./data/
├── db/eduportal.db          # Database
├── ollama/models/           # AI models
└── backups/                 # Auto backups
```

### Backup Database
```bash
# Create backup
docker exec eduportal cp /data/db/eduportal.db /data/backups/backup-$(date +%Y%m%d).db

# Restore backup
docker exec eduportal cp /data/backups/backup-20241220.db /data/db/eduportal.db
docker restart eduportal
```

### Reset Database
```bash
docker exec eduportal rm /data/db/eduportal.db
docker restart eduportal
```

---

## ⚡ Performance

### Resource Limits
```bash
# Set limits
docker run -d \
  --name eduportal \
  --memory=4g \
  --cpus=2 \
  eduportal:latest
```

### Check Resource Usage
```bash
docker stats eduportal --no-stream
```

### Expected Metrics
- **Memory**: 2-4GB (idle), 4-6GB (AI active)
- **CPU**: 10-20% (idle), 50-80% (AI inference)
- **Disk**: ~1.2GB (image) + ~3GB (data)

---

## 🔍 Health Checks

### Manual Check
```bash
curl http://localhost/api/health
```

### Expected Response
```json
{
  "status": "healthy",
  "timestamp": "2024-12-20T10:30:00Z",
  "version": "1.0",
  "services": {
    "api": "running",
    "database": "connected"
  }
}
```

### Docker Health Status
```bash
docker inspect eduportal --format='{{.State.Health.Status}}'
```

---

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs eduportal

# Check port conflicts
netstat -ano | findstr ":80"  # Windows
lsof -i :80                   # Linux/Mac

# Try different port
docker run -p 8080:80 eduportal:latest
```

### Services Not Running
```bash
# Check which services are up
docker exec eduportal supervisorctl status

# Restart specific service
docker exec eduportal supervisorctl restart backend
docker exec eduportal supervisorctl restart nginx
docker exec eduportal supervisorctl restart ollama
```

### High Memory Usage
```bash
# Check processes
docker exec eduportal ps aux

# Restart container
docker restart eduportal
```

### Database Locked
```bash
# Stop container cleanly
docker stop -t 30 eduportal

# Force remove lock
docker exec eduportal rm /data/db/eduportal.db-shm /data/db/eduportal.db-wal
docker restart eduportal
```

### Ollama Model Not Downloading
```bash
# Check download progress
docker exec eduportal tail -f /var/log/supervisor/model-download.log

# Manual download
docker exec eduportal ollama pull qwen2.5:3b

# List models
docker exec eduportal ollama list
```

---

## 🧹 Cleanup

### Remove Container & Image
```bash
docker stop eduportal
docker rm eduportal
docker rmi eduportal:latest
```

### Clean System
```bash
# Remove unused data
docker system prune

# Remove all unused (including images)
docker system prune -a

# Remove unused volumes
docker volume prune
```

### Disk Space
```bash
# Check Docker disk usage
docker system df

# Check data volume
docker exec eduportal du -sh /data/*
```

---

## 🔐 Security

### Change JWT Secret
```bash
docker run -d \
  -e JwtSettings__SecretKey="YourNewSecretKeyHere123" \
  eduportal:latest
```

### Enable HTTPS (with Reverse Proxy)
```nginx
# nginx.conf (host)
server {
    listen 443 ssl;
    server_name eduportal.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
    }
}
```

---

## 📊 Monitoring

### Real-time Logs
```bash
# Follow all logs
docker logs -f eduportal

# Follow specific service
docker exec eduportal tail -f /var/log/supervisor/backend-stdout.log
```

### Service Status
```bash
# Supervisor status
docker exec eduportal supervisorctl status

# Expected output:
# backend    RUNNING   pid 123, uptime 0:05:00
# nginx      RUNNING   pid 124, uptime 0:05:00
# ollama     RUNNING   pid 122, uptime 0:05:00
```

### Test Connectivity
```bash
# From host
curl http://localhost/api/health

# From container
docker exec eduportal curl http://localhost/api/health
docker exec eduportal curl http://localhost:5000/api/health
docker exec eduportal curl http://localhost:11434/api/tags
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ASPNETCORE_ENVIRONMENT` | Production | Environment mode |
| `ASPNETCORE_URLS` | http://+:5000 | Backend binding |
| `TZ` | UTC | Timezone |
| `ConnectionStrings__DefaultConnection` | /data/db/eduportal.db | DB path |
| `JwtSettings__SecretKey` | (default) | JWT secret |
| `Ollama__Url` | http://localhost:11434 | Ollama endpoint |
| `Ollama__Model` | qwen2.5:3b | AI model |

### Set Environment Variables
```bash
docker run -d \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e TZ=America/New_York \
  -e "JwtSettings__SecretKey=MySecret123" \
  eduportal:latest
```

---

## 📦 Image Management

### List Images
```bash
docker images | grep eduportal
```

### Tag Image
```bash
docker tag eduportal:latest eduportal:v1.0
docker tag eduportal:latest myregistry.com/eduportal:latest
```

### Push to Registry
```bash
# Docker Hub
docker push myusername/eduportal:latest

# Private Registry
docker push registry.example.com/eduportal:latest
```

### Pull from Registry
```bash
docker pull myusername/eduportal:latest
```

---

## 🔄 Updates

### Update Container
```bash
# Stop container
docker stop eduportal

# Remove container (data persists in volume)
docker rm eduportal

# Pull/build new image
docker pull eduportal:latest
# or
docker build -t eduportal:latest .

# Start new container
docker run -d \
  --name eduportal \
  -p 80:80 \
  -v ./data:/data \
  eduportal:latest
```

### Zero-Downtime Update (Blue-Green)
```bash
# Start v2 on different port
docker run -d --name eduportal-v2 -p 8080:80 eduportal:v2

# Test v2
curl http://localhost:8080/api/health

# Switch
docker stop eduportal
docker rm eduportal
docker rename eduportal-v2 eduportal
docker update --restart unless-stopped eduportal
```

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `Dockerfile` | Main optimized build |
| `docker-compose.yml` | Base configuration |
| `docker-compose.prod.yml` | Production overrides |
| `docker-compose.dev.yml` | Development overrides |
| `deploy.bat` | Windows deployment |
| `deploy.sh` | Linux/Mac deployment |
| `DOCKER_GUIDE.md` | Full documentation |
| `DOCKER_IMPLEMENTATION.md` | Implementation details |

---

## 💡 Tips & Tricks

### View Container IP
```bash
docker inspect eduportal | grep IPAddress
```

### Copy Files In/Out
```bash
# Copy to container
docker cp local-file.txt eduportal:/app/

# Copy from container
docker cp eduportal:/data/db/eduportal.db ./backup.db
```

### Execute Commands
```bash
# Run command
docker exec eduportal ls -la /data

# Interactive shell
docker exec -it eduportal /bin/bash

# As specific user
docker exec -u eduportal eduportal whoami
```

### Network Debugging
```bash
# List networks
docker network ls

# Inspect network
docker network inspect bridge

# Test connectivity
docker exec eduportal ping google.com
```

---

## 🎓 Common Workflows

### First Time Setup
```bash
./deploy.sh
# Wait 2-3 minutes
# Browser opens automatically
# Login with teacher/teacher123
```

### Daily Development
```bash
# Start
docker start eduportal

# View logs
docker logs -f eduportal

# Make changes to code
# (rebuild if needed)

# Stop
docker stop eduportal
```

### Production Deployment
```bash
# Build
docker build -t eduportal:prod .

# Run with production config
docker run -d \
  --name eduportal \
  --restart always \
  -p 80:80 \
  -v /mnt/data:/data \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e TZ=UTC \
  eduportal:prod
```

---

**🔗 Full Documentation: [DOCKER_GUIDE.md](DOCKER_GUIDE.md)**

**📖 Implementation Details: [DOCKER_IMPLEMENTATION.md](DOCKER_IMPLEMENTATION.md)**
