# EduPortal Database Setup Guide

## Overview
This guide will help you set up the MSSQL database for the EduPortal application.

## Database Schema

### Tables Structure

```
Users (5 records)
├── Courses (3 records) [FK: TeacherId → Users.Id]
│   ├── Enrollments (7 records) [FK: CourseId → Courses.Id, StudentId → Users.Id]
│   └── Assessments (7 records) [FK: CourseId → Courses.Id]
│       ├── Questions (13 records) [FK: AssessmentId → Assessments.Id]
│       │   └── QuestionOptions (32 records) [FK: QuestionId → Questions.Id]
│       └── AssessmentAttempts (4 records) [FK: AssessmentId → Assessments.Id, StudentId → Users.Id]
│           └── Answers (12 records) [FK: AttemptId → AssessmentAttempts.Id, QuestionId → Questions.Id]
```

## Installation Methods

### Method 1: Using SQL Server Management Studio (SSMS)

1. **Open SSMS** and connect to your SQL Server instance

2. **Open the script**:
   - File → Open → File
   - Navigate to `service/Database/CreateDatabase.sql`

3. **Execute the script**:
   - Press F5 or click Execute
   - Wait for completion message

4. **Verify installation**:
   ```sql
   USE EduPortalDb;
   SELECT * FROM Users;
   ```

### Method 2: Using Command Line (sqlcmd)

```bash
sqlcmd -S localhost -U sa -P YourPassword -i CreateDatabase.sql
```

### Method 3: Using Azure Data Studio

1. Open Azure Data Studio
2. Connect to your server
3. File → Open File → Select `CreateDatabase.sql`
4. Click Run

## Updating Connection String

After creating the database, update your `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=EduPortalDb;User Id=sa;Password=YourPassword;TrustServerCertificate=True;"
  }
}
```

Or use Windows Authentication:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=EduPortalDb;Integrated Security=True;TrustServerCertificate=True;"
  }
}
```

## Switching from In-Memory to SQL Server

Update `Program.cs`:

**Before:**
```csharp
builder.Services.AddDbContext<EduPortalDbContext>(options =>
    options.UseInMemoryDatabase("EduPortalDb"));
```

**After:**
```csharp
builder.Services.AddDbContext<EduPortalDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
```

## Database Objects

### Tables (8)
- **Users** - Stores user accounts (teachers and students)
- **Courses** - Course information
- **Enrollments** - Student-course relationships
- **Assessments** - Tests and quizzes
- **Questions** - Assessment questions
- **QuestionOptions** - Multiple choice options
- **AssessmentAttempts** - Student attempts at assessments
- **Answers** - Student answers to questions

### Views (3)
- **vw_StudentProgressSummary** - Student performance overview
- **vw_CourseEnrollmentDetails** - Course statistics
- **vw_AssessmentStatistics** - Assessment analytics

### Stored Procedures (3)
- **sp_GetStudentDashboard** - Get all student data
- **sp_GetTeacherDashboard** - Get all teacher data
- **sp_EnrollStudent** - Enroll a student in a course

### Functions (2)
- **fn_GetStudentAverageScore** - Calculate student average
- **fn_GetCourseCompletionRate** - Calculate course completion

## Sample Data Included

### Users (5)
| Username  | Password    | Role    | Name                |
|-----------|-------------|---------|---------------------|
| teacher1  | password123 | Teacher | Dr. Sarah Johnson   |
| student1  | password123 | Student | Alex Chen           |
| student2  | password123 | Student | Emily Davis         |
| student3  | password123 | Student | John Smith          |
| student4  | password123 | Student | Sarah Wilson        |

### Courses (3)
- Advanced Mathematics
- Physics Fundamentals
- Chemistry Lab

### Assessments (7)
- Calculus Quiz (13 questions)
- Algebra Test (8 questions)
- Motion Problems (11 questions)
- And more...

## Useful Queries

### View All Tables and Record Counts
```sql
USE EduPortalDb;

