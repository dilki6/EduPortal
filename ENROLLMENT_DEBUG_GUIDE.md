# Enrollment Debugging Guide

## Issue Summary
The `/api/courses/my-enrolled` endpoint is returning an empty array. This guide helps diagnose and fix the issue.

## Logging Added

### Backend Logging (Console)

#### 1. **CoursesController.GetMyEnrolledCourses** (`Controllers/CoursesController.cs`)
```
📚 GetMyEnrolledCourses: Request from user {userId}
✅ GetMyEnrolledCourses: Returning {count} courses
❌ GetMyEnrolledCourses: Unauthorized - No userId
```

#### 2. **CourseService.GetStudentCoursesAsync** (`Services/CourseService.cs`)
```
📚 GetStudentCoursesAsync: Found {count} enrollments for student {studentId}
✅ GetStudentCoursesAsync: Returning {count} courses
```

#### 3. **CourseService.EnrollStudentAsync** (`Services/CourseService.cs`)
```
📝 EnrollStudentAsync: Enrolling student {studentId} in course {courseId}
⚠️ EnrollStudentAsync: Student already enrolled in course
✅ EnrollStudentAsync: Successfully enrolled student {studentId} in course {courseId}
```

### Frontend Logging (Browser Console)

#### **MyCourses.tsx** - `fetchAssessmentsData()`
```
📚 Fetched {count} enrolled courses
✅ Fetched {count} student attempts
📝 Course '{courseName}': {count} total assessments
✨ Course '{courseName}': {count} published assessments
🎯 Total assessments loaded: {count}
✅ Completed: {count}
⏳ Pending: {count}
```

## Diagnostic Steps

### Step 1: Check Backend Console
1. Restart the backend service to apply the logging changes
2. Login as a student
3. Navigate to "My Assessments" page
4. Check the backend console output

**Expected Output:**
```
📚 GetMyEnrolledCourses: Request from user abc123
📚 GetStudentCoursesAsync: Found X enrollments for student abc123
✅ GetStudentCoursesAsync: Returning X courses
✅ GetMyEnrolledCourses: Returning X courses
```

### Step 2: Interpret the Results

#### Scenario A: "Found 0 enrollments"
**Cause:** No enrollments exist in the database for this student.

**Solution:** Create enrollments using one of these methods:

##### Method 1: Via Course Management UI (Teacher)
1. Login as teacher
2. Go to "Course Management"
3. Click on a course
4. Use "Enroll Students" feature
5. Add the student to the course

##### Method 2: Via API (Direct)
```bash
POST /api/courses/enroll
Content-Type: application/json
Authorization: Bearer {teacher_token}

{
  "studentId": "{student_user_id}",
  "courseId": "{course_id}"
}
```

**Backend Console Should Show:**
```
📝 EnrollStudentAsync: Enrolling student {studentId} in course {courseId}
✅ EnrollStudentAsync: Successfully enrolled student in course
```

#### Scenario B: "Found X enrollments" but "Returning 0 courses"
**Cause:** Enrollments exist but courses are not loading (possibly deleted courses or data integrity issue).

**Solution:**
1. Check database: Verify enrolled courses still exist in Courses table
2. Check relationships: Ensure CourseId in Enrollments matches Id in Courses
3. Run database query:
```sql
SELECT e.*, c.* 
FROM Enrollments e
LEFT JOIN Courses c ON e.CourseId = c.Id
WHERE e.StudentId = '{studentId}'
```

#### Scenario C: "Found X enrollments" and "Returning X courses" but frontend shows empty
**Cause:** Frontend not receiving data or parsing incorrectly.

**Solution:**
1. Check browser console for frontend logs
2. Open Network tab and check `/api/courses/my-enrolled` response
3. Verify response structure matches `CourseDto[]`

### Step 3: Check Frontend Console
After backend returns courses, check browser console:

