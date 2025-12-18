# EduPortal Guide

This guide is the short version for getting EduPortal running, logging in, and managing the all-in-one container.

## What Is Inside
- Frontend (React + Nginx) on port 80
- Backend (.NET 8 API) on port 5000
- SQLite database (persisted to Docker volume)
- Ollama AI (qwen2.5:3b) on port 11434

## Quick Start (All-in-One Docker)

**Windows**
```cmd
cd c:\Users\USER\Documents\GitHub\EduPortal
deploy-allinone.bat
```

**Linux/Mac**
```bash
cd /path/to/EduPortal
chmod +x deploy-allinone.sh
./deploy-allinone.sh
```

First run downloads the AI model (~2.3GB). Subsequent runs start in ~1 minute.

## Access
- Web app: http://localhost
- API: http://localhost:5000
- Swagger: http://localhost:5000/swagger
- Ollama: http://localhost:11434

## Default Logins (change in production)
- Teacher: `teacher` / `teacher123`
- Student: `student` / `student123`
- Admin: `admin` / `admin123`

## Common Docker Commands
```bash
# Status
docker ps --filter name=eduportal

# Logs (follow)
docker logs -f eduportal

# Restart container
docker restart eduportal

# Shell inside
docker exec -it eduportal bash

# Stop / start
docker stop eduportal
docker start eduportal
```

## Data Persistence
- SQLite DB: Docker volume `eduportal-data` → `/app/data/eduportal.db`
- Ollama models: Docker volume `eduportal-ollama` → `/root/.ollama`

## Backup & Restore
```bash
# Backup DB
docker cp eduportal:/app/data/eduportal.db ./backup.db

# Restore DB (overwrites)
docker cp ./backup.db eduportal:/app/data/eduportal.db
docker restart eduportal
```

## Troubleshooting
- Port in use: stop other services on 80/5000.
- Model missing: `docker exec eduportal ollama pull qwen2.5:3b`.
- Services status: `docker exec eduportal supervisorctl status`.
- Recreate fresh (keeps data): rerun deploy script; volumes persist.

## Development (non-Docker)
```bash
# Backend
dotnet restore ./service/EduPortal.Api/EduPortal.Api.csproj
dotnet run --project ./service/EduPortal.Api/EduPortal.Api.csproj

# Frontend
cd web
npm install
npm run dev
```

## Security Checklist for Production
- Change all default passwords.
- Set a strong JWT secret in `docker-configs/appsettings.Docker.json`.
- Configure HTTPS in `docker-configs/nginx-allinone.conf`.
- Lock down CORS to your domain.
- Enable firewall rules and regular backups.

---
For deeper details see `DOCKER_DEPLOYMENT.md` and `README.md`.
