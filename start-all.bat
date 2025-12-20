@echo off
echo Starting EduPortal Stack (App, Database, Ollama)...
docker-compose up --build -d
echo.
echo Services are starting...
echo App will be available at http://localhost:8080
echo Database is running on port 1433
echo Ollama is running on port 11434
echo.
echo To stop the services, run: docker-compose down
pause
