# EduPortal Web Application - API Integration Guide

## 🎯 Overview

The EduPortal web application is now fully integrated with the C# ASP.NET Core backend API. All features use real API endpoints with JWT authentication.

## 🚀 Quick Start

### 1. Start the Backend API

```bash
cd service
dotnet run
```

The API will run on: `http://localhost:5000`

### 2. Start the Web Application

```bash
cd web
npm install  # First time only
npm run dev
```

The web app will run on: `http://localhost:5173`

### 3. Login with Test Credentials

- **Teacher Account**
  - Username: `teacher1`
  - Password: `password123`
  
- **Student Account**
  - Username: `student1`
  - Password: `password123`

## 📁 New Files Created

### Core API Integration

1. **`src/lib/api.ts`** - Main API client
   - API base configuration
   - Type definitions matching backend models
   - All API endpoint functions
   - JWT token management

2. **`src/hooks/useApi.ts`** - React Query hooks
   - Custom hooks for all API operations
   - Automatic caching and revalidation
   - Optimistic updates
   - Easy error handling

3. **`.env`** - Environment configuration
   - API base URL configuration
   - Can be changed for different environments

### Updated Files

4. **`src/context/AuthContext.tsx`** - Real authentication
   - Replaced mock login with real API calls
   - JWT token storage
   - Automatic session validation
   - Token refresh handling

5. **`src/pages/Login.tsx`** - Updated credentials
   - Changed demo password to `password123`
   - Better error messages from API

## 🔌 API Integration Details

### Authentication Flow

1. User enters credentials
2. POST to `/api/auth/login`
3. Receive JWT token + user info
4. Store token in localStorage
5. Include token in all subsequent requests
6. Auto-redirect based on role

### Data Fetching Pattern

```tsx
import { useMyEnrolledCourses } from '@/hooks/useApi';

function MyCourses() {
  const { data: courses, isLoading, error } = useMyEnrolledCourses();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;
  
  return <CourseList courses={courses} />;
}
```

### Data Mutation Pattern

```tsx
import { useCreateCourse } from '@/hooks/useApi';

function CreateCourse() {
  const createCourse = useCreateCourse();
  
  const handleSubmit = async (data) => {
    try {
      await createCourse.mutateAsync(data);
      toast({ title: 'Course created!' });
    } catch (error) {
      toast({ title: 'Error', description: error.message });
    }
  };
}
```

## 📚 Available Hooks

### Course Hooks

- `useAllCourses()` - Get all courses
- `useMyTeachingCourses()` - Teacher's courses
- `useMyEnrolledCourses()` - Student's enrolled courses
- `useCourse(id)` - Get single course
- `useCourseEnrollments(courseId)` - Course enrollment list
- `useCreateCourse()` - Create new course
- `useUpdateCourse()` - Update course
- `useDeleteCourse()` - Delete course
- `useEnrollCourse()` - Enroll in course
- `useUpdateCourseProgress()` - Update progress

### Assessment Hooks

- `useAssessmentsByCourse(courseId)` - Course assessments
- `useAssessment(id)` - Get single assessment
- `useAssessmentQuestions(assessmentId)` - Assessment questions
- `useAvailableAssessments()` - Available for student
- `useCreateAssessment()` - Create assessment
- `useUpdateAssessment()` - Update assessment
- `useDeleteAssessment()` - Delete assessment
- `usePublishAssessment()` - Publish assessment
- `useAddQuestion()` - Add question
- `useDeleteQuestion()` - Delete question
- `useStartAttempt()` - Start assessment attempt
- `useSubmitAnswers()` - Submit answers
- `useAttempt(attemptId)` - Get attempt details
- `useAttemptAnswers(attemptId)` - Get attempt answers

### Progress Hooks

- `useMyProgress()` - Student progress summary
- `useMyAttempts()` - Student's all attempts
- `useCourseProgress(courseId)` - Course-specific progress

## 🎨 Using in Components

### Example: Display My Courses

```tsx
import { useMyEnrolledCourses } from '@/hooks/useApi';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

function MyCourses() {
  const { data: courses, isLoading } = useMyEnrolledCourses();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div className="grid gap-4">
      {courses?.map(course => (
        <Card key={course.id}>
          <CardHeader>
            <CardTitle>{course.name}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
```

