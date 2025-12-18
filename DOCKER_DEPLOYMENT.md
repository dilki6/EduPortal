# EduPortal All-in-One Docker Deployment

## Overview

This deployment packages **all** EduPortal services into a **single Docker container**:
- **Frontend**: React app served by Nginx (Port 80)
- **Backend**: .NET 8.0 Web API (Port 5000)
- **Database**: SQLite embedded database
- **AI Service**: Ollama with qwen2.5:3b model (Port 11434)

**Total Image Size**: ~4GB (includes Ollama model)

## Prerequisites

- Docker Desktop installed and running
- 8GB+ available disk space
- 4GB+ RAM available
- Internet connection (for first-time setup)

## Quick Start

### Windows

```cmd
cd c:\Users\USER\Documents\GitHub\EduPortal
deploy-allinone.bat
```

### Linux/Mac

```bash
cd /path/to/EduPortal
chmod +x deploy-allinone.sh
./deploy-allinone.sh
```

## What Happens During Deployment

1. **Docker Check**: Validates Docker is installed and running
2. **Image Build**: 
   - Builds React frontend (production optimized)
   - Compiles .NET backend
   - Installs Nginx, Supervisor, Ollama, SQLite
   - Creates ~4GB final image
3. **Volume Creation**: 
   - `eduportal-data`: Stores SQLite database
   - `eduportal-ollama`: Stores Ollama models
4. **Container Start**: Launches all services via Supervisor
5. **First-Run Setup**:
   - Creates SQLite database if not exists
   - Downloads qwen2.5:3b model (~2.3GB, one-time)
   - Seeds database with sample data
6. **Browser Launch**: Opens http://localhost

**Total deployment time**: 5-15 minutes (first run), 1-2 minutes (subsequent runs)

## Architecture

```
┌─────────────────────────────────────────┐
│        Docker Container (Port 80)       │
│                                         │
│  ┌────────────────────────────────┐    │
│  │   Nginx (Frontend Server)      │    │
│  │   - Serves React app           │    │
│  │   - Proxies /api to Backend    │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │   .NET Backend (Port 5000)     │    │
│  │   - REST API                   │    │
│  │   - JWT Authentication         │    │
│  │   - SQLite Database            │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │   Ollama (Port 11434)          │    │
│  │   - qwen2.5:3b model           │    │
│  │   - AI assessment evaluation   │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │   Supervisor Process Manager   │    │
│  │   - Manages all services       │    │
│  │   - Auto-restart on failure    │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
         │                    │
         ▼                    ▼
   eduportal-data      eduportal-ollama
   (SQLite DB)         (AI Models)
```

## Exposed Ports

| Port  | Service          | Access                  |
|-------|------------------|-------------------------|
| 80    | Frontend (Nginx) | http://localhost        |
| 5000  | Backend API      | http://localhost:5000   |
| 11434 | Ollama AI        | http://localhost:11434  |

## Data Persistence

Data is stored in Docker volumes and persists across container restarts:

- **eduportal-data**: SQLite database file (`/app/data/eduportal.db`)
- **eduportal-ollama**: Ollama models (`/root/.ollama`)

### Backup Data

```bash
# Backup database
docker cp eduportal:/app/data/eduportal.db ./backup-eduportal.db

# Backup Ollama models
docker run --rm -v eduportal-ollama:/data -v $(pwd):/backup alpine tar czf /backup/ollama-models.tar.gz -C /data .
```

### Restore Data

```bash
# Restore database
docker cp ./backup-eduportal.db eduportal:/app/data/eduportal.db
docker restart eduportal

# Restore Ollama models
docker run --rm -v eduportal-ollama:/data -v $(pwd):/backup alpine tar xzf /backup/ollama-models.tar.gz -C /data
docker restart eduportal
```

## Container Management

### Start Container
```bash
docker start eduportal
```

### Stop Container
```bash
docker stop eduportal
```

### View Logs
```bash
# All services
docker logs eduportal

# Follow logs in real-time
docker logs -f eduportal

# Specific service logs (inside container)
docker exec eduportal tail -f /var/log/supervisor/ollama.log
docker exec eduportal tail -f /var/log/supervisor/nginx.log
docker exec eduportal tail -f /var/log/supervisor/backend.log
```

### Container Status
```bash
docker ps -a --filter name=eduportal
```

### Restart Container
```bash
docker restart eduportal
```

### Remove Container (keeps data)
```bash
docker stop eduportal
docker rm eduportal
```

### Remove Everything (including data)
```bash
docker stop eduportal
docker rm eduportal
docker volume rm eduportal-data eduportal-ollama
docker rmi eduportal-allinone
```

## Troubleshooting

### Container Won't Start

