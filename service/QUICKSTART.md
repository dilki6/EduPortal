# Quick Start Guide

## Running the Backend Service

### Option 1: Using the start script
```bash
# Windows
start.bat

# Linux/Mac
./start.sh
```

### Option 2: Using dotnet CLI
```bash
cd EduPortal.Api
dotnet run
```

### Option 3: Using Visual Studio
1. Open `EduPortal.sln` in Visual Studio 2022
2. Press F5 or click the Run button

## Accessing the API

Once running, the API will be available at:
- **HTTP**: http://localhost:5000
- **HTTPS**: https://localhost:7000
- **Swagger UI**: http://localhost:5000/swagger

## Testing the API

### 1. Login with Default User

**Request:**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "teacher1",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "username": "teacher1",
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@university.edu",
    "role": "teacher"
  }
}
```

### 2. Use the Token for Authenticated Requests

Add the token to the Authorization header:
```http
Authorization: Bearer <your-token-here>
```

### 3. Get All Courses

**Request:**
```http
GET http://localhost:5000/api/courses
Authorization: Bearer <your-token>
```

## Connecting to the Frontend

The backend is already configured to accept requests from the frontend. Make sure to:

1. Start the backend service on port 5000
2. Update your frontend to call `http://localhost:5000/api` endpoints
3. Include the JWT token in the Authorization header for protected routes

### Example Frontend Integration

```typescript
// Login example
const login = async (username: string, password: string) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
};

// Authenticated request example
const getCourses = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/courses', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
};
```

## Database

The service uses an **In-Memory database** by default, which means:
- ✅ No setup required
- ✅ Starts with sample data
- ⚠️ Data is lost when you stop the service

For production, switch to SQL Server (see main README.md).

## Default Users

| Username | Password | Role |
|----------|----------|------|
| teacher1 | password123 | Teacher |
| student1 | password123 | Student |
| student2 | password123 | Student |
| student3 | password123 | Student |

## Common Issues

### Port Already in Use
If port 5000 is already in use, change it in `Properties/launchSettings.json`

### CORS Errors
If you get CORS errors from your frontend:
1. Check the frontend URL matches one listed in `Program.cs` CORS policy
2. Add your frontend URL to the allowed origins

### Authentication Fails
- Ensure you're sending the JWT token in the format: `Bearer <token>`
- Check the token hasn't expired (default: 60 minutes)

## Next Steps

1. Explore the API using Swagger UI at http://localhost:5000/swagger
2. Test all endpoints with the provided default users
3. Integrate with your frontend application
4. Customize the API as needed

For more details, see the main [README.md](README.md)
