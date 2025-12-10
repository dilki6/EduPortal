# EduPortal Backend Service

This is the ASP.NET Core Web API backend for the EduPortal educational platform.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Support for Teachers and Students
- **Course Management**: Create, update, delete, and manage courses
- **Assessment System**: Create assessments with multiple question types
- **Progress Tracking**: Track student progress and performance
- **Auto-grading**: Automatic grading for multiple-choice and true/false questions

## Tech Stack

- ASP.NET Core 8.0
- Entity Framework Core
- JWT Authentication
- BCrypt for password hashing
- In-Memory Database (for demo, easily switchable to SQL Server)
- Swagger/OpenAPI documentation

## Getting Started

### Prerequisites

- .NET 8.0 SDK or later
- Visual Studio 2022 or Visual Studio Code
- (Optional) SQL Server for production database

### Installation

1. Navigate to the service directory:
```bash
cd service
```

2. Restore dependencies:
```bash
dotnet restore
```

3. Run the application:
```bash
dotnet run --project EduPortal.Api
```

The API will be available at:
- HTTP: http://localhost:5000
- HTTPS: https://localhost:7000
- Swagger UI: http://localhost:5000/swagger

## Default Users

The database is seeded with the following users:

### Teacher
- Username: `teacher1`
- Password: `password123`

### Students
- Username: `student1`, Password: `password123`
- Username: `student2`, Password: `password123`
- Username: `student3`, Password: `password123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/user/{userId}` - Get user by ID

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/teacher` - Get teacher's courses
- `GET /api/courses/student` - Get student's enrolled courses
- `GET /api/courses/{id}` - Get course by ID
- `POST /api/courses` - Create new course (Teacher only)
- `PUT /api/courses/{id}` - Update course (Teacher only)
- `DELETE /api/courses/{id}` - Delete course (Teacher only)
- `POST /api/courses/enroll` - Enroll student (Teacher only)
- `DELETE /api/courses/enroll/{enrollmentId}` - Unenroll student (Teacher only)
- `GET /api/courses/{id}/enrollments` - Get course enrollments
- `GET /api/courses/students/all` - Get all students (Teacher only)

### Assessments
- `GET /api/assessments/course/{courseId}` - Get course assessments
- `GET /api/assessments/{id}` - Get assessment by ID
- `GET /api/assessments/{id}/questions` - Get assessment questions
- `POST /api/assessments` - Create assessment (Teacher only)
- `POST /api/assessments/{id}/publish` - Publish assessment (Teacher only)
- `DELETE /api/assessments/{id}` - Delete assessment (Teacher only)
- `POST /api/assessments/{id}/start` - Start assessment (Student only)
- `POST /api/assessments/attempts/{attemptId}/submit` - Submit assessment (Student only)
- `GET /api/assessments/attempts/student` - Get student's attempts
- `GET /api/assessments/{id}/attempts` - Get assessment attempts (Teacher only)
- `GET /api/assessments/attempts/{attemptId}` - Get attempt details
- `GET /api/assessments/attempts/{attemptId}/answers` - Get attempt answers

### Progress
- `GET /api/progress/student` - Get current student's progress
- `GET /api/progress/student/{studentId}` - Get student progress by ID (Teacher only)
- `GET /api/progress/student/courses` - Get student's course progress

## Configuration

### Database

By default, the application uses an In-Memory database for easy testing. To switch to SQL Server:

1. Update `appsettings.json` connection string
2. In `Program.cs`, replace:
```csharp
options.UseInMemoryDatabase("EduPortalDb")
```
with:
```csharp
options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
```

3. Run migrations:
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### JWT Settings

Configure JWT settings in `appsettings.json`:
```json
{
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyForJWTTokenGeneration123456789",
    "Issuer": "EduPortalApi",
    "Audience": "EduPortalWeb",
    "ExpirationMinutes": 60
  }
}
```

### CORS

CORS is configured to allow requests from:
- http://localhost:5173 (Vite dev server)
- http://localhost:3000 (React dev server)

Update the CORS policy in `Program.cs` to match your frontend URL.

## Project Structure

```
EduPortal.Api/
├── Controllers/         # API Controllers
├── Models/             # Domain models
├── DTOs/               # Data Transfer Objects
├── Services/           # Business logic services
├── Data/               # Database context and initialization
├── Program.cs          # Application entry point
└── appsettings.json    # Configuration
```

## Development

### Adding New Features

1. Create models in `Models/`
2. Add DTOs in `DTOs/`
3. Create service interface and implementation in `Services/`
4. Add controller in `Controllers/`
5. Register service in `Program.cs`

### Testing with Swagger

The API includes Swagger UI for easy testing. Navigate to `/swagger` to see all available endpoints and test them interactively.

## License

This project is part of the EduPortal educational platform.
