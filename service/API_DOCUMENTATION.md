# EduPortal API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All endpoints except `/auth/login` and `/auth/register` require JWT authentication.

Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Auth Endpoints

### Login
**POST** `/auth/login`

Login to get a JWT token.

**Request Body:**
```json
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

### Register
**POST** `/auth/register`

Register a new user.

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "student"
}
```

**Response:**
```json
{
  "id": "5",
  "username": "newuser",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "student"
}
```

### Get User
**GET** `/auth/user/{userId}`

Get user details by ID.

**Response:**
```json
{
  "id": "1",
  "username": "teacher1",
  "name": "Dr. Sarah Johnson",
  "email": "sarah.johnson@university.edu",
  "role": "teacher"
}
```

---

## Course Endpoints

### Get All Courses
**GET** `/courses`

Get all courses in the system.

**Response:**
```json
[
  {
    "id": "1",
    "name": "Advanced Mathematics",
    "description": "Advanced calculus and linear algebra concepts",
    "teacherId": "1",
    "teacherName": "Dr. Sarah Johnson",
    "createdAt": "2024-01-15T00:00:00Z",
    "enrolledStudentsCount": 2,
    "enrolledStudentIds": ["2", "3"]
  }
]
```

### Get Teacher's Courses
**GET** `/courses/teacher`

Get all courses taught by the authenticated teacher.

**Authorization:** Teacher role required

### Get Student's Courses
**GET** `/courses/student`

Get all courses the authenticated student is enrolled in.

**Authorization:** Student role required

### Get Course by ID
**GET** `/courses/{id}`

Get a specific course by ID.

### Create Course
**POST** `/courses`

Create a new course.

**Authorization:** Teacher role required

**Request Body:**
```json
{
  "name": "New Course",
  "description": "Course description"
}
```

### Update Course
**PUT** `/courses/{id}`

Update an existing course.

**Authorization:** Teacher role required (must be course owner)

**Request Body:**
```json
{
  "name": "Updated Course Name",
  "description": "Updated description"
}
```

### Delete Course
**DELETE** `/courses/{id}`

Delete a course.

**Authorization:** Teacher role required (must be course owner)

### Enroll Student
**POST** `/courses/enroll`

Enroll a student in a course.

**Authorization:** Teacher role required

**Request Body:**
```json
{
  "studentId": "2",
  "courseId": "1"
}
```

### Unenroll Student
**DELETE** `/courses/enroll/{enrollmentId}`

Remove a student from a course.

**Authorization:** Teacher role required

### Get Course Enrollments
**GET** `/courses/{id}/enrollments`

Get all students enrolled in a course.

**Response:**
```json
[
  {
    "id": "1",
    "studentId": "2",
    "studentName": "Alex Chen",
    "studentEmail": "alex.chen@student.edu",
    "courseId": "1",
    "courseName": "Advanced Mathematics",
    "enrolledAt": "2024-01-15T00:00:00Z",
    "progress": 75
  }
]
```

### Get All Students
**GET** `/courses/students/all`

Get all students in the system.

**Authorization:** Teacher role required

---

## Assessment Endpoints

### Get Course Assessments
**GET** `/assessments/course/{courseId}`

Get all assessments for a specific course.

**Response:**
```json
[
  {
    "id": "1",
    "courseId": "1",
    "courseName": "Advanced Mathematics",
    "title": "Calculus Quiz",
    "description": "Test your knowledge of calculus fundamentals",
    "durationMinutes": 30,
    "dueDate": "2024-12-31T00:00:00Z",
    "createdAt": "2024-01-20T00:00:00Z",
    "isPublished": true,
    "questionCount": 10,
    "totalPoints": 50
  }
]
```

### Get Assessment
**GET** `/assessments/{id}`

Get a specific assessment by ID.

### Get Assessment Questions
**GET** `/assessments/{id}/questions?includeAnswers=false`

Get all questions for an assessment.

**Query Parameters:**
- `includeAnswers` (boolean): Include correct answers (only available for teachers)

**Response:**
```json
[
  {
    "id": "1",
    "text": "What is the derivative of x²?",
    "type": "MultipleChoice",
    "points": 5,
    "order": 1,
    "options": [
      {
        "id": "1",
        "text": "2x",
        "isCorrect": false,
        "order": 1
      },
      {
        "id": "2",
        "text": "x",
        "isCorrect": false,
        "order": 2
      }
    ]
  }
]
```

### Create Assessment
**POST** `/assessments`

Create a new assessment.

