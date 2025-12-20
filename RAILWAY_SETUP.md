# Railway Deployment Guide

This repository is configured for deployment on [Railway](https://railway.app/).

## Configuration

The deployment uses a multi-stage `Dockerfile` located in the root directory.
It builds both the React frontend (using Bun) and the .NET backend, and serves them as a single application.

### Prerequisites

1.  **Railway Account**: Sign up at railway.app.
2.  **GitHub Repository**: Ensure this code is pushed to a GitHub repository.

### Deployment Steps

1.  **New Project**: In Railway, create a "New Project" -> "Deploy from GitHub repo".
2.  **Select Repository**: Choose this repository.
3.  **Variables**: Add the following environment variables in the Railway dashboard:
    *   `ASPNETCORE_ENVIRONMENT`: `Production`
    *   `JwtSettings__SecretKey`: (Generate a strong secret key)
    *   `ConnectionStrings__DefaultConnection`: `Data Source=/app/data/eduportal.db` (Recommended for SQLite with Volume)
4.  **Volume (For SQLite Persistence)**:
    *   If using SQLite, you **must** add a Volume to persist data.
    *   Mount path: `/app/data`
    *   Update the connection string to point to this path (e.g., `Data Source=/app/data/eduportal.db`).

### Port

The application listens on port `8080`. Railway should automatically detect this from the `Dockerfile`.

### Troubleshooting

*   **Build Failures**: Check the "Build Logs" in Railway.
*   **Runtime Errors**: Check the "Deploy Logs".
*   **Database Issues**: Ensure the volume is mounted correctly if using SQLite.
