# EduPortal Database Schema - Entity Relationship Diagram

## Database: EduPortalDb

### Entity Relationship Overview

```
┌─────────────────┐
│     Users       │
│  (Teachers &    │
│   Students)     │
└────────┬────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         │ (1:N - Teacher teaches)         │ (1:N - Student enrolls)
         │                                 │
         ▼                                 ▼
┌─────────────────┐              ┌─────────────────┐
│    Courses      │◄─────────────┤  Enrollments    │
│                 │   (N:1)      │  (Join Table)   │
└────────┬────────┘              └─────────────────┘
         │
         │ (1:N - Course has)
         │
         ▼
┌─────────────────┐
│  Assessments    │
│   (Tests)       │
└────────┬────────┘
         │
         ├─────────────────────────────────┐
         │ (1:N)                           │ (1:N)
         │                                 │
         ▼                                 ▼
┌─────────────────┐              ┌─────────────────┐
│   Questions     │              │ AssessmentAttempts │
│                 │              │  (Student tries)   │
└────────┬────────┘              └─────────┬─────────┘
         │                                 │
         │ (1:N)                          │ (1:N)
         │                                 │
         ▼                                 ▼
┌─────────────────┐              ┌─────────────────┐
│ QuestionOptions │              │    Answers      │
│  (Choices)      │◄─────────────┤  (Student       │
│                 │   (N:1)      │   responses)    │
└─────────────────┘              └─────────────────┘
                                          ▲
                                          │ (N:1)
                                          │
                                  ┌───────┴────────┐
                                  │   Questions    │
                                  └────────────────┘
```

## Table Relationships Detail

### 1. Users (Root Entity)
- **Primary Key**: Id
- **Relationships**:
  - → Courses (as Teacher) [1:N]
  - → Enrollments (as Student) [1:N]
  - → AssessmentAttempts (as Student) [1:N]

### 2. Courses
- **Primary Key**: Id
- **Foreign Keys**:
  - TeacherId → Users.Id (Teacher who created the course)
- **Relationships**:
  - ← Users [N:1]
  - → Enrollments [1:N]
  - → Assessments [1:N]

### 3. Enrollments (Join Table)
- **Primary Key**: Id
- **Foreign Keys**:
  - StudentId → Users.Id (Student enrolled)
  - CourseId → Courses.Id (Course enrolled in)
- **Unique Constraint**: (StudentId, CourseId)
- **Relationships**:
  - ← Users [N:1]
  - ← Courses [N:1]

### 4. Assessments
- **Primary Key**: Id
- **Foreign Keys**:
  - CourseId → Courses.Id
- **Relationships**:
  - ← Courses [N:1]
  - → Questions [1:N]
  - → AssessmentAttempts [1:N]

### 5. Questions
- **Primary Key**: Id
- **Foreign Keys**:
  - AssessmentId → Assessments.Id
- **Relationships**:
  - ← Assessments [N:1]
  - → QuestionOptions [1:N]
  - → Answers [1:N]

### 6. QuestionOptions
- **Primary Key**: Id
- **Foreign Keys**:
  - QuestionId → Questions.Id
- **Relationships**:
  - ← Questions [N:1]

### 7. AssessmentAttempts
- **Primary Key**: Id
- **Foreign Keys**:
  - AssessmentId → Assessments.Id
  - StudentId → Users.Id
- **Relationships**:
  - ← Assessments [N:1]
  - ← Users [N:1]
  - → Answers [1:N]

### 8. Answers
- **Primary Key**: Id
- **Foreign Keys**:
  - AttemptId → AssessmentAttempts.Id
  - QuestionId → Questions.Id
  - SelectedOptionId → QuestionOptions.Id (nullable)
- **Relationships**:
  - ← AssessmentAttempts [N:1]
  - ← Questions [N:1]

## Cascade Delete Rules

| Relationship | Parent | Child | Rule |
|--------------|--------|-------|------|
| Teacher → Courses | Users | Courses | NO ACTION |
| Course → Enrollments | Courses | Enrollments | CASCADE |
| Course → Assessments | Courses | Assessments | CASCADE |
| Assessment → Questions | Assessments | Questions | CASCADE |
| Question → Options | Questions | QuestionOptions | CASCADE |
| Assessment → Attempts | Assessments | AssessmentAttempts | NO ACTION |
| Student → Enrollments | Users | Enrollments | CASCADE |
| Student → Attempts | Users | AssessmentAttempts | CASCADE |
| Attempt → Answers | AssessmentAttempts | Answers | CASCADE |
| Question → Answers | Questions | Answers | NO ACTION |

### Cascade Rules Explanation:

**CASCADE**: When parent is deleted, child records are automatically deleted.
- Example: Delete a Course → All its Enrollments, Assessments, Questions, etc. are deleted

**NO ACTION**: Prevents deletion of parent if child records exist.
- Example: Cannot delete a Teacher if they have Courses
- Must first delete or reassign the Courses

## Data Flow Examples

### Student Enrollment Flow
```
1. User (Student) created
2. Course created by User (Teacher)
3. Enrollment created (links Student + Course)
4. Student can now access Course content
```

