-- =============================================
-- Quick Database Verification Queries
-- Run these after database creation
-- =============================================

USE EduPortalDb;
GO

PRINT '=============================================';
PRINT 'Database Verification Report';
PRINT '=============================================';
PRINT '';

-- Check all tables exist and have data
PRINT 'TABLE RECORD COUNTS:';
PRINT '--------------------------------------------';

SELECT 
    'Users' AS TableName, 
    COUNT(*) AS RecordCount,
    'Should be 5' AS Expected
FROM Users
UNION ALL
SELECT 'Courses', COUNT(*), 'Should be 3' FROM Courses
UNION ALL
SELECT 'Enrollments', COUNT(*), 'Should be 7' FROM Enrollments
UNION ALL
SELECT 'Assessments', COUNT(*), 'Should be 7' FROM Assessments
UNION ALL
SELECT 'Questions', COUNT(*), 'Should be 13' FROM Questions
UNION ALL
SELECT 'QuestionOptions', COUNT(*), 'Should be 32' FROM QuestionOptions
UNION ALL
SELECT 'AssessmentAttempts', COUNT(*), 'Should be 4' FROM AssessmentAttempts
UNION ALL
SELECT 'Answers', COUNT(*), 'Should be 12' FROM Answers;

PRINT '';
PRINT 'USER ACCOUNTS:';
PRINT '--------------------------------------------';

SELECT 
    Username,
    Name,
    Email,
    CASE Role WHEN 0 THEN 'Student' WHEN 1 THEN 'Teacher' END AS Role
FROM Users
ORDER BY Role DESC, Name;

PRINT '';
PRINT 'COURSE ENROLLMENT SUMMARY:';
PRINT '--------------------------------------------';

SELECT 
    c.Name AS CourseName,
    COUNT(e.StudentId) AS EnrolledStudents,
    COUNT(a.Id) AS TotalAssessments
FROM Courses c
LEFT JOIN Enrollments e ON c.Id = e.CourseId
LEFT JOIN Assessments a ON c.Id = a.CourseId
GROUP BY c.Name
ORDER BY c.Name;

PRINT '';
PRINT 'ASSESSMENT COMPLETION STATUS:';
PRINT '--------------------------------------------';

SELECT 
    a.Title AS AssessmentTitle,
    c.Name AS CourseName,
    COUNT(aa.Id) AS TotalAttempts,
    AVG(CAST(aa.Score AS FLOAT) / NULLIF(aa.MaxScore, 0) * 100) AS AverageScore
FROM Assessments a
INNER JOIN Courses c ON a.CourseId = c.Id
LEFT JOIN AssessmentAttempts aa ON a.Id = aa.AssessmentId AND aa.Status = 2
GROUP BY a.Title, c.Name
ORDER BY c.Name, a.Title;

PRINT '';
PRINT 'STUDENT PROGRESS SUMMARY:';
PRINT '--------------------------------------------';

-- Check if views exist
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_StudentProgressSummary')
BEGIN
    SELECT * FROM vw_StudentProgressSummary ORDER BY StudentName;
END
ELSE
BEGIN
    -- Fallback query if view doesn't exist
    SELECT 
        u.Name AS StudentName,
        COUNT(DISTINCT e.CourseId) AS TotalCoursesEnrolled,
        COUNT(DISTINCT aa.AssessmentId) AS CompletedAssessments,
        CASE 
            WHEN COUNT(aa.Id) > 0 
            THEN AVG(CAST(aa.Score AS FLOAT) / NULLIF(aa.MaxScore, 0) * 100)
            ELSE 0 
        END AS AverageScore
    FROM Users u
    LEFT JOIN Enrollments e ON u.Id = e.StudentId
    LEFT JOIN AssessmentAttempts aa ON u.Id = aa.StudentId AND aa.Status = 2
    WHERE u.Role = 0
    GROUP BY u.Id, u.Name
    ORDER BY u.Name;
    PRINT '(Note: Using fallback query - views not created)';
END

PRINT '';
PRINT 'DATABASE OBJECTS CHECK:';
PRINT '--------------------------------------------';

SELECT 'Tables' AS ObjectType, COUNT(*) AS Count FROM sys.tables WHERE name IN (
    'Users', 'Courses', 'Enrollments', 'Assessments', 'Questions', 
    'QuestionOptions', 'AssessmentAttempts', 'Answers'
)
UNION ALL
SELECT 'Views', COUNT(*) FROM sys.views WHERE name LIKE 'vw_%'
UNION ALL
SELECT 'Stored Procedures', COUNT(*) FROM sys.procedures WHERE name LIKE 'sp_%'
UNION ALL
SELECT 'Functions', COUNT(*) FROM sys.objects WHERE type = 'FN' AND name LIKE 'fn_%'
UNION ALL
SELECT 'Indexes', COUNT(*) FROM sys.indexes WHERE name IS NOT NULL AND name NOT LIKE 'PK_%';

PRINT '';
PRINT '=============================================';
PRINT 'Verification Complete!';
PRINT '=============================================';
PRINT '';
PRINT 'Test the API endpoints with these credentials:';
PRINT 'Username: teacher1 | Password: password123';
PRINT 'Username: student1 | Password: password123';
PRINT '';

GO