**Authorization:** Teacher role required

**Request Body:**
```json
{
  "courseId": "1",
  "title": "New Assessment",
  "description": "Assessment description",
  "durationMinutes": 30,
  "dueDate": "2024-12-31T00:00:00Z",
  "questions": [
    {
      "text": "What is 2 + 2?",
      "type": "MultipleChoice",
      "points": 5,
      "options": [
        {
          "text": "3",
          "isCorrect": false
        },
        {
          "text": "4",
          "isCorrect": true
        },
        {
          "text": "5",
          "isCorrect": false
        }
      ]
    }
  ]
}
```

### Publish Assessment
**POST** `/assessments/{id}/publish`

Publish an assessment (make it available to students).

**Authorization:** Teacher role required

### Delete Assessment
**DELETE** `/assessments/{id}`

Delete an assessment.

**Authorization:** Teacher role required

### Start Assessment
**POST** `/assessments/{id}/start`

Start an assessment attempt.

**Authorization:** Student role required

**Response:**
```json
{
  "id": "attempt-1",
  "assessmentId": "1",
  "assessmentTitle": "Calculus Quiz",
  "studentId": "2",
  "studentName": "Alex Chen",
  "startedAt": "2024-01-20T10:00:00Z",
  "completedAt": null,
  "score": null,
  "maxScore": null,
  "status": "InProgress"
}
```

### Submit Assessment
**POST** `/assessments/attempts/{attemptId}/submit`

Submit answers for an assessment.

**Authorization:** Student role required

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "1",
      "selectedOptionId": "1",
      "textAnswer": null
    },
    {
      "questionId": "2",
      "selectedOptionId": null,
      "textAnswer": "This is my answer"
    }
  ]
}
```

**Response:**
```json
{
  "id": "attempt-1",
  "assessmentId": "1",
  "assessmentTitle": "Calculus Quiz",
  "studentId": "2",
  "studentName": "Alex Chen",
  "startedAt": "2024-01-20T10:00:00Z",
  "completedAt": "2024-01-20T10:25:00Z",
  "score": 45,
  "maxScore": 50,
  "status": "Graded"
}
```

### Get Student Attempts
**GET** `/assessments/attempts/student`

Get all assessment attempts for the authenticated student.

### Get Assessment Attempts
**GET** `/assessments/{id}/attempts`

Get all attempts for a specific assessment.

**Authorization:** Teacher role required

### Get Attempt Details
**GET** `/assessments/attempts/{attemptId}`

Get details of a specific attempt.

### Get Attempt Answers
**GET** `/assessments/attempts/{attemptId}/answers`

Get all answers for a specific attempt (includes correct answers after submission).

**Response:**
```json
[
  {
    "id": "answer-1",
    "questionId": "1",
    "questionText": "What is the derivative of x²?",
    "selectedOptionId": "1",
    "selectedOptionText": "2x",
    "textAnswer": null,
    "pointsEarned": 5,
    "isCorrect": true,
    "correctAnswer": "2x"
  }
]
```

---

## Progress Endpoints

### Get Student Progress
**GET** `/progress/student`

Get progress summary for the authenticated student.

**Response:**
```json
{
  "studentId": "2",
  "studentName": "Alex Chen",
  "totalCourses": 3,
  "completedAssessments": 8,
  "pendingAssessments": 4,
  "averageScore": 85.5,
  "courseProgress": [
    {
      "courseId": "1",
      "courseName": "Advanced Mathematics",
      "progress": 75,
      "completedAssessments": 3,
      "totalAssessments": 5,
      "averageScore": 88.5
    }
  ]
}
```

### Get Student Progress by ID
**GET** `/progress/student/{studentId}`

Get progress summary for a specific student.

**Authorization:** Teacher role required

### Get Student Course Progress
**GET** `/progress/student/courses`

Get detailed progress for all courses the authenticated student is enrolled in.

**Response:**
```json
[
  {
    "courseId": "1",
    "courseName": "Advanced Mathematics",
    "progress": 75,
    "completedAssessments": 3,
    "totalAssessments": 5,
    "averageScore": 88.5
  }
]
```

---

## Question Types

- `MultipleChoice`: Multiple choice with one correct answer
- `TrueFalse`: True/False questions
- `ShortAnswer`: Short text answer
- `Essay`: Long text answer

## Assessment Status

- `InProgress`: Assessment is currently being taken
- `Completed`: Assessment has been submitted but not graded
- `Graded`: Assessment has been graded

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Error description"
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```