SELECT 
    t.name AS TableName,
    p.rows AS RowCount
FROM sys.tables t
INNER JOIN sys.partitions p ON t.object_id = p.object_id
WHERE p.index_id IN (0,1)
ORDER BY t.name;
```

### View Student Progress
```sql
SELECT * FROM vw_StudentProgressSummary;
```

### Get Student Dashboard
```sql
EXEC sp_GetStudentDashboard @StudentId = '2';
```

### Get Teacher Courses with Statistics
```sql
SELECT * FROM vw_CourseEnrollmentDetails;
```

### Find Pending Assessments for a Student
```sql
SELECT 
    a.Id, a.Title, a.DueDate,
    c.Name AS CourseName
FROM Assessments a
INNER JOIN Courses c ON a.CourseId = c.Id
INNER JOIN Enrollments e ON c.Id = e.CourseId
WHERE e.StudentId = '2'
    AND a.IsPublished = 1
    AND a.Id NOT IN (
        SELECT AssessmentId 
        FROM AssessmentAttempts 
        WHERE StudentId = '2' AND Status = 2
    );
```

### View Assessment Statistics
```sql
SELECT 
    AssessmentTitle,
    CourseName,
    TotalAttempts,
    CAST(AverageScore AS DECIMAL(5,2)) AS AverageScore,
    CAST(MinScore AS DECIMAL(5,2)) AS MinScore,
    CAST(MaxScore AS DECIMAL(5,2)) AS MaxScore
FROM vw_AssessmentStatistics
WHERE TotalAttempts > 0;
```

## Backup and Restore

### Create Backup
```sql
BACKUP DATABASE EduPortalDb
TO DISK = 'C:\Backup\EduPortalDb.bak'
WITH FORMAT, COMPRESSION;
```

### Restore from Backup
```sql
USE master;
RESTORE DATABASE EduPortalDb
FROM DISK = 'C:\Backup\EduPortalDb.bak'
WITH REPLACE;
```

## Troubleshooting

### Issue: "Database already exists"
The script automatically drops and recreates the database. If you have connection issues:
```sql
USE master;
ALTER DATABASE EduPortalDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE EduPortalDb;
```

### Issue: "Cannot open database"
Check your connection string and SQL Server service is running:
```bash
# Windows
net start MSSQLSERVER

# Check service status
services.msc
```

### Issue: Permission denied
Ensure your SQL user has appropriate permissions:
```sql
-- Create user with full permissions
CREATE LOGIN eduportal_app WITH PASSWORD = 'SecurePassword123!';
USE EduPortalDb;
CREATE USER eduportal_app FOR LOGIN eduportal_app;
ALTER ROLE db_owner ADD MEMBER eduportal_app;
```

## Entity Framework Core Migrations (Alternative)

If you prefer using EF Core migrations instead:

```bash
# Add migration
dotnet ef migrations add InitialCreate --project EduPortal.Api

# Update database
dotnet ef database update --project EduPortal.Api

# Remove migration (if needed)
dotnet ef migrations remove --project EduPortal.Api
```

## Performance Optimization

The script includes:
- ✅ Primary keys on all tables
- ✅ Foreign key relationships with proper cascade rules
- ✅ Indexes on frequently queried columns
- ✅ Check constraints for data validation
- ✅ Views for common queries
- ✅ Stored procedures for complex operations

## Security Considerations

1. **Change default passwords** immediately after setup
2. **Use parameterized queries** to prevent SQL injection
3. **Create separate users** for different environments
4. **Enable encryption** for sensitive data
5. **Regular backups** and test restore procedures

## Next Steps

1. ✅ Run the CreateDatabase.sql script
2. ✅ Update appsettings.json with connection string
3. ✅ Update Program.cs to use SQL Server
4. ✅ Test the connection
5. ✅ Run the application

## Support

For issues or questions:
- Check the main README.md
- Review SQL Server logs
- Verify connection string format
- Ensure SQL Server is running and accessible
