-- =============================================
-- Sample Data Expansion Script
-- Add more users, courses, and assessments
-- Note: SetupDatabase.sql already creates:
--   Users: 1-5 (teacher1, teacher2, student1-3)
--   Courses: 1-3
-- This script is IDEMPOTENT - safe to run multiple times
-- =============================================

USE EduPortalDb;
GO

PRINT 'Adding additional sample data...';
PRINT '';

-- Add more teachers (ID 6-7, avoid conflict with teacher2)
-- Only insert if they don't already exist
IF NOT EXISTS (SELECT 1 FROM Users WHERE Id = '6')
BEGIN
    INSERT INTO Users (Id, Username, PasswordHash, Name, Email, Role, CreatedAt) VALUES
    ('6', 'teacher3', '$2a$11$XJLqF.PZw7hqQN.yPmYULeIu5gBKJ8RZ.ZQPvPBCKxwEU7.4K7s1W', 'Prof. Michael Brown', 'michael.brown@university.edu', 1, GETUTCDATE());
    PRINT '  ✓ Added teacher3 (Prof. Michael Brown)';
END
ELSE
    PRINT '  ⊘ teacher3 already exists';

IF NOT EXISTS (SELECT 1 FROM Users WHERE Id = '7')
BEGIN
    INSERT INTO Users (Id, Username, PasswordHash, Name, Email, Role, CreatedAt) VALUES
    ('7', 'teacher4', '$2a$11$XJLqF.PZw7hqQN.yPmYULeIu5gBKJ8RZ.ZQPvPBCKxwEU7.4K7s1W', 'Dr. Lisa Martinez', 'lisa.martinez@university.edu', 1, GETUTCDATE());
    PRINT '  ✓ Added teacher4 (Dr. Lisa Martinez)';
END
ELSE
    PRINT '  ⊘ teacher4 already exists';

-- Add more students (ID 8-10)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Id = '8')
BEGIN
    INSERT INTO Users (Id, Username, PasswordHash, Name, Email, Role, CreatedAt) VALUES
    ('8', 'student4', '$2a$11$XJLqF.PZw7hqQN.yPmYULeIu5gBKJ8RZ.ZQPvPBCKxwEU7.4K7s1W', 'David Lee', 'david.lee@student.edu', 0, GETUTCDATE());
    PRINT '  ✓ Added student4 (David Lee)';
END
ELSE
    PRINT '  ⊘ student4 already exists';

IF NOT EXISTS (SELECT 1 FROM Users WHERE Id = '9')
BEGIN
    INSERT INTO Users (Id, Username, PasswordHash, Name, Email, Role, CreatedAt) VALUES
    ('9', 'student5', '$2a$11$XJLqF.PZw7hqQN.yPmYULeIu5gBKJ8RZ.ZQPvPBCKxwEU7.4K7s1W', 'Maria Garcia', 'maria.garcia@student.edu', 0, GETUTCDATE());
    PRINT '  ✓ Added student5 (Maria Garcia)';
END
ELSE
    PRINT '  ⊘ student5 already exists';

IF NOT EXISTS (SELECT 1 FROM Users WHERE Id = '10')
BEGIN
    INSERT INTO Users (Id, Username, PasswordHash, Name, Email, Role, CreatedAt) VALUES
    ('10', 'student6', '$2a$11$XJLqF.PZw7hqQN.yPmYULeIu5gBKJ8RZ.ZQPvPBCKxwEU7.4K7s1W', 'James Wilson', 'james.wilson@student.edu', 0, GETUTCDATE());
    PRINT '  ✓ Added student6 (James Wilson)';
END
ELSE
    PRINT '  ⊘ student6 already exists';

-- Add more courses (ID 4-6, use valid teacher IDs)
IF NOT EXISTS (SELECT 1 FROM Courses WHERE Id = '4')
BEGIN
    INSERT INTO Courses (Id, Name, Description, TeacherId, CreatedAt) VALUES
    ('4', 'Database Systems', 'Learn SQL and database design principles', '6', GETUTCDATE());
    PRINT '  ✓ Added course: Database Systems';
END
ELSE
    PRINT '  ⊘ Database Systems course already exists';

IF NOT EXISTS (SELECT 1 FROM Courses WHERE Id = '5')
BEGIN
    INSERT INTO Courses (Id, Name, Description, TeacherId, CreatedAt) VALUES
    ('5', 'Software Engineering', 'Build scalable software applications', '6', GETUTCDATE());
    PRINT '  ✓ Added course: Software Engineering';
END
ELSE
    PRINT '  ⊘ Software Engineering course already exists';

IF NOT EXISTS (SELECT 1 FROM Courses WHERE Id = '6')
BEGIN
    INSERT INTO Courses (Id, Name, Description, TeacherId, CreatedAt) VALUES
    ('6', 'Data Science Fundamentals', 'Introduction to data analysis and machine learning', '7', GETUTCDATE());
    PRINT '  ✓ Added course: Data Science Fundamentals';
