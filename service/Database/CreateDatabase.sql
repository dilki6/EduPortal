-- =============================================
-- EduPortal Database Creation Script
-- SQL Server 2019+
-- =============================================

USE master;
GO

-- Drop database if exists
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'EduPortalDb')
BEGIN
    ALTER DATABASE EduPortalDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE EduPortalDb;
END
GO

-- Create database
CREATE DATABASE EduPortalDb;
GO

USE EduPortalDb;
GO

-- =============================================
-- Create Tables
-- =============================================

-- Users Table
CREATE TABLE Users (
    Id NVARCHAR(50) PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Email NVARCHAR(200) NOT NULL UNIQUE,
    Role INT NOT NULL, -- 0 = Student, 1 = Teacher
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT CK_Users_Role CHECK (Role IN (0, 1))
);
GO

-- Create indexes on Users
CREATE INDEX IX_Users_Username ON Users(Username);
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_Role ON Users(Role);
GO

-- Courses Table
CREATE TABLE Courses (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(300) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    TeacherId NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Courses_Teachers FOREIGN KEY (TeacherId) 
        REFERENCES Users(Id) ON DELETE NO ACTION
);
GO

-- Create indexes on Courses
CREATE INDEX IX_Courses_TeacherId ON Courses(TeacherId);
CREATE INDEX IX_Courses_CreatedAt ON Courses(CreatedAt);
GO