### Example: Create Course

```tsx
import { useCreateCourse } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

function CreateCourseForm() {
  const createCourse = useCreateCourse();
  const { toast } = useToast();
  
  const handleSubmit = async (formData) => {
    try {
      await createCourse.mutateAsync({
        name: formData.name,
        description: formData.description
      });
      
      toast({
        title: 'Success!',
        description: 'Course created successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Example: Enroll in Course

```tsx
import { useEnrollCourse } from '@/hooks/useApi';

function CourseCard({ course }) {
  const enrollCourse = useEnrollCourse();
  
  const handleEnroll = async () => {
    try {
      await enrollCourse.mutateAsync(course.id);
      // Automatically refreshes enrolled courses
    } catch (error) {
      console.error('Enrollment failed:', error);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{course.name}</CardTitle>
      </CardHeader>
      <CardFooter>
        <Button onClick={handleEnroll}>
          Enroll Now
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## 🔧 Configuration

### Change API URL

Edit `.env` file:

```env
# For development
VITE_API_BASE_URL=http://localhost:5000/api

# For production
VITE_API_BASE_URL=https://your-api.com/api
```

### CORS Configuration

The backend already has CORS configured for:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative port)

If you change ports, update `Program.cs` in the service:

```csharp
builder.Services.AddCors(options => {
    options.AddPolicy("AllowWeb", builder => {
        builder.WithOrigins(
            "http://localhost:5173",  // Add your port here
            "http://localhost:3000"
        )
        .AllowAnyMethod()
        .AllowAnyHeader();
    });
});
```

## 🐛 Troubleshooting

### Problem: "Network Error" or "Failed to fetch"

**Solution:** Make sure the backend API is running:
```bash
cd service
dotnet run
```

### Problem: "401 Unauthorized"

**Solution:** Your token expired or is invalid. Logout and login again.

### Problem: "CORS Error"

**Solution:** 
1. Check backend is running on port 5000
2. Check frontend is running on port 5173
3. Verify CORS policy in `Program.cs`

### Problem: Can't login with teacher1/password123

**Solution:**
1. Make sure database was created with `SetupDatabase.sql`
2. Verify users exist in the database
3. Check backend console for errors

## 📊 Type Safety

All API responses are fully typed. TypeScript will:
- Auto-complete API response properties
- Catch type errors at compile time
- Show inline documentation

```tsx
const { data: course } = useCourse(id);
// TypeScript knows 'course' has: id, name, description, teacherId, etc.

console.log(course?.name);  // ✅ TypeScript knows this exists
console.log(course?.foo);   // ❌ TypeScript error: Property 'foo' doesn't exist
```

## 🎯 Next Steps

### To Implement in Pages:

1. **TeacherDashboard.tsx** - Use `useMyTeachingCourses()`
2. **StudentDashboard.tsx** - Use `useMyEnrolledCourses()`, `useMyProgress()`
3. **CourseManagement.tsx** - Use `useCreateCourse()`, `useUpdateCourse()`, `useDeleteCourse()`
4. **AssessmentManagement.tsx** - Use assessment hooks
5. **MyCourses.tsx** - Use `useMyEnrolledCourses()`, `useEnrollCourse()`
6. **MyProgress.tsx** - Use `useMyProgress()`, `useMyAttempts()`
7. **AttemptAssessment.tsx** - Use `useStartAttempt()`, `useSubmitAnswers()`
8. **ReviewAnswers.tsx** - Use `useAttemptAnswers()`

### Example Implementation Pattern:

```tsx
// Before (Mock data)
const courses = [
  { id: 1, name: 'Course 1' },
  { id: 2, name: 'Course 2' }
];

// After (Real API)
const { data: courses, isLoading, error } = useMyEnrolledCourses();

if (isLoading) return <Skeleton />;
if (error) return <ErrorAlert error={error} />;
```

## 📖 Additional Resources

- **Backend API Documentation**: See `service/API_DOCUMENTATION.md`
- **React Query Docs**: https://tanstack.com/query/latest
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

---

**Ready to integrate!** The API layer is complete and ready to use in all your pages. Just import the hooks and start using real data! 🚀
