-- =============================================
-- Clean and Recreate Database Objects
-- This script will DELETE the entire EduPortalDb database
-- and recreate all objects from scratch
-- WARNING: ALL DATA WILL BE LOST!
-- =============================================

PRINT '=============================================';
PRINT 'WARNING: Deleting EduPortalDb Database!';
PRINT 'All data will be lost!';
PRINT '=============================================';
PRINT '';

-- Switch to master database
USE master;
GO

-- Close all existing connections to EduPortalDb
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'EduPortalDb')
BEGIN
    PRINT 'Closing existing connections...';
    ALTER DATABASE EduPortalDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    PRINT 'Dropping EduPortalDb database...';
    DROP DATABASE EduPortalDb;
    PRINT 'Database dropped successfully!';
    PRINT '';
    
    -- Wait a moment for files to be released
    WAITFOR DELAY '00:00:02';
END
ELSE
BEGIN
    PRINT 'EduPortalDb database not found in system.';
    PRINT '';
END
GO

-- Create new database with explicit file paths to avoid conflicts
PRINT 'Creating fresh EduPortalDb database...';
PRINT 'Using default SQL Server data directory...';

DECLARE @DataPath NVARCHAR(500);
DECLARE @LogPath NVARCHAR(500);

-- Get SQL Server default data path
SET @DataPath = CAST(SERVERPROPERTY('InstanceDefaultDataPath') AS NVARCHAR(500));
SET @LogPath = CAST(SERVERPROPERTY('InstanceDefaultLogPath') AS NVARCHAR(500));

-- If paths are NULL (older SQL Server versions), use common default
IF @DataPath IS NULL
    SET @DataPath = 'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\';
IF @LogPath IS NULL
    SET @LogPath = 'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\';

DECLARE @SQL NVARCHAR(MAX);
SET @SQL = '
CREATE DATABASE EduPortalDb
ON PRIMARY 
(
    NAME = EduPortalDb_Data,
    FILENAME = ''' + @DataPath + 'EduPortalDb.mdf'',
    SIZE = 10MB,
    MAXSIZE = UNLIMITED,
    FILEGROWTH = 10%
)
LOG ON 
(
    NAME = EduPortalDb_Log,
    FILENAME = ''' + @LogPath + 'EduPortalDb_log.ldf'',
    SIZE = 5MB,
    MAXSIZE = UNLIMITED,
    FILEGROWTH = 10%
);';

PRINT 'Data file: ' + @DataPath + 'EduPortalDb.mdf';
PRINT 'Log file: ' + @LogPath + 'EduPortalDb_log.ldf';
PRINT '';

EXEC sp_executesql @SQL;
GO

PRINT 'Database created successfully!';
PRINT '';

-- Switch to the new database
USE EduPortalDb;
GO

PRINT '=============================================';
PRINT 'Creating Tables...';
PRINT '=============================================';
PRINT '';

