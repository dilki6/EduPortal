# API Testing with Postman/Thunder Client

## Quick Test Sequence

### 1. Login as Teacher

**POST** `http://localhost:5000/api/auth/login`

Body (JSON):
```json
{
  "username": "teacher1",
  "password": "password123"
}
```

**Save the token from response for next requests!**

---

### 2. Get All Courses

**GET** `http://localhost:5000/api/courses`

Headers:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### 3. Get Course Details

**GET** `http://localhost:5000/api/courses/1`

Headers:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### 4. Create New Course (Teacher only)

**POST** `http://localhost:5000/api/courses`

Headers:
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

Body:
```json
{
  "name": "Introduction to Programming",
  "description": "Learn the basics of programming"
}
```

---

### 5. Enroll Student (Teacher only)

**POST** `http://localhost:5000/api/courses/enroll`

Headers:
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

Body:
```json
{
  "studentId": "4",
  "courseId": "1"
}
```

---

### 6. Create Assessment (Teacher only)

**POST** `http://localhost:5000/api/assessments`

Headers:
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

Body:
```json
{
  "courseId": "1",
  "title": "Programming Basics Quiz",
  "description": "Test your programming knowledge",
  "durationMinutes": 30,
  "dueDate": "2024-12-31T23:59:59Z",
  "questions": [
    {
      "text": "What is a variable?",
      "type": "MultipleChoice",
      "points": 10,
      "options": [
        {
          "text": "A storage location",
          "isCorrect": true
        },
        {
          "text": "A function",
          "isCorrect": false
        },
        {
          "text": "A loop",
          "isCorrect": false
        }
      ]
    },
    {
      "text": "Is Python a compiled language?",
      "type": "TrueFalse",
      "points": 5,
      "options": [
        {
          "text": "True",
          "isCorrect": false
        },
        {
          "text": "False",
          "isCorrect": true
        }
      ]
    }
  ]
}
```

---

### 7. Publish Assessment (Teacher only)

**POST** `http://localhost:5000/api/assessments/{assessmentId}/publish`

Headers:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### 8. Login as Student

**POST** `http://localhost:5000/api/auth/login`

Body:
```json
{
  "username": "student1",
  "password": "password123"
}
```

**Save the new student token!**

---

### 9. Get Student's Courses

**GET** `http://localhost:5000/api/courses/student`

Headers:
```
Authorization: Bearer STUDENT_TOKEN_HERE
```

---

### 10. Start Assessment (Student only)

**POST** `http://localhost:5000/api/assessments/1/start`

Headers:
```
Authorization: Bearer STUDENT_TOKEN_HERE
```

**Save the attemptId from response!**

---

### 11. Submit Assessment (Student only)

**POST** `http://localhost:5000/api/assessments/attempts/{attemptId}/submit`

Headers:
```
Authorization: Bearer STUDENT_TOKEN_HERE
Content-Type: application/json
```

Body:
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
      "selectedOptionId": "5",
      "textAnswer": null
    }
  ]
}
```

---

### 12. Get Student Progress

**GET** `http://localhost:5000/api/progress/student`

Headers:
```
Authorization: Bearer STUDENT_TOKEN_HERE
```

---

### 13. View Assessment Results

**GET** `http://localhost:5000/api/assessments/attempts/{attemptId}/answers`

Headers:
```
Authorization: Bearer STUDENT_TOKEN_HERE
```

---

## Environment Variables for Postman

You can set these as environment variables in Postman:

```
baseUrl = http://localhost:5000/api
teacherToken = (get from login response)
studentToken = (get from login response)
courseId = 1
assessmentId = 1
attemptId = (get from start assessment response)
```

Then use in requests like:
```
{{baseUrl}}/courses
{{teacherToken}}
```

## VS Code REST Client

If using REST Client extension in VS Code, create a `.http` file:

```http
### Variables
@baseUrl = http://localhost:5000/api
@teacherToken = YOUR_TOKEN
@studentToken = YOUR_TOKEN

### Login
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "username": "teacher1",
  "password": "password123"
}

### Get Courses
GET {{baseUrl}}/courses
Authorization: Bearer {{teacherToken}}

### Create Course
POST {{baseUrl}}/courses
Authorization: Bearer {{teacherToken}}
Content-Type: application/json

{
  "name": "New Course",
  "description": "Course description"
}
```

## Common HTTP Status Codes

- **200 OK**: Request succeeded
- **201 Created**: Resource created successfully
- **204 No Content**: Request succeeded with no response body
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Valid token but insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

## Tips

1. Always get a fresh token if you get 401 errors
2. Tokens expire after 60 minutes by default
3. Make sure to use the correct role (teacher/student) for protected endpoints
4. Check the API_DOCUMENTATION.md for detailed endpoint specifications
5. Use Swagger UI at http://localhost:5000/swagger for interactive testing
