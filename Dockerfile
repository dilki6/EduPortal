# ============================================
# EduPortal - Optimized Multi-Stage Dockerfile
# ============================================
# Architecture: React (Vite) + .NET 8 API + SQLite + Ollama AI
# Build time: ~5-8 minutes | Image size: ~1.2GB (optimized)
# ============================================

# ============================================
# Stage 1: Frontend Build (Node.js)
# ============================================
FROM node:20-alpine AS frontend-builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /build

# Copy package files for layer caching
COPY web/package*.json ./
COPY web/bun.lockb* ./

# Install dependencies with frozen lockfile
RUN npm ci --prefer-offline --no-audit --progress=false

# Copy source files
COPY web/ ./

# Build argument for API URL (override at build time)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build production bundle with optimizations
ENV NODE_ENV=production
RUN npm run build && \
    # Verify build output
    ls -lah dist/ && \
    # Remove source maps in production for security
    find dist -name "*.map" -type f -delete

# ============================================
# Stage 2: Backend Build (.NET)
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS backend-builder

WORKDIR /build

# Copy project file for layer caching
COPY service/EduPortal.Api/EduPortal.Api.csproj ./EduPortal.Api/

# Restore dependencies
RUN dotnet restore "./EduPortal.Api/EduPortal.Api.csproj" \
    --runtime linux-musl-x64 \
    --verbosity minimal

# Copy source code
COPY service/EduPortal.Api/ ./EduPortal.Api/

# Build and publish with optimizations
WORKDIR /build/EduPortal.Api
RUN dotnet publish "EduPortal.Api.csproj" \
    --configuration Release \
    --runtime linux-musl-x64 \
    --self-contained false \
    --output /app/publish \
    --no-restore \
    --verbosity minimal \
    /p:PublishTrimmed=false \
    /p:PublishSingleFile=false \
    /p:DebugType=None \
    /p:DebugSymbols=false

# ============================================
# Stage 3: Runtime (Production)
# ============================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine

# Metadata labels
LABEL maintainer="EduPortal Team"
LABEL description="EduPortal - Complete Learning Management System"
LABEL version="1.0"

# Install runtime dependencies (minimal set)
RUN apk add --no-cache \
    # Core utilities
    bash curl ca-certificates tzdata \
    # Web server
    nginx \
    # Database
    sqlite \
    # Process supervisor
    supervisor \
    # For Ollama installation
    wget \
    && rm -rf /var/cache/apk/*

# Install Ollama (optimized installation)
RUN curl -fsSL https://ollama.com/install.sh | sh

# Create non-root user for security
RUN addgroup -g 1000 eduportal && \
    adduser -D -u 1000 -G eduportal eduportal && \
    # Create required directories
    mkdir -p /app /data/db /data/ollama /var/www/html \
             /var/log/supervisor /var/log/nginx \
             /run/nginx && \
    # Set permissions
    chown -R eduportal:eduportal /app /data /var/www/html /var/log/supervisor /var/log/nginx /run/nginx

# ============================================
# Setup Backend API
# ============================================
WORKDIR /app

# Copy published backend
COPY --from=backend-builder --chown=eduportal:eduportal /app/publish ./

# Copy backend configuration
COPY --chown=eduportal:eduportal docker-configs/appsettings.Docker.json ./appsettings.Production.json

# ============================================
# Setup Frontend
# ============================================
COPY --from=frontend-builder --chown=eduportal:eduportal /build/dist /var/www/html/

# ============================================
# Setup Nginx
# ============================================
COPY docker-configs/nginx-optimized.conf /etc/nginx/nginx.conf
COPY docker-configs/nginx-site.conf /etc/nginx/http.d/default.conf

# Remove default nginx config
RUN rm -f /etc/nginx/http.d/default.conf.default

# ============================================
# Setup Supervisor
# ============================================
COPY docker-configs/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ============================================
# Setup Startup Script
# ============================================
COPY docker-configs/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && \
    chown eduportal:eduportal /entrypoint.sh

# ============================================
# Configuration
# ============================================

# Environment variables
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://+:5000 \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false \
    OLLAMA_HOST=http://localhost:11434 \
    TZ=UTC

# Expose ports
EXPOSE 80 5000 11434

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1

# Note: Use Railway volumes instead of VOLUME keyword
# Add volume via Railway Dashboard: Settings -> Volumes -> Mount Path: /data

# Switch to non-root user
USER eduportal

# Startup
ENTRYPOINT ["/entrypoint.sh"]
CMD ["supervisord"]