-- Create Users table
CREATE TABLE Users (
    Id NVARCHAR(50) PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(500) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Email NVARCHAR(200) NOT NULL UNIQUE,
    Role INT NOT NULL CHECK (Role IN (0, 1)),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
PRINT 'Created Users table';

-- Create Courses table
CREATE TABLE Courses (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    TeacherId NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (TeacherId) REFERENCES Users(Id)
);
PRINT 'Created Courses table';

-- Create Enrollments table
CREATE TABLE Enrollments (
    Id NVARCHAR(50) PRIMARY KEY,
    StudentId NVARCHAR(50) NOT NULL,
    CourseId NVARCHAR(50) NOT NULL,
    Progress INT NOT NULL DEFAULT 0 CHECK (Progress >= 0 AND Progress <= 100),
    EnrolledAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (StudentId) REFERENCES Users(Id) ON DELETE CASCADE,
    FOREIGN KEY (CourseId) REFERENCES Courses(Id) ON DELETE CASCADE,
    UNIQUE (StudentId, CourseId)
);
PRINT 'Created Enrollments table';

-- Create Assessments table
CREATE TABLE Assessments (
    Id NVARCHAR(50) PRIMARY KEY,
    CourseId NVARCHAR(50) NOT NULL,
    Title NVARCHAR(300) NOT NULL,
    Description NVARCHAR(MAX),
    DurationMinutes INT CHECK (DurationMinutes > 0),
    IsPublished BIT NOT NULL DEFAULT 0,
    DueDate DATETIME2,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (CourseId) REFERENCES Courses(Id) ON DELETE CASCADE
);
PRINT 'Created Assessments table';

-- Create Questions table
CREATE TABLE Questions (
    Id NVARCHAR(50) PRIMARY KEY,
    AssessmentId NVARCHAR(50) NOT NULL,
    [Text] NVARCHAR(MAX) NOT NULL,
    [Type] INT NOT NULL CHECK ([Type] IN (0, 1, 2, 3)),
    Points INT NOT NULL CHECK (Points > 0),
    [Order] INT NOT NULL,
    FOREIGN KEY (AssessmentId) REFERENCES Assessments(Id) ON DELETE CASCADE
);
PRINT 'Created Questions table';

-- Create QuestionOptions table
CREATE TABLE QuestionOptions (
    Id NVARCHAR(50) PRIMARY KEY,
    QuestionId NVARCHAR(50) NOT NULL,
    [Text] NVARCHAR(MAX) NOT NULL,
    IsCorrect BIT NOT NULL DEFAULT 0,
    [Order] INT NOT NULL,
    FOREIGN KEY (QuestionId) REFERENCES Questions(Id) ON DELETE CASCADE
);
PRINT 'Created QuestionOptions table';

-- Create AssessmentAttempts table
CREATE TABLE AssessmentAttempts (
    Id NVARCHAR(50) PRIMARY KEY,
    AssessmentId NVARCHAR(50) NOT NULL,
    StudentId NVARCHAR(50) NOT NULL,
    StartedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CompletedAt DATETIME2,
    Score INT NOT NULL DEFAULT 0,
    MaxScore INT NOT NULL DEFAULT 0,
    [Status] INT NOT NULL DEFAULT 0 CHECK ([Status] IN (0, 1, 2)),
    FOREIGN KEY (AssessmentId) REFERENCES Assessments(Id),
    FOREIGN KEY (StudentId) REFERENCES Users(Id) ON DELETE CASCADE
);
PRINT 'Created AssessmentAttempts table';

-- Create Answers table
CREATE TABLE Answers (
    Id NVARCHAR(50) PRIMARY KEY,
    AttemptId NVARCHAR(50) NOT NULL,
    QuestionId NVARCHAR(50) NOT NULL,
    SelectedOptionId NVARCHAR(50),
    TextAnswer NVARCHAR(MAX),
    PointsEarned INT NOT NULL DEFAULT 0,
    IsCorrect BIT NOT NULL DEFAULT 0,
    FOREIGN KEY (AttemptId) REFERENCES AssessmentAttempts(Id) ON DELETE CASCADE,
    FOREIGN KEY (QuestionId) REFERENCES Questions(Id)
);
PRINT 'Created Answers table';

PRINT '';
PRINT '=============================================';
PRINT 'Creating Indexes...';
PRINT '=============================================';
PRINT '';

-- Users indexes
CREATE INDEX IX_Users_Role ON Users(Role);
CREATE INDEX IX_Users_Username ON Users(Username);
CREATE INDEX IX_Users_Email ON Users(Email);

-- Courses indexes
CREATE INDEX IX_Courses_TeacherId ON Courses(TeacherId);

-- Enrollments indexes
CREATE INDEX IX_Enrollments_StudentId ON Enrollments(StudentId);
CREATE INDEX IX_Enrollments_CourseId ON Enrollments(CourseId);

-- Assessments indexes
CREATE INDEX IX_Assessments_CourseId ON Assessments(CourseId);
CREATE INDEX IX_Assessments_IsPublished ON Assessments(IsPublished);
CREATE INDEX IX_Assessments_DueDate ON Assessments(DueDate);

-- Questions indexes
CREATE INDEX IX_Questions_AssessmentId ON Questions(AssessmentId);
CREATE INDEX IX_Questions_Order ON Questions([Order]);

-- QuestionOptions indexes
CREATE INDEX IX_QuestionOptions_QuestionId ON QuestionOptions(QuestionId);
CREATE INDEX IX_QuestionOptions_Order ON QuestionOptions([Order]);

-- AssessmentAttempts indexes
CREATE INDEX IX_AssessmentAttempts_AssessmentId ON AssessmentAttempts(AssessmentId);
CREATE INDEX IX_AssessmentAttempts_StudentId ON AssessmentAttempts(StudentId);
CREATE INDEX IX_AssessmentAttempts_Status ON AssessmentAttempts([Status]);

-- Answers indexes
CREATE INDEX IX_Answers_AttemptId ON Answers(AttemptId);
CREATE INDEX IX_Answers_QuestionId ON Answers(QuestionId);

PRINT 'Indexes created successfully!';
PRINT '';

-- =============================================
-- Create Views for Reporting
-- =============================================

PRINT '=============================================';
PRINT 'Creating Views...';
PRINT '=============================================';
PRINT '';
GO

-- View: Student Progress Summary
CREATE VIEW vw_StudentProgressSummary AS
SELECT 
    u.Id AS StudentId,
    u.Name AS StudentName,
    u.Email AS StudentEmail,
    COUNT(DISTINCT e.CourseId) AS TotalCourses,
    COUNT(DISTINCT CASE WHEN aa.Status = 2 THEN aa.Id END) AS CompletedAssessments,
    AVG(CASE WHEN aa.Status = 2 THEN (CAST(aa.Score AS FLOAT) / NULLIF(aa.MaxScore, 0)) * 100 END) AS AverageScore
FROM Users u
LEFT JOIN Enrollments e ON u.Id = e.StudentId
LEFT JOIN Courses c ON e.CourseId = c.Id
LEFT JOIN Assessments a ON c.Id = a.CourseId AND a.IsPublished = 1
LEFT JOIN AssessmentAttempts aa ON a.Id = aa.AssessmentId AND u.Id = aa.StudentId
WHERE u.Role = 0
GROUP BY u.Id, u.Name, u.Email;
GO

PRINT '  ✓ Created vw_StudentProgressSummary';
GO

-- View: Course Enrollment Details
CREATE VIEW vw_CourseEnrollmentDetails AS
SELECT 
    c.Id AS CourseId,
    c.Name AS CourseName,
    c.Description AS CourseDescription,
    u.Id AS TeacherId,
    u.Name AS TeacherName,
    COUNT(DISTINCT e.StudentId) AS EnrolledStudents,
    COUNT(DISTINCT a.Id) AS TotalAssessments,
    c.CreatedAt
FROM Courses c
INNER JOIN Users u ON c.TeacherId = u.Id
LEFT JOIN Enrollments e ON c.Id = e.CourseId
LEFT JOIN Assessments a ON c.Id = a.CourseId
GROUP BY c.Id, c.Name, c.Description, u.Id, u.Name, c.CreatedAt;
GO

PRINT '  ✓ Created vw_CourseEnrollmentDetails';
GO

-- View: Assessment Statistics
CREATE VIEW vw_AssessmentStatistics AS
SELECT 
    a.Id AS AssessmentId,
    a.Title AS AssessmentTitle,
    c.Name AS CourseName,
    COUNT(DISTINCT aa.StudentId) AS TotalAttempts,
    AVG(CASE WHEN aa.Status = 2 THEN (CAST(aa.Score AS FLOAT) / NULLIF(aa.MaxScore, 0)) * 100 END) AS AverageScore,
    MIN(CASE WHEN aa.Status = 2 THEN (CAST(aa.Score AS FLOAT) / NULLIF(aa.MaxScore, 0)) * 100 END) AS MinScore,
    MAX(CASE WHEN aa.Status = 2 THEN (CAST(aa.Score AS FLOAT) / NULLIF(aa.MaxScore, 0)) * 100 END) AS MaxScore,
    a.DueDate,
    a.IsPublished
FROM Assessments a
INNER JOIN Courses c ON a.CourseId = c.Id
LEFT JOIN AssessmentAttempts aa ON a.Id = aa.AssessmentId
GROUP BY a.Id, a.Title, c.Name, a.DueDate, a.IsPublished;
GO

PRINT '  ✓ Created vw_AssessmentStatistics';
PRINT '';
GO

-- =============================================
-- Create Stored Procedures
-- =============================================

PRINT '=============================================';
PRINT 'Creating Stored Procedures...';
PRINT '=============================================';
PRINT '';
GO

-- Procedure: Get Student Dashboard Data
CREATE PROCEDURE sp_GetStudentDashboard
    @StudentId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Student Info
    SELECT Id, Username, Name, Email, Role
    FROM Users
    WHERE Id = @StudentId;
    
    -- Enrolled Courses
    SELECT 
        c.Id, c.Name, c.Description, c.TeacherId,
        u.Name AS TeacherName,
        e.Progress, e.EnrolledAt
    FROM Enrollments e
    INNER JOIN Courses c ON e.CourseId = c.Id
    INNER JOIN Users u ON c.TeacherId = u.Id
    WHERE e.StudentId = @StudentId
    ORDER BY e.EnrolledAt DESC;
    
    -- Recent Attempts
    SELECT TOP 10
        aa.Id, aa.AssessmentId, aa.StartedAt, aa.CompletedAt,
        aa.Score, aa.MaxScore, aa.Status,
        a.Title AS AssessmentTitle,
        c.Name AS CourseName
    FROM AssessmentAttempts aa
    INNER JOIN Assessments a ON aa.AssessmentId = a.Id
    INNER JOIN Courses c ON a.CourseId = c.Id
    WHERE aa.StudentId = @StudentId
    ORDER BY aa.StartedAt DESC;
END;
GO

PRINT '  ✓ Created sp_GetStudentDashboard';
GO

-- Procedure: Get Teacher Dashboard Data
CREATE PROCEDURE sp_GetTeacherDashboard
    @TeacherId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Teacher Info
    SELECT Id, Username, Name, Email, Role
    FROM Users
    WHERE Id = @TeacherId;
    
    -- Courses
    SELECT 
        c.Id, c.Name, c.Description, c.CreatedAt,
        COUNT(DISTINCT e.StudentId) AS EnrolledStudents,
        COUNT(DISTINCT a.Id) AS TotalAssessments
    FROM Courses c
    LEFT JOIN Enrollments e ON c.Id = e.CourseId
    LEFT JOIN Assessments a ON c.Id = a.CourseId
    WHERE c.TeacherId = @TeacherId
    GROUP BY c.Id, c.Name, c.Description, c.CreatedAt
    ORDER BY c.CreatedAt DESC;
END;
GO

PRINT '  ✓ Created sp_GetTeacherDashboard';
GO

-- Procedure: Enroll Student in Course
CREATE PROCEDURE sp_EnrollStudent
    @StudentId NVARCHAR(50),
    @CourseId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if already enrolled
    IF EXISTS (SELECT 1 FROM Enrollments WHERE StudentId = @StudentId AND CourseId = @CourseId)
    BEGIN
        SELECT 'Already Enrolled' AS Result;
        RETURN;
    END
    
    -- Enroll student
    INSERT INTO Enrollments (Id, StudentId, CourseId, Progress, EnrolledAt)
    VALUES (NEWID(), @StudentId, @CourseId, 0, GETDATE());
    
    SELECT 'Enrolled Successfully' AS Result;
END;
GO

PRINT '  ✓ Created sp_EnrollStudent';
PRINT '';
GO

-- =============================================
-- Create Functions
-- =============================================

PRINT '=============================================';
PRINT 'Creating Functions...';
PRINT '=============================================';
PRINT '';
GO

-- Function: Get Student Average Score
CREATE FUNCTION fn_GetStudentAverageScore(@StudentId NVARCHAR(50))
RETURNS FLOAT
AS
BEGIN
    DECLARE @AvgScore FLOAT;
    
    SELECT @AvgScore = AVG(CAST(Score AS FLOAT) / NULLIF(MaxScore, 0) * 100)
    FROM AssessmentAttempts
    WHERE StudentId = @StudentId AND Status = 2;
    
    RETURN ISNULL(@AvgScore, 0);
END;
GO

PRINT '  ✓ Created fn_GetStudentAverageScore';
GO

-- Function: Get Course Completion Rate
CREATE FUNCTION fn_GetCourseCompletionRate(@CourseId NVARCHAR(50))
RETURNS FLOAT
AS
BEGIN
    DECLARE @CompletionRate FLOAT;
    
    SELECT @CompletionRate = AVG(CAST(Progress AS FLOAT))
    FROM Enrollments
    WHERE CourseId = @CourseId;
    
    RETURN ISNULL(@CompletionRate, 0);
END;
GO

PRINT '  ✓ Created fn_GetCourseCompletionRate';
PRINT '';
GO

-- =============================================
-- Insert Sample Data
-- =============================================

PRINT '=============================================';
PRINT 'Inserting Sample Data...';
PRINT '=============================================';
PRINT '';

-- Note: Password for all users is "password123"
-- BCrypt hash: $2a$11$XJLqF.PZw7hqQN.yPmYULeIu5gBKJ8RZ.ZQPvPBCKxwEU7.4K7s1W

-- Insert Users (2 Teachers + 3 Students)
INSERT INTO Users (Id, Username, PasswordHash, Name, Email, Role, CreatedAt) VALUES
('1', 'teacher1', '$2a$11$XJLqF.PZw7hqQN.yPmYULeIu5gBKJ8RZ.ZQPvPBCKxwEU7.4K7s1W', 'Mr. Nimali Perera', 'nimal.perera@eduportal.com', 1, '2024-01-15'),
('2', 'teacher2', '$2a$11$XJLqF.PZw7hqQN.yPmYULeIu5gBKJ8RZ.ZQPvPBCKxwEU7.4K7s1W', 'Prof. Michael Chen', 'michael.chen@eduportal.com', 1, '2024-01-16'),
('3', 'student1', '$2a$11$XJLqF.PZw7hqQN.yPmYULeIu5gBKJ8RZ.ZQPvPBCKxwEU7.4K7s1W', 'John Smith', 'john.smith@student.edu', 0, '2024-02-01'),
('4', 'student2', '$2a$11$XJLqF.PZw7hqQN.yPmYULeIu5gBKJ8RZ.ZQPvPBCKxwEU7.4K7s1W', 'Emma Johnson', 'emma.johnson@student.edu', 0, '2024-02-02'),
('5', 'student3', '$2a$11$XJLqF.PZw7hqQN.yPmYULeIu5gBKJ8RZ.ZQPvPBCKxwEU7.4K7s1W', 'Michael Brown', 'michael.brown@student.edu', 0, '2024-02-03');
PRINT '  ✓ Inserted 5 users (2 teachers, 3 students)';

-- Insert Courses
INSERT INTO Courses (Id, Name, Description, TeacherId, CreatedAt) VALUES
('1', 'Introduction to Programming', 'Learn the fundamentals of programming using Python', '1', '2024-02-10'),
('2', 'Web Development Basics', 'HTML, CSS, and JavaScript fundamentals', '1', '2024-02-12'),
('3', 'Mathematics for Computer Science', 'Discrete mathematics, logic, and algorithms', '2', '2024-02-15');
PRINT '  ✓ Inserted 3 courses';

-- Insert Enrollments
INSERT INTO Enrollments (Id, StudentId, CourseId, Progress, EnrolledAt) VALUES
('1', '3', '1', 60, '2024-02-20'),
('2', '3', '2', 30, '2024-02-21'),
('3', '4', '1', 80, '2024-02-20'),
('4', '4', '2', 50, '2024-02-22'),
('5', '4', '3', 20, '2024-02-23'),
('6', '5', '1', 40, '2024-02-21'),
('7', '5', '3', 70, '2024-02-24');
PRINT '  ✓ Inserted 7 enrollments';

-- Insert Assessments
INSERT INTO Assessments (Id, CourseId, Title, Description, DurationMinutes, IsPublished, DueDate, CreatedAt) VALUES
('1', '1', 'Python Basics Quiz', 'Test your knowledge of Python fundamentals', 30, 1, '2024-03-15', '2024-02-25'),
('2', '1', 'Control Structures Test', 'Assessment on loops and conditionals', 45, 1, '2024-03-20', '2024-02-26'),
('3', '1', 'Functions and Modules', 'Advanced Python concepts', 60, 0, '2024-03-25', '2024-02-27'),
('4', '2', 'HTML & CSS Fundamentals', 'Basic web design concepts', 40, 1, '2024-03-18', '2024-02-28'),
('5', '2', 'JavaScript Essentials', 'Core JavaScript knowledge test', 50, 1, '2024-03-22', '2024-03-01'),
('6', '3', 'Logic and Proofs', 'Mathematical reasoning assessment', 45, 1, '2024-03-17', '2024-03-02'),
('7', '3', 'Algorithm Analysis', 'Big O notation and complexity', 60, 1, '2024-03-24', '2024-03-03');
PRINT '  ✓ Inserted 7 assessments';

-- Insert Questions for Assessment 1 (Python Basics)
INSERT INTO Questions (Id, AssessmentId, [Text], [Type], Points, [Order]) VALUES
('1', '1', 'What is the output of print(type(5))?', 0, 5, 1),
('2', '1', 'Python is a compiled language.', 1, 5, 2),
('3', '1', 'Which keyword is used to create a function in Python?', 0, 5, 3);

-- Insert Options for Question 1
INSERT INTO QuestionOptions (Id, QuestionId, [Text], IsCorrect, [Order]) VALUES
('1', '1', '<class ''int''>', 1, 1),
('2', '1', '<class ''str''>', 0, 2),
('3', '1', '<class ''float''>', 0, 3),
('4', '1', 'integer', 0, 4);

-- Insert Options for Question 2 (True/False)
INSERT INTO QuestionOptions (Id, QuestionId, [Text], IsCorrect, [Order]) VALUES
('5', '2', 'True', 0, 1),
('6', '2', 'False', 1, 2);

-- Insert Options for Question 3
INSERT INTO QuestionOptions (Id, QuestionId, [Text], IsCorrect, [Order]) VALUES
('7', '3', 'def', 1, 1),
('8', '3', 'function', 0, 2),
('9', '3', 'func', 0, 3),
('10', '3', 'define', 0, 4);

-- Insert Questions for Assessment 4 (HTML & CSS)
INSERT INTO Questions (Id, AssessmentId, [Text], [Type], Points, [Order]) VALUES
('4', '4', 'Which HTML tag is used for the largest heading?', 0, 5, 1),
('5', '4', 'CSS stands for Cascading Style Sheets.', 1, 5, 2),
('6', '4', 'Which property is used to change the background color?', 0, 10, 3);

-- Insert Options for Question 4
INSERT INTO QuestionOptions (Id, QuestionId, [Text], IsCorrect, [Order]) VALUES
('11', '4', '<h1>', 1, 1),
('12', '4', '<h6>', 0, 2),
('13', '4', '<head>', 0, 3),
('14', '4', '<heading>', 0, 4);

-- Insert Options for Question 5
INSERT INTO QuestionOptions (Id, QuestionId, [Text], IsCorrect, [Order]) VALUES
('15', '5', 'True', 1, 1),
('16', '5', 'False', 0, 2);

-- Insert Options for Question 6
INSERT INTO QuestionOptions (Id, QuestionId, [Text], IsCorrect, [Order]) VALUES
('17', '6', 'background-color', 1, 1),
('18', '6', 'color', 0, 2),
('19', '6', 'bgcolor', 0, 3),
('20', '6', 'bg-color', 0, 4);

-- Insert Questions for Assessment 6 (Logic and Proofs)
INSERT INTO Questions (Id, AssessmentId, [Text], [Type], Points, [Order]) VALUES
('7', '6', 'What is the negation of "All birds can fly"?', 0, 10, 1),
('8', '6', 'A tautology is always true.', 1, 5, 2),
('9', '6', 'Write the contrapositive of: If P then Q', 2, 15, 3);

-- Insert Options for Question 7
INSERT INTO QuestionOptions (Id, QuestionId, [Text], IsCorrect, [Order]) VALUES
('21', '7', 'At least one bird cannot fly', 1, 1),
('22', '7', 'No birds can fly', 0, 2),
('23', '7', 'Some birds can fly', 0, 3),
('24', '7', 'All birds cannot fly', 0, 4);

-- Insert Options for Question 8
INSERT INTO QuestionOptions (Id, QuestionId, [Text], IsCorrect, [Order]) VALUES
('25', '8', 'True', 1, 1),
('26', '8', 'False', 0, 2);

-- Insert Questions for Assessment 7 (Algorithm Analysis)
INSERT INTO Questions (Id, AssessmentId, [Text], [Type], Points, [Order]) VALUES
('10', '7', 'What is the time complexity of binary search?', 0, 10, 1),
('11', '7', 'O(n²) is better than O(n log n).', 1, 5, 2),
('12', '7', 'Explain the Master Theorem for divide-and-conquer algorithms', 3, 20, 3);

-- Insert Options for Question 10
INSERT INTO QuestionOptions (Id, QuestionId, [Text], IsCorrect, [Order]) VALUES
('27', '10', 'O(log n)', 1, 1),
('28', '10', 'O(n)', 0, 2),
('29', '10', 'O(n²)', 0, 3),
('30', '10', 'O(1)', 0, 4);

-- Insert Options for Question 11
INSERT INTO QuestionOptions (Id, QuestionId, [Text], IsCorrect, [Order]) VALUES
('31', '11', 'True', 0, 1),
('32', '11', 'False', 1, 2);

PRINT '  ✓ Inserted 12 questions with 32 options';

-- Insert Assessment Attempts
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Score, MaxScore, [Status]) VALUES
('1', '1', '3', '2024-03-10 10:00:00', '2024-03-10 10:25:00', 15, 15, 2),
('2', '1', '4', '2024-03-10 14:00:00', '2024-03-10 14:20:00', 10, 15, 2),
('3', '4', '4', '2024-03-12 09:00:00', '2024-03-12 09:30:00', 10, 20, 2),
('4', '7', '5', '2024-03-14 15:00:00', '2024-03-14 15:40:00', 15, 35, 2);
PRINT '  ✓ Inserted 4 assessment attempts';

