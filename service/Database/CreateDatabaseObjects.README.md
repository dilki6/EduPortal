# CreateDatabaseObjects.sql - Complete Database Reset Script

## ⚠️ CRITICAL WARNING

**THIS SCRIPT WILL DELETE THE ENTIRE EduPortalDb DATABASE!**

## What This Script Does

1. **Drops EduPortalDb** - Completely removes the database if it exists
2. **Creates Fresh Database** - New empty EduPortalDb
3. **Creates All Tables** - 8 tables with proper relationships
4. **Creates Indexes** - 32 indexes for performance
5. **Creates Views** - 3 reporting views
6. **Creates Stored Procedures** - 3 SPs for common operations
7. **Creates Functions** - 2 functions for calculations
8. **Inserts Sample Data** - Complete test dataset

## Usage

```cmd
REM For local SQL Server (Windows Authentication)
sqlcmd -S localhost -i Database\CreateDatabaseObjects.sql

REM For SQL Server with username/password
sqlcmd -S your-server -U your-username -P your-password -i Database\CreateDatabaseObjects.sql

REM For SQL Server Express
sqlcmd -S localhost\SQLEXPRESS -i Database\CreateDatabaseObjects.sql
```

## What You Get

### Complete Database Structure
- ✅ 8 Tables with relationships
- ✅ 32 Performance indexes
- ✅ 3 Reporting views
- ✅ 3 Stored procedures
- ✅ 2 Utility functions

### Sample Data
- ✅ 5 Users (2 teachers, 3 students)
- ✅ 3 Courses
- ✅ 7 Student enrollments
- ✅ 7 Assessments
- ✅ 12 Questions with 32 options
- ✅ 4 Completed attempts with 12 answers

### Test Credentials
- Username: **teacher1** | Password: **password123**
- Username: **student1** | Password: **password123**

## When to Use This Script

### ✅ Use When:
- Setting up EduPortal for the first time
- You need a fresh start
- Testing and want to reset data
- Views/SPs/Functions are missing
- Database is corrupted

### ❌ Don't Use When:
- You have production data to keep
- You only need to add more sample data (use AddSampleData.sql instead)
- You only need to fix views (manually create them)

## Script Sections

1. **Database Deletion** (Lines 1-35)
   - Closes all connections
   - Drops EduPortalDb database
   
2. **Database Creation** (Lines 36-45)
   - Creates new EduPortalDb
   
3. **Table Creation** (Lines 46-165)
   - Users, Courses, Enrollments, Assessments
   - Questions, QuestionOptions, AssessmentAttempts, Answers
   
4. **Index Creation** (Lines 166-195)
   - 32 indexes on foreign keys and search columns
   
5. **View Creation** (Lines 196-260)
   - vw_StudentProgressSummary
   - vw_CourseEnrollmentDetails
   - vw_AssessmentStatistics
   
6. **Stored Procedure Creation** (Lines 261-355)
   - sp_GetStudentDashboard
   - sp_GetTeacherDashboard
   - sp_EnrollStudent
   
7. **Function Creation** (Lines 356-395)
   - fn_GetStudentAverageScore
   - fn_GetCourseCompletionRate
   
8. **Sample Data Insertion** (Lines 396-550)
   - All test data with realistic values
   
9. **Verification** (Lines 551-600)
   - Summary of what was created
   - Test credentials display

## Output Example

```
=============================================
WARNING: Deleting EduPortalDb Database!
All data will be lost!
=============================================

Dropping EduPortalDb database...
Database dropped successfully!

Creating fresh EduPortalDb database...
Database created successfully!

=============================================
Creating Tables...
=============================================

Created Users table
Created Courses table
Created Enrollments table
...

=============================================
DATABASE CREATED SUCCESSFULLY!
=============================================

Database Summary:
--------------------------------------------
Tables                  8
Views                   3
Stored Procedures       3
Functions               2
Indexes                 32

Data Summary:
--------------------------------------------
Users                   5
Courses                 3
Enrollments             7
Assessments             7
Questions              12
QuestionOptions        32
AssessmentAttempts      4
Answers                12

Test Credentials:
--------------------------------------------
Teacher: teacher1 / password123
Student: student1 / password123

=============================================
Ready to use! Run VerifyDatabase.sql to test.
=============================================
```

## After Running This Script

1. **Verify the database:**
   ```cmd
   sqlcmd -S your-server -i Database\VerifyDatabase.sql
   ```

2. **Check what was created:**
   ```cmd
   sqlcmd -S your-server -i Database\DiagnosticCheck.sql
   ```

3. **Update your backend connection string** in `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=EduPortalDb;Trusted_Connection=True;TrustServerCertificate=True;"
     }
   }
   ```

4. **Update Program.cs** to use SQL Server instead of In-Memory database

5. **Test the API:**
   ```cmd
   cd service
   dotnet run
   ```
   Then open http://localhost:5000/swagger

## Troubleshooting

### Error: "Cannot drop database because it is currently in use"
The script handles this automatically with `SET SINGLE_USER WITH ROLLBACK IMMEDIATE`.
If it still fails, close all SSMS windows connected to the database.

### Error: "Invalid object name 'Users'"
The database wasn't created. Check that you have permissions to create databases.

### Error: "Cannot insert duplicate key"
The script was run twice without dropping first. The drop section should handle this.

## Related Scripts

- **CreateDatabase.sql** - Original detailed script (same result, more comments)
- **DiagnosticCheck.sql** - See what's in the database
- **VerifyDatabase.sql** - Test all functionality
- **AddSampleData.sql** - Add MORE data (don't delete existing)

## Database Schema

See **SCHEMA.md** for:
- Complete ER diagram
- Table relationships
- Cascade delete rules
- Index strategy
- Business rules

## Need Help?

Check these docs in order:
1. **QUICKSTART.md** - Fast setup guide
2. **README.md** - Detailed documentation
3. **SCHEMA.md** - Database design details

---

**Remember:** This script DELETES everything. Back up first if you have data to keep!