### Assessment Taking Flow
```
1. Teacher creates Assessment for Course
2. Teacher adds Questions to Assessment
3. Teacher adds Options to Questions
4. Teacher publishes Assessment
5. Student starts Assessment (creates AssessmentAttempt)
6. Student answers Questions (creates Answers)
7. Student submits Assessment
8. System grades Answers automatically
9. AssessmentAttempt updated with Score
```

### Data Access Pattern
```
Get Student Dashboard:
  User (Student)
    ├─> Enrollments
    │     └─> Courses
    │           └─> Assessments
    └─> AssessmentAttempts
          ├─> Assessments
          └─> Answers
                └─> Questions
                      └─> QuestionOptions
```

## Indexes for Performance

### Primary Indexes (Automatic)
- Users.Id
- Courses.Id
- Enrollments.Id
- Assessments.Id
- Questions.Id
- QuestionOptions.Id
- AssessmentAttempts.Id
- Answers.Id

### Foreign Key Indexes
- Courses.TeacherId
- Enrollments.StudentId
- Enrollments.CourseId
- Assessments.CourseId
- Questions.AssessmentId
- QuestionOptions.QuestionId
- AssessmentAttempts.AssessmentId
- AssessmentAttempts.StudentId
- Answers.AttemptId
- Answers.QuestionId

### Additional Indexes
- Users.Username (UNIQUE)
- Users.Email (UNIQUE)
- Users.Role
- Enrollments (StudentId, CourseId) UNIQUE
- Assessments.IsPublished
- Assessments.DueDate
- Questions.Order
- QuestionOptions.Order
- AssessmentAttempts.Status

## Constraints

### Check Constraints
- Users.Role IN (0, 1)
- Enrollments.Progress BETWEEN 0 AND 100
- Assessments.DurationMinutes > 0
- Questions.Type IN (0, 1, 2, 3)
- Questions.Points > 0
- AssessmentAttempts.Status IN (0, 1, 2)

### Unique Constraints
- Users.Username
- Users.Email
- (Enrollments.StudentId, Enrollments.CourseId)

## Data Types

### Common Patterns
- **IDs**: NVARCHAR(50) - GUID strings
- **Names/Titles**: NVARCHAR(100-300)
- **Descriptions**: NVARCHAR(MAX)
- **Emails**: NVARCHAR(200)
- **Flags**: BIT (0/1)
- **Scores/Points**: INT
- **Percentages**: INT (0-100)
- **Dates**: DATETIME2
- **Enums**: INT with CHECK constraints

## Business Rules Enforced

1. **User Role**: Must be Student (0) or Teacher (1)
2. **Enrollment Uniqueness**: A student can enroll in a course only once
3. **Progress Range**: Course progress must be 0-100%
4. **Question Types**: Only 4 valid types (MultipleChoice, TrueFalse, ShortAnswer, Essay)
5. **Points Positive**: All points must be greater than 0
6. **Attempt Status**: Only 3 valid statuses (InProgress, Completed, Graded)
7. **Teacher Protection**: Cannot delete a teacher who has courses
8. **Assessment Protection**: Cannot delete an assessment that has attempts

## Views

### vw_StudentProgressSummary
Aggregates:
- Total courses enrolled
- Completed assessments
- Average score across all assessments

### vw_CourseEnrollmentDetails
Aggregates:
- Total enrolled students per course
- Total assessments per course
- Teacher information

### vw_AssessmentStatistics
Aggregates:
- Total attempts per assessment
- Average, min, max scores
- Publish status and due dates

## Example Query Patterns

### Get Student's Enrolled Courses with Progress
```sql
SELECT c.*, e.Progress, e.EnrolledAt
FROM Users u
INNER JOIN Enrollments e ON u.Id = e.StudentId
INNER JOIN Courses c ON e.CourseId = c.Id
WHERE u.Id = @StudentId;
```

### Get Assessment with All Questions and Options
```sql
SELECT 
    a.*,
    q.Id AS QuestionId, q.Text AS QuestionText,
    qo.Id AS OptionId, qo.Text AS OptionText, qo.IsCorrect
FROM Assessments a
INNER JOIN Questions q ON a.Id = q.AssessmentId
LEFT JOIN QuestionOptions qo ON q.Id = qo.QuestionId
WHERE a.Id = @AssessmentId
ORDER BY q.[Order], qo.[Order];
```

### Get Student Assessment Results
```sql
SELECT 
    aa.*, a.Title,
    ans.*, q.Text AS QuestionText,
    qo.Text AS SelectedOption, qo.IsCorrect
FROM AssessmentAttempts aa
INNER JOIN Assessments a ON aa.AssessmentId = a.Id
INNER JOIN Answers ans ON aa.Id = ans.AttemptId
INNER JOIN Questions q ON ans.QuestionId = q.Id
LEFT JOIN QuestionOptions qo ON ans.SelectedOptionId = qo.Id
WHERE aa.StudentId = @StudentId AND aa.Id = @AttemptId;
```