-- Insert Answers for Attempt 1 (Student 3 - Python Basics - Perfect Score)
INSERT INTO Answers (Id, AttemptId, QuestionId, SelectedOptionId, TextAnswer, PointsEarned, IsCorrect) VALUES
('1', '1', '1', '1', NULL, 5, 1),
('2', '1', '2', '6', NULL, 5, 1),
('3', '1', '3', '7', NULL, 5, 1);

-- Insert Answers for Attempt 2 (Student 4 - Python Basics - Partial Score)
INSERT INTO Answers (Id, AttemptId, QuestionId, SelectedOptionId, TextAnswer, PointsEarned, IsCorrect) VALUES
('4', '2', '1', '1', NULL, 5, 1),
('5', '2', '2', '5', NULL, 0, 0),
('6', '2', '3', '7', NULL, 5, 1);

-- Insert Answers for Attempt 3 (Student 4 - HTML & CSS)
INSERT INTO Answers (Id, AttemptId, QuestionId, SelectedOptionId, TextAnswer, PointsEarned, IsCorrect) VALUES
('7', '3', '4', '11', NULL, 5, 1),
('8', '3', '5', '15', NULL, 5, 1),
('9', '3', '6', '18', NULL, 0, 0);

-- Insert Answers for Attempt 4 (Student 5 - Algorithm Analysis)
INSERT INTO Answers (Id, AttemptId, QuestionId, SelectedOptionId, TextAnswer, PointsEarned, IsCorrect) VALUES
('10', '4', '10', '27', NULL, 10, 1),
('11', '4', '11', '32', NULL, 5, 1),
('12', '4', '12', NULL, 'The Master Theorem provides a way to analyze the time complexity...', 0, 0);

