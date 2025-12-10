-- =============================================
-- Diagnostic Check - Run this to see what exists
-- =============================================

USE EduPortalDb;
GO

PRINT '=============================================';
PRINT 'DIAGNOSTIC REPORT';
PRINT '=============================================';
PRINT '';

-- Check Tables
PRINT 'TABLES:';
SELECT 
    name AS TableName, 
    create_date AS Created
FROM sys.tables 
WHERE name IN (
    'Users', 'Courses', 'Enrollments', 'Assessments', 
    'Questions', 'QuestionOptions', 'AssessmentAttempts', 'Answers'
)
ORDER BY name;
PRINT '';

-- Check Views
PRINT 'VIEWS:';
IF EXISTS (SELECT * FROM sys.views WHERE name LIKE 'vw_%')
BEGIN
    SELECT 
        name AS ViewName,
        create_date AS Created
    FROM sys.views 
    WHERE name LIKE 'vw_%'
    ORDER BY name;
END
ELSE
BEGIN
    PRINT 'No views found!';
    PRINT 'Views should be: vw_StudentProgressSummary, vw_CourseEnrollmentDetails, vw_AssessmentStatistics';
END
PRINT '';

-- Check Stored Procedures
PRINT 'STORED PROCEDURES:';
IF EXISTS (SELECT * FROM sys.procedures WHERE name LIKE 'sp_%')
BEGIN
    SELECT 
        name AS ProcedureName,
        create_date AS Created
    FROM sys.procedures 
    WHERE name LIKE 'sp_%'
    ORDER BY name;
END
ELSE
BEGIN
    PRINT 'No stored procedures found!';
END
PRINT '';

-- Check Functions
PRINT 'FUNCTIONS:';
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'FN' AND name LIKE 'fn_%')
BEGIN
    SELECT 
        name AS FunctionName,
        create_date AS Created
    FROM sys.objects 
    WHERE type = 'FN' AND name LIKE 'fn_%'
    ORDER BY name;
END
ELSE
BEGIN
    PRINT 'No functions found!';
END
PRINT '';

-- Check Indexes
PRINT 'INDEXES (excluding primary keys):';
SELECT 
    t.name AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE i.name IS NOT NULL 
    AND i.name NOT LIKE 'PK_%'
    AND t.name IN (
        'Users', 'Courses', 'Enrollments', 'Assessments', 
        'Questions', 'QuestionOptions', 'AssessmentAttempts', 'Answers'
    )
ORDER BY t.name, i.name;
PRINT '';

-- Check Foreign Keys
PRINT 'FOREIGN KEY RELATIONSHIPS:';
SELECT 
    OBJECT_NAME(fk.parent_object_id) AS ChildTable,
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.referenced_object_id) AS ParentTable
FROM sys.foreign_keys fk
WHERE OBJECT_NAME(fk.parent_object_id) IN (
    'Users', 'Courses', 'Enrollments', 'Assessments', 
    'Questions', 'QuestionOptions', 'AssessmentAttempts', 'Answers'
)
ORDER BY ChildTable, ParentTable;
PRINT '';

PRINT '=============================================';
PRINT 'DIAGNOSTIC COMPLETE';
PRINT '=============================================';
GO
