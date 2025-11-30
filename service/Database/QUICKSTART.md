# EduPortal Database - Quick Setup Guide

## ⚠️ IMPORTANT WARNING

**CreateDatabaseObjects.sql will DELETE the entire EduPortalDb database and recreate it from scratch!**

All existing data will be lost. Use this script for:
- Initial setup
- Fresh start after testing
- Resetting to default state

## 🚀 Quick Setup (3 Steps)

### Step 1: Run CreateDatabaseObjects.sql
This script will:
1. ✅ Drop the entire EduPortalDb database (if exists)
2. ✅ Create fresh EduPortalDb database
3. ✅ Create all 8 tables with relationships
4. ✅ Create 32 indexes for performance
5. ✅ Create 3 views for reporting
6. ✅ Create 3 stored procedures
7. ✅ Create 2 functions
8. ✅ Insert sample data (5 users, 3 courses, etc.)

```cmd
sqlcmd -S your-server -i Database\CreateDatabaseObjects.sql
```

### Step 2: Run DiagnosticCheck.sql (Optional)
Verify what was created:

```cmd
sqlcmd -S your-server -i Database\DiagnosticCheck.sql
```

### Step 3: Run VerifyDatabase.sql
Test that everything works:

```cmd
sqlcmd -S your-server -i Database\VerifyDatabase.sql
```

## 📊 What Gets Created

### Tables (8)
- Users (5 records: 2 teachers, 3 students)
- Courses (3 records)
- Enrollments (7 records)
- Assessments (7 records)
- Questions (12 records)
- QuestionOptions (32 records)
- AssessmentAttempts (4 records)
- Answers (12 records)

### Views (3)
- vw_StudentProgressSummary - Student statistics
- vw_CourseEnrollmentDetails - Course enrollment info
- vw_AssessmentStatistics - Assessment analytics

### Stored Procedures (3)
- sp_GetStudentDashboard(@StudentId) - Complete student dashboard data
- sp_GetTeacherDashboard(@TeacherId) - Complete teacher dashboard data
- sp_EnrollStudent(@StudentId, @CourseId) - Enroll a student

### Functions (2)
- fn_GetStudentAverageScore(@StudentId) - Calculate average score
- fn_GetCourseCompletionRate(@CourseId) - Calculate completion rate

### Indexes (32)
All optimized for query performance on foreign keys and frequently searched columns.

## 🔑 Test Credentials

All passwords are: **password123**

| Username  | Role    | Email                          |
|-----------|---------|--------------------------------|
| teacher1  | Teacher | sarah.wilson@eduportal.com     |
| teacher2  | Teacher | michael.chen@eduportal.com     |
| student1  | Student | john.smith@student.edu         |
| student2  | Student | emma.johnson@student.edu       |
| student3  | Student | michael.brown@student.edu      |

## 🔄 Alternative Scripts

### CreateDatabase.sql
Original comprehensive script with detailed comments (700+ lines).
- Use if you want to read through the creation process
- Same result as CreateDatabaseObjects.sql

### AddSampleData.sql
Adds MORE test data to existing database:
- 3 additional teachers
- 3 additional students
- 3 additional courses

**Important:** Only run this AFTER CreateDatabaseObjects.sql

```cmd
sqlcmd -S your-server -i Database\AddSampleData.sql
```

## 🛠️ Troubleshooting

### Problem: "Database is being accessed by other users"
**Solution:** Close all connections in SSMS, then run the script again. The script has `SET SINGLE_USER WITH ROLLBACK IMMEDIATE` to force close connections.

### Problem: "Invalid object name 'vw_StudentProgressSummary'"
**Solution:** Views weren't created. Run CreateDatabaseObjects.sql which creates everything.

### Problem: Need to keep existing data
**Solution:** Don't use CreateDatabaseObjects.sql. Instead:
1. Back up your database first
2. Use individual CREATE VIEW/PROCEDURE scripts
3. Or manually create missing objects

## 📝 Connecting Backend to Database

After running the scripts, update your `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=your-server;Database=EduPortalDb;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

Then update `Program.cs`:

```csharp
// Replace this line:
builder.Services.AddDbContext<EduPortalDbContext>(options =>
    options.UseInMemoryDatabase("EduPortalDb"));

// With this:
builder.Services.AddDbContext<EduPortalDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
```

## 🎯 Next Steps

1. ✅ Run CreateDatabaseObjects.sql
2. ✅ Verify with VerifyDatabase.sql
3. ✅ Update appsettings.json
4. ✅ Update Program.cs
5. ✅ Run backend: `dotnet run --project service`
6. ✅ Test API at http://localhost:5000/swagger

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **CreateDatabaseObjects.sql** | **Complete database recreation** |
| CreateDatabase.sql | Detailed original script |
| DiagnosticCheck.sql | Check what exists in database |
| VerifyDatabase.sql | Test database functionality |
| AddSampleData.sql | Add more test data |
| README.md | Detailed setup guide |
| SCHEMA.md | ER diagram and relationships |
| QUICKSTART.md | **This file** |

---

**Need Help?** Check README.md for detailed documentation or SCHEMA.md for relationship diagrams.
