# Stage 1: Build Frontend
FROM oven/bun:1 AS frontend-build
WORKDIR /app
COPY web/package.json web/bun.lockb ./
RUN bun install
COPY web/ .
RUN bun run build

# Stage 2: Build Backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /src
COPY service/EduPortal.Api/EduPortal.Api.csproj ./service/EduPortal.Api/
RUN dotnet restore ./service/EduPortal.Api/EduPortal.Api.csproj
COPY service/ ./service/
WORKDIR /src/service/EduPortal.Api
RUN dotnet publish -c Release -o /app/publish

# Stage 3: Final Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=backend-build /app/publish .
COPY --from=frontend-build /app/dist ./wwwroot
ENTRYPOINT ["dotnet", "EduPortal.Api.dll"]