PRINT '  ✓ Inserted 12 answers';
PRINT '';

-- =============================================
-- Verify Creation
-- =============================================

PRINT '=============================================';
PRINT 'DATABASE CREATED SUCCESSFULLY!';
PRINT '=============================================';
PRINT '';

-- Show what was created
PRINT 'Database Summary:';
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
PRINT 'Data Summary:';
PRINT '--------------------------------------------';

SELECT 'Users' AS TableName, COUNT(*) AS Records FROM Users
UNION ALL
SELECT 'Courses', COUNT(*) FROM Courses
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM Enrollments
UNION ALL
SELECT 'Assessments', COUNT(*) FROM Assessments
UNION ALL
SELECT 'Questions', COUNT(*) FROM Questions
UNION ALL
SELECT 'QuestionOptions', COUNT(*) FROM QuestionOptions
UNION ALL
SELECT 'AssessmentAttempts', COUNT(*) FROM AssessmentAttempts
UNION ALL
SELECT 'Answers', COUNT(*) FROM Answers;

PRINT '';
PRINT 'Available Objects:';
PRINT '--------------------------------------------';
PRINT '  Views:';
PRINT '    - vw_StudentProgressSummary';
PRINT '    - vw_CourseEnrollmentDetails';
PRINT '    - vw_AssessmentStatistics';
PRINT '';
PRINT '  Stored Procedures:';
PRINT '    - sp_GetStudentDashboard';
PRINT '    - sp_GetTeacherDashboard';
PRINT '    - sp_EnrollStudent';
PRINT '';
PRINT '  Functions:';
PRINT '    - fn_GetStudentAverageScore';
PRINT '    - fn_GetCourseCompletionRate';
PRINT '';
PRINT 'Test Credentials:';
PRINT '--------------------------------------------';
PRINT '  Teacher: teacher1 / password123';
PRINT '  Teacher: teacher2 / password123';
PRINT '  Student: student1 / password123';
PRINT '  Student: student2 / password123';
PRINT '  Student: student3 / password123';
PRINT '';
PRINT '=============================================';
PRINT 'Ready to use! Run VerifyDatabase.sql to test.';
PRINT '=============================================';
PRINT '';
