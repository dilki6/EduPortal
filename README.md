# EduPortal - Complete Learning Management System

![EduPortal](https://img.shields.io/badge/EduPortal-v1.0-blue)
![.NET](https://img.shields.io/badge/.NET-8.0-purple)
![React](https://img.shields.io/badge/React-18-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-green)

A comprehensive Learning Management System (LMS) with AI-powered assessment evaluation, built with modern web technologies.

## 🚀 Features

### For Students
- 📚 **Course Enrollment**: Browse and enroll in available courses
- 📊 **Progress Tracking**: Real-time tracking of learning progress and quiz scores
- ✅ **Interactive Assessments**: Take quizzes and exams with instant feedback
- 📈 **Performance Analytics**: View detailed statistics and learning trends
- 🎯 **Personalized Dashboard**: Track enrolled courses and recent activity

### For Teachers
- 📝 **Course Management**: Create and manage courses with rich content
- 📋 **Assessment Creation**: Design multiple-choice and subjective assessments
- 🤖 **AI-Powered Grading**: Automatic evaluation of subjective answers using Ollama AI
- 👥 **Student Management**: Monitor student progress and performance
- 📊 **Analytics Dashboard**: View comprehensive teaching statistics

### Technical Features
- 🔐 **Secure Authentication**: JWT-based authentication with BCrypt password hashing
- 🧠 **Local AI Integration**: Ollama with qwen2.5:3b for assessment evaluation
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🐳 **Docker Ready**: Deploy everything with a single command
- 💾 **Data Persistence**: SQLite database with Docker volume persistence

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Deployment Options](#-deployment-options)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Development Setup](#-development-setup)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

## ⚡ Quick Start

### Option 1: All-in-One Docker (Recommended)

**Requirements**: Docker Desktop (8GB+ disk space)

**Windows**:
```cmd
git clone https://github.com/yourusername/EduPortal.git
cd EduPortal
deploy-allinone.bat
```

**Linux/Mac**:
```bash
git clone https://github.com/yourusername/EduPortal.git
cd EduPortal
chmod +x deploy-allinone.sh
./deploy-allinone.sh
```

**First-time deployment takes 5-15 minutes** (downloads Ollama model ~2.3GB)

Access at: **http://localhost**

### Option 2: Multi-Container Docker Compose

```bash
cd service
docker-compose up -d
cd ../web
npm install
npm run dev
```

### Option 3: Manual Development Setup

See [Development Setup](#-development-setup) section below.

## 🐳 Deployment Options

### All-in-One Docker Container (Easiest)

**Single container** with all services:
- ✅ Frontend (Nginx)
- ✅ Backend (.NET API)
- ✅ Database (SQLite)
- ✅ AI Service (Ollama)

**Pros**: 
- One command deployment
- Minimal configuration
- Perfect for development/demos
- Easy backup and restore

**Cons**:
- Less scalable than multi-container
- All services share resources

📖 **Full Guide**: [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

### Multi-Container Docker Compose

**Separate containers** for each service:
- Backend API (Docker)
- Database (SQL Server)
- Frontend (npm dev server)
- Ollama AI (Docker)

**Pros**:
- More scalable
- Independent service management
- Production-ready architecture

**Cons**:
- More complex setup
- Requires SQL Server configuration

📖 **Full Guide**: [service/README.md](service/README.md)

### Manual Setup

Full control over each component:
- Build and run each service separately
- Custom database configuration
- Development with hot-reload

📖 **Full Guide**: See [Development Setup](#-development-setup)

## 🏗️ Architecture

### All-in-One Container Architecture

```
┌─────────────────────────────────────────────────────┐
│              Docker Container (eduportal)           │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │         Supervisor Process Manager           │  │
│  │  (Manages startup order and auto-restart)    │  │
│  └──────────────────────────────────────────────┘  │
│         │              │              │             │
│         ▼              ▼              ▼             │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐   │
│  │   Nginx   │  │  Backend  │  │    Ollama    │   │
│  │  Port 80  │  │ Port 5000 │  │  Port 11434  │   │
│  │           │  │           │  │              │   │
│  │ - React   │  │ - .NET 8  │  │ - qwen2.5:3b │   │
│  │ - Static  │  │ - REST API│  │ - AI Eval    │   │
│  │ - Proxy   │  │ - JWT     │  │              │   │
│  └───────────┘  └─────┬─────┘  └──────────────┘   │
│                       │                             │
│                       ▼                             │
│                ┌──────────────┐                     │
│                │    SQLite    │                     │
│                │  Database    │                     │
│                └──────────────┘                     │
│                       │                             │
└───────────────────────┼─────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  Docker Volumes  │
              │                  │
              │ - eduportal-data │
              │ - eduportal-ollama│
              └──────────────────┘
```

### System Flow

```
User Browser
     │
     ├─→ http://localhost (HTML, CSS, JS)
     │   └─→ Nginx (Port 80)
     │
     ├─→ http://localhost/api/* (REST API)
     │   └─→ Nginx → Backend (Port 5000)
     │       └─→ SQLite Database
     │
     └─→ AI Evaluation Requests
         └─→ Backend → Ollama (Port 11434)
             └─→ qwen2.5:3b Model
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React

### Backend
- **Framework**: ASP.NET Core 8.0
- **ORM**: Entity Framework Core
- **Authentication**: JWT Bearer Tokens
- **Password Hashing**: BCrypt.Net
- **Database**: SQLite (Docker) / SQL Server (Production)
- **API Documentation**: Swagger/OpenAPI

### AI Integration
- **Service**: Ollama
- **Model**: qwen2.5:3b (2.3GB, optimized for efficiency)
- **Use Case**: Automated evaluation of subjective answers
- **Deployment**: Runs locally, no external API costs

### DevOps
- **Containerization**: Docker with multi-stage builds
- **Process Manager**: Supervisor (for all-in-one container)
- **Web Server**: Nginx (production)
- **Database**: SQLite with Docker volumes
- **Orchestration**: Docker Compose (optional)

## 💻 Development Setup

### Prerequisites

- Node.js 18+ and npm
- .NET 8.0 SDK
- Docker Desktop (optional, for containerized development)
- Git

### Backend Setup

```bash
cd service/EduPortal.Api

# Restore dependencies
dotnet restore

# Update database connection in appsettings.Development.json
# Options:
# 1. In-Memory: Remove ConnectionStrings section (default)
# 2. SQLite: "Data Source=eduportal.db"
# 3. SQL Server: "Server=...;Database=EduPortal;..."

# Run migrations (if using SQL Server)
dotnet ef database update

# Start backend
dotnet run
```

Backend will run on: **http://localhost:5000**

API Documentation: **http://localhost:5000/swagger**

### Frontend Setup

```bash
cd web

# Install dependencies
npm install

# Configure API endpoint in src/lib/api.ts if needed
# Default: http://localhost:5000

# Start development server
npm run dev
```

Frontend will run on: **http://localhost:5173**

### Ollama Setup (for AI Features)

```bash
# Install Ollama
# Windows: Download from https://ollama.ai
# Linux: curl -fsSL https://ollama.ai/install.sh | sh
# Mac: brew install ollama

# Start Ollama service
ollama serve

# Pull the model
ollama pull qwen2.5:3b

# Test
curl http://localhost:11434/api/tags
```

Configure Ollama URL in `appsettings.Development.json`:
```json
{
  "OllamaSettings": {
    "BaseUrl": "http://localhost:11434"
  }
}
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |

### Course Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/courses` | List all courses | ✅ |
| POST | `/api/courses` | Create course | Teacher |
| GET | `/api/courses/{id}` | Get course details | ✅ |
| PUT | `/api/courses/{id}` | Update course | Teacher |
| DELETE | `/api/courses/{id}` | Delete course | Teacher |
| POST | `/api/courses/{id}/enroll` | Enroll in course | Student |

### Assessment Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/assessments` | List assessments | ✅ |
| POST | `/api/assessments` | Create assessment | Teacher |
| GET | `/api/assessments/{id}` | Get assessment | ✅ |
| POST | `/api/assessments/{id}/submit` | Submit attempt | Student |
| GET | `/api/assessments/attempts/{attemptId}` | Get attempt details | ✅ |

### Progress Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/progress` | Student progress | Student |
| GET | `/api/progress/courses` | Enrolled courses | Student |
| GET | `/api/progress/attempts` | Assessment attempts | Student |

**Full API Documentation**: Available at `/swagger` when backend is running

## 🖼️ Screenshots

### Student Dashboard
![Student Dashboard](docs/screenshots/student-dashboard.png)
- Real-time progress tracking
- Enrolled courses overview
- Recent assessment attempts

### Teacher Dashboard
![Teacher Dashboard](docs/screenshots/teacher-dashboard.png)
- Course management
- Student analytics
- Assessment creation

### AI Assessment Evaluation
![AI Evaluation](docs/screenshots/ai-evaluation.png)
- Automated grading
- Detailed feedback
- Score calculation

## 📊 Default Credentials

After deployment, use these credentials to explore:

| Role | Username | Password |
|------|----------|----------|
| Admin/Teacher | `admin` | `admin123` |
| Teacher | `teacher` | `teacher123` |
| Student | `student` | `student123` |

**⚠️ Security Warning**: Change these passwords immediately in production!

## 🔧 Configuration

### Environment Variables (Docker)

| Variable | Description | Default |
|----------|-------------|---------|
| `ASPNETCORE_URLS` | Backend listening URLs | `http://+:5000` |
| `ASPNETCORE_ENVIRONMENT` | Environment | `Production` |
| `ConnectionStrings__DefaultConnection` | Database connection | SQLite |
| `OllamaSettings__BaseUrl` | Ollama API URL | `http://localhost:11434` |
| `JwtSettings__SecretKey` | JWT signing key | ⚠️ Change in production |

### Database Configuration

**SQLite (Docker)**:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=/app/data/eduportal.db"
  }
}
```

**SQL Server**:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=EduPortal;User Id=sa;Password=YourPassword;TrustServerCertificate=true"
  }
}
```

**In-Memory (Development)**:
```json
{
  // Remove ConnectionStrings section
}
```

## 🧪 Testing

### Run Backend Tests
```bash
cd service/EduPortal.Api.Tests
dotnet test
```

### Run Frontend Tests
```bash
cd web
npm test
```

### Manual Testing Guide
See [TESTING_GUIDE.md](service/TESTING_GUIDE.md) for comprehensive testing procedures.

## 📦 Build for Production

### Frontend Production Build
```bash
cd web
npm run build
# Output in: dist/
```

### Backend Production Build
```bash
cd service/EduPortal.Api
dotnet publish -c Release -o ./publish
```

### Docker Production Build
```bash
# All-in-one container
docker build -f Dockerfile.allinone -t eduportal-allinone .

# Multi-container
cd service
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 Documentation

- [Docker Deployment Guide](DOCKER_DEPLOYMENT.md) - Complete Docker deployment instructions
- [API Documentation](service/API_DOCUMENTATION.md) - Detailed API reference
- [Testing Guide](service/TESTING_GUIDE.md) - Testing procedures and guidelines
- [Quick Start Guide](service/QUICKSTART.md) - Quick setup for developers
- [Integration Complete](INTEGRATION_COMPLETE.md) - Feature integration status

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**:
```bash
# Windows
netstat -ano | findstr ":80"
netstat -ano | findstr ":5000"

# Linux/Mac
lsof -i :80
lsof -i :5000
```

**Docker Container Won't Start**:
```bash
docker logs eduportal
docker exec -it eduportal supervisorctl status
```

**Database Connection Failed**:
- Check connection string in configuration
- Ensure database file permissions are correct
- Verify Docker volume is mounted

**Ollama Model Not Found**:
```bash
docker exec eduportal ollama list
docker exec eduportal ollama pull qwen2.5:3b
```

For more troubleshooting, see [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md#troubleshooting)

## 📈 Roadmap

- [ ] Video content support
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Integration with third-party LMS
- [ ] Multi-language support
- [ ] Advanced AI models for grading
- [ ] Peer review functionality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai) - Local AI inference
- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components
- [.NET Team](https://dotnet.microsoft.com) - Excellent backend framework
- [Vite](https://vitejs.dev) - Lightning-fast build tool

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/EduPortal/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/EduPortal/discussions)
- **Email**: support@eduportal.example.com

---

**Made with ❤️ by the EduPortal Team**

⭐ Star this repository if you find it helpful!