```bash
# Check Docker is running
docker info

# Check logs for errors
docker logs eduportal

# Check if ports are already in use
# Windows:
netstat -ano | findstr ":80"
netstat -ano | findstr ":5000"

# Linux/Mac:
lsof -i :80
lsof -i :5000
```

### Database Issues

```bash
# Access SQLite database directly
docker exec -it eduportal sqlite3 /app/data/eduportal.db

# Inside SQLite:
.tables                          # List tables
SELECT * FROM Users;             # View users
SELECT * FROM Courses;           # View courses
.exit                            # Exit SQLite
```

### Ollama Model Issues

```bash
# Check if model is downloaded
docker exec eduportal ollama list

# Download model manually
docker exec eduportal ollama pull qwen2.5:3b

# Test Ollama service
curl http://localhost:11434/api/tags
```

### Nginx Issues

```bash
# Check Nginx configuration
docker exec eduportal nginx -t

# Reload Nginx
docker exec eduportal supervisorctl restart nginx
```

### Backend Issues

```bash
# Check backend status
docker exec eduportal supervisorctl status backend

# Restart backend
docker exec eduportal supervisorctl restart backend

# View backend logs
docker exec eduportal tail -f /var/log/supervisor/backend.log
```

### Service Management (Inside Container)

```bash
# Access container shell
docker exec -it eduportal bash

# Check all services status
supervisorctl status

# Restart specific service
supervisorctl restart ollama
supervisorctl restart nginx
supervisorctl restart backend

# Stop/start service
supervisorctl stop backend
supervisorctl start backend
```

## Default Credentials

After first deployment, use these credentials to log in:

**Admin Account**:
- Username: `admin`
- Password: `admin123`
- Role: Teacher

**Teacher Account**:
- Username: `teacher`
- Password: `teacher123`
- Role: Teacher

**Student Account**:
- Username: `student`
- Password: `student123`
- Role: Student

**⚠️ Change these passwords immediately in production!**

## Updating the Application

### Method 1: Rebuild Container (recommended)

```bash
# Windows
deploy-allinone.bat

# Linux/Mac
./deploy-allinone.sh
```

This will:
- Build new image with latest code
- Stop old container
- Start new container
- Preserve all data (database, models)

### Method 2: Manual Update

```bash
# Pull latest code
git pull

# Rebuild image
docker build -f Dockerfile.allinone -t eduportal-allinone .

# Recreate container
docker stop eduportal
docker rm eduportal
docker run -d \
  --name eduportal \
  -p 80:80 \
  -p 5000:5000 \
  -p 11434:11434 \
  -v eduportal-data:/app/data \
  -v eduportal-ollama:/root/.ollama \
  --restart unless-stopped \
  eduportal-allinone
```

## Performance Tuning

### Increase Memory Limit

```bash
docker run -d \
  --name eduportal \
  --memory="8g" \
  --cpus="4" \
  -p 80:80 -p 5000:5000 -p 11434:11434 \
  -v eduportal-data:/app/data \
  -v eduportal-ollama:/root/.ollama \
  --restart unless-stopped \
  eduportal-allinone
```

### Ollama Configuration

Edit `docker-configs/start-allinone.sh` before building:

```bash
# Increase context window
export OLLAMA_NUM_CTX=4096

# Use GPU (if available)
export OLLAMA_GPU=1
```

## Production Deployment

### Security Recommendations

1. **Change default passwords** immediately
2. **Enable HTTPS**:
   ```bash
   # Add SSL certificates to nginx config
   # Update docker-configs/nginx-allinone.conf
   ```
3. **Update JWT secret** in `docker-configs/appsettings.Docker.json`
4. **Restrict CORS origins** in backend configuration
5. **Enable firewall** rules to restrict access

### Resource Requirements (Production)

- **CPU**: 4+ cores recommended
- **RAM**: 8GB+ recommended
- **Disk**: 20GB+ (includes logs, backups)
- **Network**: 100Mbps+ for multiple users

### Monitoring

```bash
# Resource usage
docker stats eduportal

# Disk usage
docker exec eduportal df -h

# Process status
docker exec eduportal supervisorctl status
```

## Differences from Multi-Container Setup

| Aspect | All-in-One | Multi-Container (Compose) |
|--------|------------|---------------------------|
| Deployment | Single command | docker-compose up |
| Containers | 1 container | 4 containers |
| Process Manager | Supervisor | Docker |
| Database | SQLite | SQL Server |
| Complexity | Low | Medium |
| Scalability | Limited | High |
| Best For | Development, Small Teams | Production, Large Scale |

## Support

For issues or questions:
1. Check logs: `docker logs eduportal`
2. Review troubleshooting section above
3. Check GitHub Issues
4. Create new issue with logs attached

## License

See LICENSE file in repository.
