@echo off
echo ========================================
echo   EduPortal - All-in-One Docker Deploy
echo   Frontend + Backend + AI + Database
echo ========================================
echo.

echo [1/4] Checking Docker...
docker --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Docker is not installed
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo [OK] Docker found

docker info >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Docker is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)
echo [OK] Docker is running

echo.
echo [2/4] Building all-in-one Docker image...
echo This will take 10-15 minutes on first build...
echo.
docker build -f Dockerfile.allinone -t eduportal:allinone .

if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Build failed
    echo Check the error messages above
    pause
    exit /b 1
)
echo.
echo [OK] Image built successfully

echo.
echo [3/4] Stopping old container if exists...
docker stop eduportal 2>nul
docker rm eduportal 2>nul
echo [OK] Cleanup complete

echo.
echo [4/4] Starting EduPortal container...
docker run -d ^
  --name eduportal ^
  -p 80:80 ^
  -p 5000:5000 ^
  -p 11434:11434 ^
  -v eduportal-data:/app/data ^
  -v eduportal-ollama:/root/.ollama ^
  --restart unless-stopped ^
  eduportal:allinone

if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Failed to start container
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Container is starting up...
echo This may take 2-3 minutes for:
echo   - Database initialization
echo   - Ollama AI model download (~2.3GB)
echo   - Services startup
echo.
echo View startup progress:
echo   docker logs -f eduportal
echo.
echo Access the application:
echo   http://localhost
echo.
echo Default credentials:
echo   Teacher: teacher / teacher123
echo   Student: student / student123
echo.
echo ========================================
echo   Useful Commands
echo ========================================
echo View logs:        docker logs -f eduportal
echo Stop:             docker stop eduportal
echo Start:            docker start eduportal
echo Restart:          docker restart eduportal
echo Remove:           docker rm -f eduportal
echo Shell access:     docker exec -it eduportal bash
echo.
echo Services inside container:
echo   Backend:   http://localhost:5000 (internal)
echo   Frontend:  http://localhost:80
echo   Ollama:    http://localhost:11434 (internal)
echo   Database:  /app/data/eduportal.db (SQLite)
echo.
echo Data volumes:
echo   Database:  eduportal-data
echo   AI Model:  eduportal-ollama
echo.
echo Opening browser in 10 seconds...
echo (Cancel with Ctrl+C if you want to check logs first)
timeout /t 10 /nobreak
start http://localhost
echo.
pause
