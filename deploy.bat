@echo off
REM ============================================
REM EduPortal - Windows Deployment Script
REM Optimized Build and Run
REM ============================================

setlocal enabledelayedexpansion

echo ============================================
echo   EduPortal Docker Deployment (Windows)
echo ============================================
echo.

REM ============================================
REM Check Docker
REM ============================================
echo [1/6] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://docker.com
    pause
    exit /b 1
)
echo [OK] Docker is installed
echo.

REM ============================================
REM Configuration
REM ============================================
set IMAGE_NAME=eduportal
set IMAGE_TAG=latest
set CONTAINER_NAME=eduportal
set DATA_DIR=%CD%\data

REM ============================================
REM Stop and Remove Existing Container
REM ============================================
echo [2/6] Stopping existing container (if any)...
docker stop %CONTAINER_NAME% >nul 2>&1
docker rm %CONTAINER_NAME% >nul 2>&1
echo [OK] Cleanup completed
echo.

REM ============================================
REM Build Image
REM ============================================
echo [3/6] Building Docker image...
echo This may take 5-10 minutes on first build
echo.

docker build ^
    --tag %IMAGE_NAME%:%IMAGE_TAG% ^
    --build-arg VITE_API_BASE_URL=/api ^
    --progress=plain ^
    --file Dockerfile ^
    .

if errorlevel 1 (
    echo.
    echo [ERROR] Docker build failed
    pause
    exit /b 1
)

echo.
echo [OK] Image built successfully
echo.

REM ============================================
REM Create Data Directory
REM ============================================
echo [4/6] Creating data directory...
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%DATA_DIR%\db" mkdir "%DATA_DIR%\db"
if not exist "%DATA_DIR%\ollama" mkdir "%DATA_DIR%\ollama"
if not exist "%DATA_DIR%\backups" mkdir "%DATA_DIR%\backups"
echo [OK] Data directory ready: %DATA_DIR%
echo.

REM ============================================
REM Run Container
REM ============================================
echo [5/6] Starting container...
echo.

docker run -d ^
    --name %CONTAINER_NAME% ^
    --restart unless-stopped ^
    -p 80:80 ^
    -p 5000:5000 ^
    -p 11434:11434 ^
    -v "%DATA_DIR%:/data" ^
    -e TZ=America/New_York ^
    --health-cmd "curl -f http://localhost/api/health || exit 1" ^
    --health-interval 30s ^
    --health-timeout 10s ^
    --health-retries 3 ^
    --health-start-period 120s ^
    %IMAGE_NAME%:%IMAGE_TAG%

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to start container
    pause
    exit /b 1
)

echo [OK] Container started successfully
echo.

REM ============================================
REM Wait and Display Status
REM ============================================
echo [6/6] Waiting for services to initialize...
echo This may take 2-3 minutes...
echo.

timeout /t 10 /nobreak >nul

REM Show logs
echo ============================================
echo   Container Logs (Last 20 lines)
echo ============================================
docker logs --tail 20 %CONTAINER_NAME%
echo.

REM ============================================
REM Display Information
REM ============================================
echo ============================================
echo   Deployment Complete!
echo ============================================
echo.
echo   Frontend:     http://localhost
echo   Backend API:  http://localhost/api
echo   Swagger:      http://localhost/api/swagger
echo   Health Check: http://localhost/api/health
echo.
echo ============================================
echo   Default Credentials
echo ============================================
echo   Teacher: teacher/teacher123
echo   Student: student/student123
echo.
echo ============================================
echo   Useful Commands
echo ============================================
echo   View logs:    docker logs -f %CONTAINER_NAME%
echo   Stop:         docker stop %CONTAINER_NAME%
echo   Start:        docker start %CONTAINER_NAME%
echo   Restart:      docker restart %CONTAINER_NAME%
echo   Shell:        docker exec -it %CONTAINER_NAME% /bin/bash
echo   Remove:       docker stop %CONTAINER_NAME% ^&^& docker rm %CONTAINER_NAME%
echo.
echo ============================================
echo   Data Location: %DATA_DIR%
echo ============================================
echo.

REM Open browser
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost

pause