```
📚 Fetched 2 enrolled courses
✅ Fetched 5 student attempts
📝 Course 'Mathematics 101': 3 total assessments
✨ Course 'Mathematics 101': 2 published assessments
📝 Course 'Physics 101': 4 total assessments
✨ Course 'Physics 101': 3 published assessments
🎯 Total assessments loaded: 5
✅ Completed: 2
⏳ Pending: 3
```

## Quick Fix Checklist

- [ ] Backend service restarted
- [ ] Logged in as student
- [ ] Opened "My Assessments" page
- [ ] Checked backend console logs
- [ ] Verified enrollment count > 0
- [ ] If count = 0, enrolled student in at least one course
- [ ] Refreshed "My Assessments" page
- [ ] Checked frontend console logs
- [ ] Verified assessments appear on the page

## API Endpoints Reference

### Student Endpoints
- `GET /api/courses/my-enrolled` - Get enrolled courses
- `GET /api/assessments/attempts/student` - Get all student's attempts
- `GET /api/assessments/course/{courseId}` - Get assessments for a course

### Teacher Endpoints
- `POST /api/courses/enroll` - Enroll a student in a course
- `DELETE /api/courses/enroll/{enrollmentId}` - Unenroll a student
- `GET /api/courses/{id}/enrollments` - Get all enrollments for a course

## Database Schema Reference

### Enrollments Table
```
Id (string, PK)
StudentId (string, FK -> Users.Id)
CourseId (string, FK -> Courses.Id)
EnrolledAt (DateTime)
Progress (int)
```

### Expected Data Flow
```
1. Student logs in → Gets JWT with userId
2. Navigates to My Assessments → Calls GET /api/courses/my-enrolled
3. Backend queries: SELECT * FROM Enrollments WHERE StudentId = {userId}
4. For each enrollment, includes Course and Teacher data
5. Returns CourseDto[] with: Id, Title, Description, TeacherName, etc.
6. Frontend receives courses → Fetches assessments for each course
7. Frontend displays individual assessment cards
```

## Testing Script

### 1. Create Test Data (Teacher Account)
```bash
# Login as teacher
POST /api/auth/login
{ "email": "teacher@test.com", "password": "password" }

# Create a course (if none exist)
POST /api/courses
{ "title": "Test Course", "description": "Test Description" }

# Create an assessment
POST /api/assessments
{ 
  "courseId": "{courseId}",
  "title": "Test Assessment",
  "dueDate": "2024-12-31T23:59:59Z",
  "maxScore": 100,
  "status": "Published"
}

# Enroll student
POST /api/courses/enroll
{ "studentId": "{studentId}", "courseId": "{courseId}" }
```

### 2. Verify (Student Account)
```bash
# Login as student
POST /api/auth/login
{ "email": "student@test.com", "password": "password" }

# Check enrolled courses
GET /api/courses/my-enrolled
# Should return array with 1+ courses

# Check assessments
GET /api/assessments/course/{courseId}
# Should return array with assessments
```

## Common Issues

### Issue: "Unauthorized" error
- **Check:** JWT token is valid
- **Check:** User has "Student" role
- **Fix:** Re-login to get fresh token

### Issue: Empty response but enrollments exist
- **Check:** User ID in token matches StudentId in Enrollments
- **Check:** Courses are not soft-deleted
- **Fix:** Verify database relationships

### Issue: Frontend doesn't show assessments
- **Check:** Assessments have Status = "Published"
- **Check:** CourseId in Assessments matches enrolled courses
- **Fix:** Publish assessments or check filters

## Next Steps After Fix

1. **Test Auto-Sync:**
   - Keep My Assessments page open
   - As teacher, create new assessment
   - Click refresh button on My Assessments
   - Verify new assessment appears

2. **Test Window Focus:**
   - Open My Assessments page
   - Switch to another tab
   - Switch back to My Assessments
   - Should auto-refresh

3. **Test Completion:**
   - Attempt an assessment
   - Submit answers
   - Return to My Assessments
   - Assessment card should show "Completed" badge with score

## Support

If issues persist after following this guide:
1. Export backend console logs
2. Export browser console logs
3. Export Network tab for `/api/courses/my-enrolled` request
4. Check database directly for Enrollments table data