-- Enrollments Table
CREATE TABLE Enrollments (
    Id NVARCHAR(50) PRIMARY KEY,
    StudentId NVARCHAR(50) NOT NULL,
    CourseId NVARCHAR(50) NOT NULL,
    Progress INT NOT NULL DEFAULT 0,
    EnrolledAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Enrollments_Students FOREIGN KEY (StudentId) 
        REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Enrollments_Courses FOREIGN KEY (CourseId) 
        REFERENCES Courses(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_Enrollments_StudentCourse UNIQUE (StudentId, CourseId),
    CONSTRAINT CK_Enrollments_Progress CHECK (Progress >= 0 AND Progress <= 100)
);
GO

-- Create indexes on Enrollments
CREATE INDEX IX_Enrollments_StudentId ON Enrollments(StudentId);
CREATE INDEX IX_Enrollments_CourseId ON Enrollments(CourseId);
GO

-- Assessments Table
CREATE TABLE Assessments (
    Id NVARCHAR(50) PRIMARY KEY,
    CourseId NVARCHAR(50) NOT NULL,
    Title NVARCHAR(300) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    DurationMinutes INT NOT NULL,
    DueDate DATETIME2 NULL,
    IsPublished BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Assessments_Courses FOREIGN KEY (CourseId) 
        REFERENCES Courses(Id) ON DELETE CASCADE,
    CONSTRAINT CK_Assessments_Duration CHECK (DurationMinutes > 0)
);
GO

-- Create indexes on Assessments
CREATE INDEX IX_Assessments_CourseId ON Assessments(CourseId);
CREATE INDEX IX_Assessments_IsPublished ON Assessments(IsPublished);
CREATE INDEX IX_Assessments_DueDate ON Assessments(DueDate);
GO

-- Questions Table
CREATE TABLE Questions (
    Id NVARCHAR(50) PRIMARY KEY,
    AssessmentId NVARCHAR(50) NOT NULL,
    Text NVARCHAR(MAX) NOT NULL,
    Type INT NOT NULL, -- 0 = MultipleChoice, 1 = TrueFalse, 2 = ShortAnswer, 3 = Essay
    Points INT NOT NULL DEFAULT 1,
    [Order] INT NOT NULL,
    CONSTRAINT FK_Questions_Assessments FOREIGN KEY (AssessmentId) 
        REFERENCES Assessments(Id) ON DELETE CASCADE,
    CONSTRAINT CK_Questions_Type CHECK (Type IN (0, 1, 2, 3)),
    CONSTRAINT CK_Questions_Points CHECK (Points > 0)
);
GO

-- Create indexes on Questions
CREATE INDEX IX_Questions_AssessmentId ON Questions(AssessmentId);
CREATE INDEX IX_Questions_Order ON Questions([Order]);
GO

-- QuestionOptions Table
CREATE TABLE QuestionOptions (
    Id NVARCHAR(50) PRIMARY KEY,
    QuestionId NVARCHAR(50) NOT NULL,
    Text NVARCHAR(MAX) NOT NULL,
    IsCorrect BIT NOT NULL DEFAULT 0,
    [Order] INT NOT NULL,
    CONSTRAINT FK_QuestionOptions_Questions FOREIGN KEY (QuestionId) 
        REFERENCES Questions(Id) ON DELETE CASCADE
);
GO

-- Create indexes on QuestionOptions
CREATE INDEX IX_QuestionOptions_QuestionId ON QuestionOptions(QuestionId);
CREATE INDEX IX_QuestionOptions_Order ON QuestionOptions([Order]);
GO

-- AssessmentAttempts Table
CREATE TABLE AssessmentAttempts (
    Id NVARCHAR(50) PRIMARY KEY,
    AssessmentId NVARCHAR(50) NOT NULL,
    StudentId NVARCHAR(50) NOT NULL,
    StartedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CompletedAt DATETIME2 NULL,
    Score INT NULL,
    MaxScore INT NULL,
    Status INT NOT NULL DEFAULT 0, -- 0 = InProgress, 1 = Completed, 2 = Graded
    CONSTRAINT FK_AssessmentAttempts_Assessments FOREIGN KEY (AssessmentId) 
        REFERENCES Assessments(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_AssessmentAttempts_Students FOREIGN KEY (StudentId) 
        REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT CK_AssessmentAttempts_Status CHECK (Status IN (0, 1, 2))
);
GO

-- Create indexes on AssessmentAttempts
CREATE INDEX IX_AssessmentAttempts_AssessmentId ON AssessmentAttempts(AssessmentId);
CREATE INDEX IX_AssessmentAttempts_StudentId ON AssessmentAttempts(StudentId);
CREATE INDEX IX_AssessmentAttempts_Status ON AssessmentAttempts(Status);
CREATE INDEX IX_AssessmentAttempts_StartedAt ON AssessmentAttempts(StartedAt);
GO

-- Answers Table
CREATE TABLE Answers (
    Id NVARCHAR(50) PRIMARY KEY,
    AttemptId NVARCHAR(50) NOT NULL,
    QuestionId NVARCHAR(50) NOT NULL,
    SelectedOptionId NVARCHAR(50) NULL,
    TextAnswer NVARCHAR(MAX) NULL,
    PointsEarned INT NULL,
    IsCorrect BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_Answers_Attempts FOREIGN KEY (AttemptId) 
        REFERENCES AssessmentAttempts(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Answers_Questions FOREIGN KEY (QuestionId) 
        REFERENCES Questions(Id) ON DELETE NO ACTION
);
GO

-- Create indexes on Answers
CREATE INDEX IX_Answers_AttemptId ON Answers(AttemptId);
CREATE INDEX IX_Answers_QuestionId ON Answers(QuestionId);
GO

-- =============================================
-- Insert Sample Data
-- =============================================

PRINT 'Inserting Users...';

-- Insert Users (passwords are BCrypt hashed "password123")
INSERT INTO Users (Id, Username, PasswordHash, Name, Email, Role, CreatedAt) VALUES
('1', 'teacher1', '$2a$11$xH.VQhzGJXMRJvZ8Yg0dBOXKGvdN8ZQMFJQGPm1qYqJ0zXJqxqxqy', 'Dr. Sarah Johnson', 'sarah.johnson@university.edu', 1, DATEADD(DAY, -30, GETUTCDATE())),
('2', 'student1', '$2a$11$xH.VQhzGJXMRJvZ8Yg0dBOXKGvdN8ZQMFJQGPm1qYqJ0zXJqxqxqy', 'Alex Chen', 'alex.chen@student.edu', 0, DATEADD(DAY, -28, GETUTCDATE())),
('3', 'student2', '$2a$11$xH.VQhzGJXMRJvZ8Yg0dBOXKGvdN8ZQMFJQGPm1qYqJ0zXJqxqxqy', 'Emily Davis', 'emily.davis@student.edu', 0, DATEADD(DAY, -28, GETUTCDATE())),
('4', 'student3', '$2a$11$xH.VQhzGJXMRJvZ8Yg0dBOXKGvdN8ZQMFJQGPm1qYqJ0zXJqxqxqy', 'John Smith', 'john.smith@student.edu', 0, DATEADD(DAY, -25, GETUTCDATE())),
('5', 'student4', '$2a$11$xH.VQhzGJXMRJvZ8Yg0dBOXKGvdN8ZQMFJQGPm1qYqJ0zXJqxqxqy', 'Sarah Wilson', 'sarah.wilson@student.edu', 0, DATEADD(DAY, -25, GETUTCDATE()));
GO

PRINT 'Inserting Courses...';

-- Insert Courses
INSERT INTO Courses (Id, Name, Description, TeacherId, CreatedAt) VALUES
('1', 'Advanced Mathematics', 'Advanced calculus and linear algebra concepts', '1', DATEADD(DAY, -30, GETUTCDATE())),
('2', 'Physics Fundamentals', 'Basic principles of physics and mechanics', '1', DATEADD(DAY, -25, GETUTCDATE())),
('3', 'Chemistry Lab', 'Practical chemistry experiments and theory', '1', DATEADD(DAY, -20, GETUTCDATE()));
GO

PRINT 'Inserting Enrollments...';

-- Insert Enrollments
INSERT INTO Enrollments (Id, StudentId, CourseId, Progress, EnrolledAt) VALUES
('1', '2', '1', 75, DATEADD(DAY, -28, GETUTCDATE())),
('2', '2', '2', 60, DATEADD(DAY, -23, GETUTCDATE())),
('3', '2', '3', 90, DATEADD(DAY, -18, GETUTCDATE())),
('4', '3', '1', 45, DATEADD(DAY, -20, GETUTCDATE())),
('5', '3', '2', 30, DATEADD(DAY, -15, GETUTCDATE())),
('6', '4', '1', 80, DATEADD(DAY, -22, GETUTCDATE())),
('7', '5', '2', 55, DATEADD(DAY, -18, GETUTCDATE()));
GO

PRINT 'Inserting Assessments...';

-- Insert Assessments
INSERT INTO Assessments (Id, CourseId, Title, Description, DurationMinutes, DueDate, IsPublished, CreatedAt) VALUES
('1', '1', 'Calculus Quiz', 'Test your knowledge of calculus fundamentals', 30, DATEADD(DAY, 1, GETUTCDATE()), 1, DATEADD(DAY, -5, GETUTCDATE())),
('2', '1', 'Algebra Test', 'Comprehensive algebra assessment', 45, DATEADD(DAY, -2, GETUTCDATE()), 1, DATEADD(DAY, -10, GETUTCDATE())),
('3', '1', 'Geometry Assignment', 'Geometry problems and proofs', 40, DATEADD(DAY, 7, GETUTCDATE()), 1, DATEADD(DAY, -8, GETUTCDATE())),
('4', '2', 'Motion Problems', 'Physics motion and force problems', 40, DATEADD(DAY, 3, GETUTCDATE()), 1, DATEADD(DAY, -7, GETUTCDATE())),
('5', '2', 'Mechanics Quiz', 'Basic mechanics concepts', 30, DATEADD(DAY, -5, GETUTCDATE()), 1, DATEADD(DAY, -12, GETUTCDATE())),
('6', '3', 'Periodic Table Test', 'Elements and periodic trends', 35, DATEADD(DAY, 5, GETUTCDATE()), 1, DATEADD(DAY, -6, GETUTCDATE())),
('7', '3', 'Organic Chemistry Test', 'Organic chemistry fundamentals', 50, DATEADD(DAY, 10, GETUTCDATE()), 1, DATEADD(DAY, -4, GETUTCDATE()));
GO

PRINT 'Inserting Questions...';

-- Insert Questions for Assessment 1 (Calculus Quiz)
INSERT INTO Questions (Id, AssessmentId, Text, Type, Points, [Order]) VALUES
('1', '1', 'What is the derivative of x²?', 0, 5, 1),
('2', '1', 'Is the integral of 1/x equal to ln|x| + C?', 1, 5, 2),
('3', '1', 'What is the limit of (x² - 1)/(x - 1) as x approaches 1?', 0, 5, 3),
('4', '1', 'Explain the fundamental theorem of calculus.', 3, 10, 4);

-- Insert Questions for Assessment 2 (Algebra Test)
INSERT INTO Questions (Id, AssessmentId, Text, Type, Points, [Order]) VALUES
('5', '2', 'Solve: 2x + 5 = 15', 0, 5, 1),
('6', '2', 'Is (a + b)² = a² + b²?', 1, 5, 2),
('7', '2', 'Factor: x² - 5x + 6', 2, 10, 3),
('8', '2', 'What is the quadratic formula?', 0, 10, 4);

-- Insert Questions for Assessment 4 (Motion Problems)
INSERT INTO Questions (Id, AssessmentId, Text, Type, Points, [Order]) VALUES
('9', '4', 'What is Newton''s First Law of Motion?', 0, 5, 1),
('10', '4', 'Is acceleration the rate of change of velocity?', 1, 5, 2),
('11', '4', 'Calculate the velocity: distance = 100m, time = 5s', 2, 10, 3);

-- Insert Questions for Assessment 5 (Mechanics Quiz)
INSERT INTO Questions (Id, AssessmentId, Text, Type, Points, [Order]) VALUES
('12', '5', 'What is the unit of force in SI?', 0, 5, 1),
('13', '5', 'Does mass affect the rate of free fall?', 1, 5, 2);
GO

PRINT 'Inserting Question Options...';

-- Options for Question 1
INSERT INTO QuestionOptions (Id, QuestionId, Text, IsCorrect, [Order]) VALUES
('1', '1', '2x', 1, 1),
('2', '1', 'x', 0, 2),
('3', '1', '2x²', 0, 3),
('4', '1', 'x²/2', 0, 4);

-- Options for Question 2
INSERT INTO QuestionOptions (Id, QuestionId, Text, IsCorrect, [Order]) VALUES
('5', '2', 'True', 1, 1),
('6', '2', 'False', 0, 2);

-- Options for Question 3
INSERT INTO QuestionOptions (Id, QuestionId, Text, IsCorrect, [Order]) VALUES
('7', '3', '0', 0, 1),
('8', '3', '1', 0, 2),
('9', '3', '2', 1, 3),
('10', '3', 'Undefined', 0, 4);

-- Options for Question 5
INSERT INTO QuestionOptions (Id, QuestionId, Text, IsCorrect, [Order]) VALUES
('11', '5', 'x = 5', 1, 1),
('12', '5', 'x = 10', 0, 2),
('13', '5', 'x = 7.5', 0, 3),
('14', '5', 'x = 15', 0, 4);

-- Options for Question 6
INSERT INTO QuestionOptions (Id, QuestionId, Text, IsCorrect, [Order]) VALUES
('15', '6', 'True', 0, 1),
('16', '6', 'False', 1, 2);

-- Options for Question 8
INSERT INTO QuestionOptions (Id, QuestionId, Text, IsCorrect, [Order]) VALUES
('17', '8', 'x = (-b ± √(b² - 4ac)) / 2a', 1, 1),
('18', '8', 'x = -b / 2a', 0, 2),
('19', '8', 'x = b² - 4ac', 0, 3),
('20', '8', 'x = a + b + c', 0, 4);

-- Options for Question 9
INSERT INTO QuestionOptions (Id, QuestionId, Text, IsCorrect, [Order]) VALUES
('21', '9', 'An object at rest stays at rest unless acted upon by a force', 1, 1),
('22', '9', 'F = ma', 0, 2),
('23', '9', 'For every action there is an equal and opposite reaction', 0, 3),
('24', '9', 'Energy is conserved', 0, 4);

-- Options for Question 10
INSERT INTO QuestionOptions (Id, QuestionId, Text, IsCorrect, [Order]) VALUES
('25', '10', 'True', 1, 1),
('26', '10', 'False', 0, 2);

-- Options for Question 12
INSERT INTO QuestionOptions (Id, QuestionId, Text, IsCorrect, [Order]) VALUES
('27', '12', 'Newton (N)', 1, 1),
('28', '12', 'Joule (J)', 0, 2),
('29', '12', 'Watt (W)', 0, 3),
('30', '12', 'Pascal (Pa)', 0, 4);

-- Options for Question 13
INSERT INTO QuestionOptions (Id, QuestionId, Text, IsCorrect, [Order]) VALUES
('31', '13', 'True', 0, 1),
('32', '13', 'False', 1, 2);
GO

PRINT 'Inserting Assessment Attempts...';

-- Insert Assessment Attempts
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Score, MaxScore, Status) VALUES
('1', '2', '2', DATEADD(DAY, -3, GETUTCDATE()), DATEADD(MINUTE, -4325, GETUTCDATE()), 92, 100, 2),
('2', '5', '2', DATEADD(DAY, -6, GETUTCDATE()), DATEADD(MINUTE, -8610, GETUTCDATE()), 78, 100, 2),
('3', '2', '3', DATEADD(DAY, -4, GETUTCDATE()), DATEADD(MINUTE, -5720, GETUTCDATE()), 65, 100, 2),
('4', '5', '4', DATEADD(DAY, -7, GETUTCDATE()), DATEADD(MINUTE, -10000, GETUTCDATE()), 85, 100, 2);
GO

PRINT 'Inserting Answers...';

-- Insert Answers for Attempt 1 (Student 2 - Algebra Test)
INSERT INTO Answers (Id, AttemptId, QuestionId, SelectedOptionId, TextAnswer, PointsEarned, IsCorrect) VALUES
('1', '1', '5', '11', NULL, 5, 1),
('2', '1', '6', '16', NULL, 5, 1),
('3', '1', '7', NULL, '(x-2)(x-3)', 10, 1),
('4', '1', '8', '17', NULL, 10, 1);

-- Insert Answers for Attempt 2 (Student 2 - Mechanics Quiz)
INSERT INTO Answers (Id, AttemptId, QuestionId, SelectedOptionId, TextAnswer, PointsEarned, IsCorrect) VALUES
('5', '2', '12', '27', NULL, 5, 1),
('6', '2', '13', '32', NULL, 5, 1);

-- Insert Answers for Attempt 3 (Student 3 - Algebra Test)
INSERT INTO Answers (Id, AttemptId, QuestionId, SelectedOptionId, TextAnswer, PointsEarned, IsCorrect) VALUES
('7', '3', '5', '11', NULL, 5, 1),
('8', '3', '6', '15', NULL, 0, 0),
('9', '3', '7', NULL, 'x(x-5)', 5, 0),
('10', '3', '8', '17', NULL, 10, 1);

-- Insert Answers for Attempt 4 (Student 4 - Mechanics Quiz)
INSERT INTO Answers (Id, AttemptId, QuestionId, SelectedOptionId, TextAnswer, PointsEarned, IsCorrect) VALUES
('11', '4', '12', '27', NULL, 5, 1),
('12', '4', '13', '32', NULL, 5, 1);
GO

-- =============================================
-- Create Views for Reporting
-- =============================================

PRINT 'Creating Views...';

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

-- =============================================
-- Create Stored Procedures
-- =============================================

PRINT 'Creating Stored Procedures...';

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

-- Procedure: Enroll Student in Course
CREATE PROCEDURE sp_EnrollStudent
    @StudentId NVARCHAR(50),
    @CourseId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NOT EXISTS (SELECT 1 FROM Enrollments WHERE StudentId = @StudentId AND CourseId = @CourseId)
    BEGIN
        INSERT INTO Enrollments (Id, StudentId, CourseId, Progress)
        VALUES (NEWID(), @StudentId, @CourseId, 0);
        
        SELECT 1 AS Success, 'Student enrolled successfully' AS Message;
    END
    ELSE
    BEGIN
        SELECT 0 AS Success, 'Student already enrolled' AS Message;
    END
END;
GO

-- =============================================
-- Create Functions
-- =============================================

PRINT 'Creating Functions...';

-- Function: Calculate Student Average Score
CREATE FUNCTION fn_GetStudentAverageScore(@StudentId NVARCHAR(50))
RETURNS DECIMAL(5,2)
AS
BEGIN
    DECLARE @AverageScore DECIMAL(5,2);
    
    SELECT @AverageScore = AVG(CAST(Score AS FLOAT) / NULLIF(MaxScore, 0) * 100)
    FROM AssessmentAttempts
    WHERE StudentId = @StudentId AND Status = 2;
    
    RETURN ISNULL(@AverageScore, 0);
END;
GO

-- Function: Get Course Completion Rate
CREATE FUNCTION fn_GetCourseCompletionRate(@CourseId NVARCHAR(50))
RETURNS DECIMAL(5,2)
AS
BEGIN
    DECLARE @CompletionRate DECIMAL(5,2);
    
    SELECT @CompletionRate = AVG(CAST(Progress AS FLOAT))
    FROM Enrollments
    WHERE CourseId = @CourseId;
    
    RETURN ISNULL(@CompletionRate, 0);
END;
GO

-- =============================================
-- Grant Permissions
-- =============================================

PRINT 'Setting up permissions...';

-- Create application user (optional - for production)
-- CREATE LOGIN eduportal_app WITH PASSWORD = 'YourSecurePassword123!';
-- CREATE USER eduportal_app FOR LOGIN eduportal_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO eduportal_app;
-- GRANT EXECUTE ON SCHEMA::dbo TO eduportal_app;

-- =============================================
-- Summary Report
-- =============================================

PRINT '';
PRINT '=============================================';
PRINT 'Database Creation Complete!';
PRINT '=============================================';
PRINT '';
PRINT 'Database: EduPortalDb';
PRINT '';
PRINT 'Tables Created:';
PRINT '  - Users (5 records)';
PRINT '  - Courses (3 records)';
PRINT '  - Enrollments (7 records)';
PRINT '  - Assessments (7 records)';
PRINT '  - Questions (13 records)';
PRINT '  - QuestionOptions (32 records)';
PRINT '  - AssessmentAttempts (4 records)';
PRINT '  - Answers (12 records)';
PRINT '';
PRINT 'Views Created:';
PRINT '  - vw_StudentProgressSummary';
PRINT '  - vw_CourseEnrollmentDetails';
PRINT '  - vw_AssessmentStatistics';
PRINT '';
PRINT 'Stored Procedures Created:';
PRINT '  - sp_GetStudentDashboard';
PRINT '  - sp_GetTeacherDashboard';
PRINT '  - sp_EnrollStudent';
PRINT '';
PRINT 'Functions Created:';
PRINT '  - fn_GetStudentAverageScore';
PRINT '  - fn_GetCourseCompletionRate';
PRINT '';
PRINT 'Default Login Credentials:';
PRINT '  Teacher: username=teacher1, password=password123';
PRINT '  Student: username=student1, password=password123';
PRINT '';
PRINT '=============================================';

-- Display sample queries
PRINT '';
PRINT 'Sample Queries:';
PRINT '';
PRINT '-- View all users:';
PRINT 'SELECT * FROM Users;';
PRINT '';
PRINT '-- View student progress:';
PRINT 'SELECT * FROM vw_StudentProgressSummary;';
PRINT '';
PRINT '-- Get student dashboard:';
PRINT 'EXEC sp_GetStudentDashboard @StudentId = ''2'';';
PRINT '';
PRINT '-- Get teacher dashboard:';
PRINT 'EXEC sp_GetTeacherDashboard @TeacherId = ''1'';';
PRINT '';

GO