END
ELSE
    PRINT '  ⊘ Data Science Fundamentals course already exists';

-- Add more enrollments (use valid student and course IDs)
-- Check each enrollment individually to avoid duplicates
IF NOT EXISTS (SELECT 1 FROM Enrollments WHERE StudentId = '8' AND CourseId = '1')
BEGIN
    INSERT INTO Enrollments (Id, StudentId, CourseId, Progress, EnrolledAt) VALUES
    (NEWID(), '8', '1', 25, GETUTCDATE());
    PRINT '  ✓ Enrolled student4 in Introduction to Programming';
END

IF NOT EXISTS (SELECT 1 FROM Enrollments WHERE StudentId = '8' AND CourseId = '4')
BEGIN
    INSERT INTO Enrollments (Id, StudentId, CourseId, Progress, EnrolledAt) VALUES
    (NEWID(), '8', '4', 40, GETUTCDATE());
    PRINT '  ✓ Enrolled student4 in Database Systems';
END

IF NOT EXISTS (SELECT 1 FROM Enrollments WHERE StudentId = '9' AND CourseId = '4')
BEGIN
    INSERT INTO Enrollments (Id, StudentId, CourseId, Progress, EnrolledAt) VALUES
    (NEWID(), '9', '4', 60, GETUTCDATE());
    PRINT '  ✓ Enrolled student5 in Database Systems';
END

IF NOT EXISTS (SELECT 1 FROM Enrollments WHERE StudentId = '9' AND CourseId = '5')
BEGIN
    INSERT INTO Enrollments (Id, StudentId, CourseId, Progress, EnrolledAt) VALUES
    (NEWID(), '9', '5', 35, GETUTCDATE());
    PRINT '  ✓ Enrolled student5 in Software Engineering';
END

IF NOT EXISTS (SELECT 1 FROM Enrollments WHERE StudentId = '10' AND CourseId = '5')
BEGIN
    INSERT INTO Enrollments (Id, StudentId, CourseId, Progress, EnrolledAt) VALUES
    (NEWID(), '10', '5', 50, GETUTCDATE());
    PRINT '  ✓ Enrolled student6 in Software Engineering';
END

IF NOT EXISTS (SELECT 1 FROM Enrollments WHERE StudentId = '10' AND CourseId = '6')
BEGIN
    INSERT INTO Enrollments (Id, StudentId, CourseId, Progress, EnrolledAt) VALUES
    (NEWID(), '10', '6', 70, GETUTCDATE());
    PRINT '  ✓ Enrolled student6 in Data Science Fundamentals';
END

PRINT '';
PRINT '=============================================';
PRINT 'Additional Sample Data Script Complete!';
PRINT '=============================================';
PRINT '';

-- Show current totals
DECLARE @TotalUsers INT, @TotalTeachers INT, @TotalStudents INT;
DECLARE @TotalCourses INT, @TotalEnrollments INT;

SELECT @TotalUsers = COUNT(*) FROM Users;
SELECT @TotalTeachers = COUNT(*) FROM Users WHERE Role = 1;
SELECT @TotalStudents = COUNT(*) FROM Users WHERE Role = 0;
SELECT @TotalCourses = COUNT(*) FROM Courses;
SELECT @TotalEnrollments = COUNT(*) FROM Enrollments;

PRINT 'Database Totals:';
PRINT '  Total Users: ' + CAST(@TotalUsers AS NVARCHAR(10)) + ' (' + CAST(@TotalTeachers AS NVARCHAR(10)) + ' teachers, ' + CAST(@TotalStudents AS NVARCHAR(10)) + ' students)';
PRINT '  Total Courses: ' + CAST(@TotalCourses AS NVARCHAR(10));
PRINT '  Total Enrollments: ' + CAST(@TotalEnrollments AS NVARCHAR(10));
PRINT '';
PRINT '=============================================';
PRINT 'Test Login Credentials (All use password123):';
PRINT '=============================================';
PRINT 'Teachers:';
PRINT '  - teacher1 / password123 (Mr. Nimali Perera)';
PRINT '  - teacher2 / password123 (Prof. Michael Chen)';
PRINT '  - teacher3 / password123 (Prof. Michael Brown)';
PRINT '  - teacher4 / password123 (Dr. Lisa Martinez)';
PRINT '';
PRINT 'Students:';
PRINT '  - student1 / password123 (John Smith)';
PRINT '  - student2 / password123 (Emma Johnson)';
PRINT '  - student3 / password123 (Michael Brown)';
PRINT '  - student4 / password123 (David Lee)';
PRINT '  - student5 / password123 (Maria Garcia)';
PRINT '  - student6 / password123 (James Wilson)';
PRINT '';

GO
