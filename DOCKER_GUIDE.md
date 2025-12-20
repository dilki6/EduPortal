# 🐳 EduPortal Docker Implementation Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Deployment Options](#deployment-options)
- [Configuration](#configuration)
- [Performance Optimizations](#performance-optimizations)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### What's Included
This Docker implementation provides a **production-ready, optimized** containerized deployment of the EduPortal Learning Management System.

**Technology Stack:**
- **Frontend**: React 18 + Vite + TypeScript (served by Nginx)
- **Backend**: .NET 8.0 ASP.NET Core Web API
- **Database**: SQLite (persistent storage)
- **AI Service**: Ollama with qwen2.5:3b model
- **Web Server**: Nginx (reverse proxy, static files)
- **Process Manager**: Supervisor (multi-service orchestration)

### Key Features
✅ **Multi-stage builds** - Optimized image size (~1.2GB)  
✅ **Fast startup** - Ready in 2-3 minutes  
✅ **Auto-restart** - Supervisor manages all services  
✅ **Health checks** - Automatic service monitoring  
✅ **Security hardened** - Non-root user, minimal attack surface  
✅ **Production-ready** - Environment-specific configurations  
✅ **Easy deployment** - One-command setup  

---

## 🏗️ Architecture

### Container Structure
```
┌─────────────────────────────────────────────┐
│           EduPortal Container               │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │  Nginx (Port 80)                    │   │
│  │  - Reverse Proxy                    │   │
│  │  - Static File Server               │   │
│  │  - Gzip Compression                 │   │
│  └─────────────────────────────────────┘   │
│              ↓                              │
│  ┌─────────────────────────────────────┐   │
│  │  Backend API (Port 5000)            │   │
│  │  - .NET 8.0 Web API                 │   │
│  │  - Entity Framework Core            │   │
│  │  - JWT Authentication               │   │
│  └─────────────────────────────────────┘   │
│              ↓                              │
│  ┌─────────────────────────────────────┐   │
│  │  SQLite Database                    │   │
│  │  - Persistent storage at /data/db   │   │
│  └─────────────────────────────────────┘   │
│              ↓                              │
│  ┌─────────────────────────────────────┐   │
│  │  Ollama AI (Port 11434)             │   │
│  │  - LLM inference engine             │   │
│  │  - qwen2.5:3b model (~2.3GB)        │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Build Process (Multi-Stage)
```
Stage 1: Frontend Build (Node 20 Alpine)
├─ npm ci (install dependencies)
├─ vite build (production bundle)
└─ Output: /build/dist (~5MB)

Stage 2: Backend Build (.NET SDK 8.0 Alpine)
├─ dotnet restore
├─ dotnet publish (optimized)
└─ Output: /app/publish (~50MB)

Stage 3: Runtime (.NET Runtime 8.0 Alpine)
├─ Copy frontend from Stage 1
├─ Copy backend from Stage 2
├─ Install Nginx + Supervisor + Ollama
├─ Configure services
└─ Final image: ~1.2GB
```

---

## 🚀 Quick Start

### Prerequisites
- **Docker** 20.10+ ([Download](https://docker.com))
- **Docker Compose** 1.29+ (included with Docker Desktop)
- **8GB RAM** minimum (12GB recommended for Ollama)
- **10GB disk space** (for image + data)

### Option 1: Automated Deployment (Recommended)

**Windows:**
```cmd
deploy.bat
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

This script will:
1. ✅ Check Docker installation
2. ✅ Build optimized image
3. ✅ Create data directory
4. ✅ Start container with proper configuration
5. ✅ Open browser to http://localhost

### Option 2: Docker Compose

```bash
# Development
docker-compose up

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Build only
docker-compose build --parallel

# View logs
docker-compose logs -f
```

### Option 3: Manual Docker Commands

```bash
# Build
docker build -t eduportal:latest .

# Run
docker run -d \
  --name eduportal \
  --restart unless-stopped \
  -p 80:80 \
  -p 5000:5000 \
  -p 11434:11434 \
  -v $(pwd)/data:/data \
  eduportal:latest

# View logs
docker logs -f eduportal
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ASPNETCORE_ENVIRONMENT` | Production | ASP.NET environment |
| `ASPNETCORE_URLS` | http://+:5000 | Backend binding |
| `TZ` | UTC | Timezone |
| `ConnectionStrings__DefaultConnection` | /data/db/eduportal.db | Database path |
| `JwtSettings__SecretKey` | (default) | JWT secret key |
| `Ollama__Url` | http://localhost:11434 | Ollama API endpoint |
| `Ollama__Model` | qwen2.5:3b | AI model name |

### Build Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | /api | Frontend API base URL |

Example:
```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  -t eduportal:latest .
```

### Volume Mounts

```yaml
volumes:
  - ./data:/data              # Main data directory
    ├── db/                   # SQLite database
    │   └── eduportal.db
    ├── ollama/               # AI models
    │   └── models/
    └── backups/              # Automated backups
```

### Port Mapping

| Container | Host | Service |
|-----------|------|---------|
| 80 | 80 | Nginx (Frontend + API proxy) |
| 5000 | 5000 | Backend API (direct access) |
| 11434 | 11434 | Ollama API |

---

## ⚡ Performance Optimizations

### 1. Build Optimizations
- **Multi-stage builds** - Separate build and runtime
- **Layer caching** - Package files copied first
- **Alpine base images** - Smaller image size
- **Parallel builds** - `docker-compose build --parallel`
- **No source maps** - Removed in production builds

### 2. Runtime Optimizations
- **Nginx worker processes**: Auto (CPU cores)
- **Nginx worker connections**: 4096
- **Gzip compression**: Enabled for text assets
- **Static file caching**: 1 year for versioned assets
- **Proxy buffering**: Optimized buffer sizes
- **Keepalive connections**: 65s timeout

### 3. Database Optimizations
- **SQLite WAL mode**: Better concurrency
- **Auto backups**: Created on startup
- **Persistent volume**: Survives container restarts

### 4. Ollama Optimizations
- **Model preloading**: Downloaded on first start
- **Background download**: Non-blocking startup
- **Shared memory**: Efficient model loading

### Benchmark Results
```
Build time (first):    5-8 minutes
Build time (cached):   30-60 seconds
Startup time:          2-3 minutes
Image size:            ~1.2GB
Memory usage:          2-4GB (4-6GB with Ollama active)
Response time (API):   <100ms
Response time (AI):    2-5 seconds (qwen2.5:3b)
```

---

## 📊 Monitoring & Maintenance

### Health Checks

Container health check runs every 30 seconds:
```bash
curl -f http://localhost/api/health || exit 1
```

Check health status:
```bash
docker ps --filter name=eduportal --format "table {{.Names}}\t{{.Status}}"
```

### Viewing Logs

**All services:**
```bash
docker logs -f eduportal
```

**Specific service (inside container):**
```bash
docker exec eduportal tail -f /var/log/supervisor/backend-stdout.log
docker exec eduportal tail -f /var/log/supervisor/nginx-stdout.log
docker exec eduportal tail -f /var/log/supervisor/ollama-stdout.log
```

**Log locations:**
```
/var/log/supervisor/
├── supervisord.log         # Main supervisor log
├── backend-stdout.log      # Backend API output
├── backend-stderr.log      # Backend API errors
├── nginx-stdout.log        # Nginx output
├── nginx-stderr.log        # Nginx errors
├── ollama-stdout.log       # Ollama output
├── ollama-stderr.log       # Ollama errors
└── model-download.log      # AI model download progress
```

### Resource Monitoring

**Container stats:**
```bash
docker stats eduportal
```

**Disk usage:**
```bash
docker exec eduportal du -sh /data/*
```

**Service status (inside container):**
```bash
docker exec eduportal supervisorctl status
```

### Database Backups

**Manual backup:**
```bash
docker exec eduportal cp /data/db/eduportal.db /data/backups/backup-$(date +%Y%m%d).db
```

**Automated backups** are created on container start in `/data/backups/`

**Restore from backup:**
```bash
docker exec eduportal cp /data/backups/backup-20241220.db /data/db/eduportal.db
docker restart eduportal
```

### Updating the Application

**Option 1: Rebuild and replace**
```bash
# Stop container
docker stop eduportal

# Rebuild image
docker build -t eduportal:latest .

# Start new container (data persists)
docker start eduportal
```

**Option 2: Blue-Green deployment**
```bash
# Build new version
docker build -t eduportal:v2 .

# Run new container on different port
docker run -d --name eduportal-v2 -p 8080:80 -v ./data:/data eduportal:v2

# Test on port 8080

# Switch: stop old, rename new
docker stop eduportal
docker rm eduportal
docker rename eduportal-v2 eduportal
docker update --restart unless-stopped eduportal
```

---

## 🔧 Troubleshooting

### Container won't start

**Check logs:**
```bash
docker logs eduportal
```

**Common issues:**
- Port already in use: Change port mapping `-p 8080:80`
- Permission denied: Run with `sudo` (Linux) or check Docker Desktop
- Disk space: Clean up with `docker system prune -a`

### Service not responding

**Check which services are running:**
```bash
docker exec eduportal supervisorctl status
```

**Expected output:**
```
backend    RUNNING   pid 123, uptime 0:05:00
nginx      RUNNING   pid 124, uptime 0:05:00
ollama     RUNNING   pid 122, uptime 0:05:00
```

**Restart specific service:**
```bash
docker exec eduportal supervisorctl restart backend
```

### Database errors

**Reset database:**
```bash
docker exec eduportal rm /data/db/eduportal.db
docker restart eduportal
```
Note: This will create a fresh database with sample data.

### Ollama model not downloading

**Check download progress:**
```bash
docker exec eduportal tail -f /var/log/supervisor/model-download.log
```

**Manual download:**
```bash
docker exec eduportal ollama pull qwen2.5:3b
```

### High memory usage

**Check Ollama:**
```bash
docker exec eduportal ps aux | grep ollama
```

**Reduce Ollama memory:**
```bash
# Use smaller model
docker exec eduportal ollama pull qwen2.5:1.5b

# Update appsettings.json to use new model
```

### Network issues

**Test connectivity inside container:**
```bash
docker exec eduportal curl http://localhost/api/health
docker exec eduportal curl http://localhost:5000/api/health
docker exec eduportal curl http://localhost:11434/api/tags
```

**Reset network:**
```bash
docker network disconnect bridge eduportal
docker network connect bridge eduportal
docker restart eduportal
```

### Performance issues

**1. Check resource limits:**
```yaml
# docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 8G
```

**2. Check disk I/O:**
```bash
docker stats eduportal --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.BlockIO}}"
```

**3. Optimize Nginx:**
```bash
# Check Nginx status
docker exec eduportal curl http://localhost/nginx_status
```

---

## 🔐 Security Best Practices

### 1. Change Default Credentials
After first login, immediately change:
- Teacher: teacher/teacher123
- Student: student/student123

### 2. Update JWT Secret
Edit `docker-configs/appsettings.Docker.json`:
```json
{
  "JwtSettings": {
    "SecretKey": "YourCustomVeryLongSecretKeyHere123456789"
  }
}
```

### 3. Use Environment Variables
Never commit secrets to Git:
```bash
docker run -d \
  -e JwtSettings__SecretKey=$JWT_SECRET \
  eduportal:latest
```

### 4. Enable HTTPS
Use a reverse proxy (Nginx, Traefik, Caddy):
```yaml
# docker-compose.yml with Traefik
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.eduportal.rule=Host(`eduportal.example.com`)"
  - "traefik.http.routers.eduportal.tls.certresolver=letsencrypt"
```

### 5. Limit Exposed Ports
Production should only expose port 80 (or 443 with HTTPS):
```yaml
ports:
  - "80:80"
  # Remove direct API and Ollama access
```

---

## 📚 Additional Resources

### Docker Commands Cheat Sheet
```bash
# Container management
docker ps -a                           # List all containers
docker start eduportal                 # Start container
docker stop eduportal                  # Stop container
docker restart eduportal               # Restart container
docker rm eduportal                    # Remove container

# Image management
docker images                          # List images
docker rmi eduportal:latest            # Remove image
docker pull eduportal:latest           # Pull from registry
docker push eduportal:latest           # Push to registry

# Logs and debugging
docker logs -f eduportal               # Follow logs
docker logs --tail 100 eduportal       # Last 100 lines
docker exec -it eduportal /bin/bash    # Interactive shell
docker inspect eduportal               # Container details

# Cleanup
docker system prune                    # Remove unused data
docker system prune -a                 # Remove all unused data
docker volume prune                    # Remove unused volumes
```

### Files Overview
```
EduPortal/
├── Dockerfile                         # Main optimized Dockerfile
├── .dockerignore                      # Build context exclusions
├── docker-compose.yml                 # Base compose config
├── docker-compose.prod.yml            # Production overrides
├── docker-compose.dev.yml             # Development overrides
├── deploy.bat                         # Windows deployment script
├── deploy.sh                          # Linux/Mac deployment script
└── docker-configs/
    ├── entrypoint.sh                  # Container startup script
    ├── nginx-optimized.conf           # Nginx main config
    ├── nginx-site.conf                # Site-specific config
    ├── supervisord.conf               # Service orchestration
    └── appsettings.Docker.json        # Backend configuration
```

---

## 📞 Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review Docker logs: `docker logs -f eduportal`
3. Create an issue on GitHub
4. Contact: support@eduportal.com

---

**Built with ❤️ for Education**
