# 🚀 EduPortal Quick Deployment Guide

## One-Line Deployment

### Windows
```cmd
deploy-allinone.bat
```

### Linux/Mac
```bash
chmod +x deploy-allinone.sh && ./deploy-allinone.sh
```

## What You Get

✅ **Complete LMS in one container**:
- React Frontend (Nginx)
- .NET Backend API
- SQLite Database
- Ollama AI (qwen2.5:3b)

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Web App** | http://localhost | See below |
| **API** | http://localhost:5000 | N/A |
| **Swagger** | http://localhost:5000/swagger | N/A |
| **Ollama** | http://localhost:11434 | N/A |

## Default Login

| Role | Username | Password |
|------|----------|----------|
| Teacher | `teacher` | `teacher123` |
| Student | `student` | `student123` |
| Admin | `admin` | `admin123` |

## First Run Timeline

1. **Docker Build**: 3-5 minutes
2. **Ollama Model Download**: 2-5 minutes (2.3GB)
3. **Services Startup**: 30-60 seconds

**Total**: ~5-15 minutes (first time only)

**Subsequent runs**: ~1 minute

## Verify Deployment

```bash
# Check container status
docker ps --filter name=eduportal

# Check all services are running
docker exec eduportal supervisorctl status

# Expected output:
# backend    RUNNING   pid 123, uptime 0:01:00
# nginx      RUNNING   pid 124, uptime 0:01:00
# ollama     RUNNING   pid 125, uptime 0:01:00
```

## Quick Commands

### View Logs
```bash
# All logs
docker logs eduportal

# Follow logs
docker logs -f eduportal

# Service-specific
docker exec eduportal tail -f /var/log/supervisor/backend.log
docker exec eduportal tail -f /var/log/supervisor/nginx.log
docker exec eduportal tail -f /var/log/supervisor/ollama.log
```

### Restart Services
```bash
# Restart container
docker restart eduportal

# Restart specific service
docker exec eduportal supervisorctl restart backend
docker exec eduportal supervisorctl restart nginx
docker exec eduportal supervisorctl restart ollama
```

### Stop/Start
```bash
# Stop
docker stop eduportal

# Start
docker start eduportal

# Remove (keeps data)
docker stop eduportal && docker rm eduportal

# Redeploy (keeps data)
deploy-allinone.bat  # or ./deploy-allinone.sh
```

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr ":80"
# Kill process: taskkill /PID <pid> /F

# Linux/Mac
lsof -i :80
# Kill process: sudo kill -9 <pid>
```

### Container Won't Start
```bash
# Check logs
docker logs eduportal

# Common issues:
# - Port 80 in use: Stop other web servers
# - Docker not running: Start Docker Desktop
# - Insufficient resources: Allocate more RAM to Docker
```

### Database Issues
```bash
# Reset database (WARNING: deletes all data)
docker exec eduportal rm /app/data/eduportal.db
docker restart eduportal
```

### Ollama Model Issues
```bash
# Check if model exists
docker exec eduportal ollama list

# Download manually
docker exec eduportal ollama pull qwen2.5:3b

# Test Ollama
curl http://localhost:11434/api/tags
```

## Data Backup

### Backup Database
```bash
# Backup
docker cp eduportal:/app/data/eduportal.db ./backup-$(date +%Y%m%d).db

# Restore
docker cp ./backup-20240101.db eduportal:/app/data/eduportal.db
docker restart eduportal
```

### Full Backup (including Ollama models)
```bash
# Backup volumes
docker run --rm \
  -v eduportal-data:/data \
  -v eduportal-ollama:/ollama \
  -v $(pwd):/backup \
  alpine tar czf /backup/eduportal-backup-$(date +%Y%m%d).tar.gz /data /ollama

# Restore volumes
docker run --rm \
  -v eduportal-data:/data \
  -v eduportal-ollama:/ollama \
  -v $(pwd):/backup \
  alpine tar xzf /backup/eduportal-backup-20240101.tar.gz
```

## Complete Removal

```bash
# Stop and remove container
docker stop eduportal
docker rm eduportal

# Remove volumes (WARNING: deletes all data)
docker volume rm eduportal-data eduportal-ollama

# Remove image
docker rmi eduportal-allinone

# Free up space
docker system prune -a
```

## Updating

### Update to Latest Code
```bash
# Pull latest changes
git pull

# Rebuild and redeploy (keeps data)
deploy-allinone.bat  # Windows
./deploy-allinone.sh  # Linux/Mac
```

## System Requirements

### Minimum
- **CPU**: 2 cores
- **RAM**: 4GB
- **Disk**: 10GB free
- **OS**: Windows 10+, Linux, macOS

### Recommended
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Disk**: 20GB+ free
- **Network**: Broadband (for first-time model download)

## Docker Settings

### Increase Resources (if slow)

**Docker Desktop → Settings → Resources**:
- **CPUs**: 4+
- **Memory**: 8GB+
- **Disk**: 20GB+

## Feature Testing Checklist

After deployment, test these features:

- [ ] Login as Student (`student` / `student123`)
- [ ] View enrolled courses
- [ ] Take an assessment
- [ ] View progress dashboard
- [ ] Logout

- [ ] Login as Teacher (`teacher` / `teacher123`)
- [ ] View teacher dashboard
- [ ] Create a new course
- [ ] Create an assessment
- [ ] View student submissions
- [ ] Test AI grading (if assessment has subjective questions)

## Getting Help

1. **Check logs**: `docker logs eduportal`
2. **Review documentation**: [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
3. **Common issues**: See troubleshooting section above
4. **Report issue**: Include logs and system info

## Performance Tips

### Speed up Ollama
```bash
# Use smaller context window (faster but less accurate)
# Edit docker-configs/start-allinone.sh before building:
export OLLAMA_NUM_CTX=2048  # Default: 4096

# Rebuild
deploy-allinone.bat
```

### Optimize Database
```bash
# Run VACUUM to optimize SQLite
docker exec eduportal sqlite3 /app/data/eduportal.db "VACUUM;"
```

## Production Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Update JWT secret in `docker-configs/appsettings.Docker.json`
- [ ] Configure HTTPS (add SSL certificates to Nginx)
- [ ] Set up proper firewall rules
- [ ] Configure regular backups
- [ ] Set up monitoring/alerting
- [ ] Update CORS origins for your domain
- [ ] Review and tighten security settings
- [ ] Test backup and restore procedures
- [ ] Document your specific deployment

## Next Steps

1. **Explore the application**: Login and test features
2. **Read full documentation**: [README.md](README.md)
3. **Configure for your needs**: Update settings in `docker-configs/`
4. **Deploy to production**: Follow production checklist above
5. **Customize**: Modify frontend/backend to fit your requirements

---

**Need more help?** See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for comprehensive documentation.
