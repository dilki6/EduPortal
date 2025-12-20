# Running EduPortal (Full Stack)

This guide explains how to run the entire EduPortal application stack, including the Backend, Frontend, SQL Server Database, and Ollama AI service, using Docker Compose.

## Prerequisites

*   **Docker Desktop**: Ensure Docker Desktop is installed and running.

## Quick Start

### Windows
Double-click `start-all.bat` or run it from the command line:
```cmd
start-all.bat
```

### Linux / macOS
Run the shell script:
```bash
chmod +x start-all.sh
./start-all.sh
```

## Services

The `docker-compose.yml` file orchestrates the following services:

1.  **eduportal**: The main application.
    *   **Frontend**: React app (built with Vite/Bun).
    *   **Backend**: .NET 8 API (serves the frontend).
    *   **URL**: [http://localhost:8080](http://localhost:8080)
2.  **sqlserver**: Microsoft SQL Server 2022.
    *   **Port**: 1433
    *   **Password**: `YourStrong!Passw0rd` (Configured in `docker-compose.yml`)
3.  **ollama**: Ollama AI Service.
    *   **Port**: 11434
    *   **Note**: You may need to pull a model inside the container if it's not pre-loaded.
        *   Command: `docker exec -it eduportal_ollama ollama run qwen2.5:3b` (or your preferred model)

## Configuration

*   **Database Connection**: The app is automatically configured to connect to the `sqlserver` container.
*   **Ollama URL**: The app is configured to talk to `http://ollama:11434`.

## Stopping

To stop all services:
```bash
docker-compose down
```
