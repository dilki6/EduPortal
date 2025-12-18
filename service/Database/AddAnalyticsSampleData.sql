-- =============================================
-- Add Sample Data for Teacher Analytics
-- This script adds realistic sample data including:
-- - Additional students
-- - Assessment attempts with varied scores
-- - Completed and in-progress attempts
-- - Data to demonstrate grade distribution
-- =============================================

-- First, let's ensure we have some students
-- Check if students exist, if not add them
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'alice.johnson@student.com')
BEGIN
    INSERT INTO Users (Id, Email, PasswordHash, Name, Role, CreatedAt)
    VALUES 
    (NEWID(), 'alice.johnson@student.com', 'hashed_password_1', 'Alice Johnson', 'Student', GETDATE()),
    (NEWID(), 'bob.smith@student.com', 'hashed_password_2', 'Bob Smith', 'Student', GETDATE()),
    (NEWID(), 'carol.white@student.com', 'hashed_password_3', 'Carol White', 'Student', GETDATE()),
    (NEWID(), 'david.brown@student.com', 'hashed_password_4', 'David Brown', 'Student', GETDATE()),
    (NEWID(), 'emma.davis@student.com', 'hashed_password_5', 'Emma Davis', 'Student', GETDATE()),
    (NEWID(), 'frank.wilson@student.com', 'hashed_password_6', 'Frank Wilson', 'Student', GETDATE()),
    (NEWID(), 'grace.taylor@student.com', 'hashed_password_7', 'Grace Taylor', 'Student', GETDATE()),
    (NEWID(), 'henry.anderson@student.com', 'hashed_password_8', 'Henry Anderson', 'Student', GETDATE()),
    (NEWID(), 'iris.thomas@student.com', 'hashed_password_9', 'Iris Thomas', 'Student', GETDATE()),
    (NEWID(), 'jack.martinez@student.com', 'hashed_password_10', 'Jack Martinez', 'Student', GETDATE());
END

-- Get a teacher ID (assuming one exists)
DECLARE @TeacherId NVARCHAR(450) = (SELECT TOP 1 Id FROM Users WHERE Role = 'Teacher');

-- If no teacher exists, create one
IF @TeacherId IS NULL
BEGIN
    SET @TeacherId = NEWID();
    INSERT INTO Users (Id, Email, PasswordHash, Name, Role, CreatedAt)
    VALUES (@TeacherId, 'teacher@example.com', 'hashed_password', 'Dr. Smith', 'Teacher', GETDATE());
END

-- Create sample courses if they don't exist
DECLARE @Course1Id NVARCHAR(450) = NEWID();
DECLARE @Course2Id NVARCHAR(450) = NEWID();

IF NOT EXISTS (SELECT 1 FROM Courses WHERE Name = 'Introduction to Computer Science')
BEGIN
    INSERT INTO Courses (Id, Name, Code, Description, TeacherId, CreatedAt)
    VALUES 
    (@Course1Id, 'Introduction to Computer Science', 'CS101', 'Fundamentals of programming and computer science concepts', @TeacherId, GETDATE()),
    (@Course2Id, 'Data Structures and Algorithms', 'CS201', 'Advanced data structures and algorithmic problem solving', @TeacherId, GETDATE());
END
ELSE
BEGIN
    SET @Course1Id = (SELECT TOP 1 Id FROM Courses WHERE Name = 'Introduction to Computer Science');
    SET @Course2Id = (SELECT TOP 1 Id FROM Courses WHERE TeacherId = @TeacherId AND Id != @Course1Id);
    IF @Course2Id IS NULL SET @Course2Id = @Course1Id;
END

-- Enroll students in courses
INSERT INTO Enrollments (Id, CourseId, StudentId, EnrolledAt, Status)
SELECT NEWID(), @Course1Id, Id, GETDATE(), 'Active'
FROM Users 
WHERE Role = 'Student' 
AND NOT EXISTS (SELECT 1 FROM Enrollments WHERE CourseId = @Course1Id AND StudentId = Users.Id);

-- Create assessments with various difficulty levels
DECLARE @Assessment1Id NVARCHAR(450) = NEWID();
DECLARE @Assessment2Id NVARCHAR(450) = NEWID();
DECLARE @Assessment3Id NVARCHAR(450) = NEWID();

-- Easy Assessment (Python Basics Quiz - 20 points)
INSERT INTO Assessments (Id, CourseId, Title, Description, DurationMinutes, DueDate, IsPublished, ResultsReleased, CreatedAt)
VALUES 
(@Assessment1Id, @Course1Id, 'Python Basics Quiz', 'Test your knowledge of Python fundamentals', 30, DATEADD(day, 7, GETDATE()), 1, 1, DATEADD(day, -10, GETDATE()));

-- Medium Assessment (Data Structures Midterm - 50 points)
INSERT INTO Assessments (Id, CourseId, Title, Description, DurationMinutes, DueDate, IsPublished, ResultsReleased, CreatedAt)
VALUES 
(@Assessment2Id, @Course1Id, 'Data Structures Midterm', 'Midterm exam covering arrays, lists, and trees', 60, DATEADD(day, 14, GETDATE()), 1, 1, DATEADD(day, -5, GETDATE()));

-- Hard Assessment (Algorithm Design Final - 100 points)
INSERT INTO Assessments (Id, CourseId, Title, Description, DurationMinutes, DueDate, IsPublished, ResultsReleased, CreatedAt)
VALUES 
(@Assessment3Id, @Course1Id, 'Algorithm Design Final', 'Comprehensive final exam on algorithm design and analysis', 90, DATEADD(day, 21, GETDATE()), 1, 0, DATEADD(day, -2, GETDATE()));

-- Add questions to Assessment 1 (Python Basics - 4 questions, 5 points each)
DECLARE @Q1Id NVARCHAR(450) = NEWID();
DECLARE @Q2Id NVARCHAR(450) = NEWID();
DECLARE @Q3Id NVARCHAR(450) = NEWID();
DECLARE @Q4Id NVARCHAR(450) = NEWID();

INSERT INTO Questions (Id, AssessmentId, Text, Type, Points, [Order], ExpectedAnswer)
VALUES 
(@Q1Id, @Assessment1Id, 'What is the output of print(2 ** 3)?', 'MultipleChoice', 5, 1, NULL),
(@Q2Id, @Assessment1Id, 'Which data type is mutable in Python?', 'MultipleChoice', 5, 2, NULL),
(@Q3Id, @Assessment1Id, 'Python is case-sensitive', 'TrueFalse', 5, 3, NULL),
(@Q4Id, @Assessment1Id, 'Explain the difference between a list and a tuple', 'ShortAnswer', 5, 4, 'Lists are mutable while tuples are immutable. Lists use square brackets [] while tuples use parentheses ().');

-- Add options for MCQ questions
INSERT INTO QuestionOptions (Id, QuestionId, Text, IsCorrect, [Order])
VALUES 
(NEWID(), @Q1Id, '6', 0, 1),
(NEWID(), @Q1Id, '8', 1, 2),
(NEWID(), @Q1Id, '9', 0, 3),
(NEWID(), @Q2Id, 'String', 0, 1),
(NEWID(), @Q2Id, 'List', 1, 2),
(NEWID(), @Q2Id, 'Tuple', 0, 3);

-- Add options for True/False
INSERT INTO QuestionOptions (Id, QuestionId, Text, IsCorrect, [Order])
VALUES 
(NEWID(), @Q3Id, 'True', 1, 1),
(NEWID(), @Q3Id, 'False', 0, 2);

-- Add questions to Assessment 2 (Data Structures - 5 questions, 10 points each)
DECLARE @Q5Id NVARCHAR(450) = NEWID();
DECLARE @Q6Id NVARCHAR(450) = NEWID();
DECLARE @Q7Id NVARCHAR(450) = NEWID();
DECLARE @Q8Id NVARCHAR(450) = NEWID();
DECLARE @Q9Id NVARCHAR(450) = NEWID();

INSERT INTO Questions (Id, AssessmentId, Text, Type, Points, [Order], ExpectedAnswer)
VALUES 
(@Q5Id, @Assessment2Id, 'What is the time complexity of binary search?', 'MultipleChoice', 10, 1, NULL),
(@Q6Id, @Assessment2Id, 'Describe the process of inserting a node in a binary search tree', 'Essay', 10, 2, 'Start at root. Compare value with current node. If less, go left; if greater, go right. Repeat until finding empty position. Insert new node there.'),
(@Q7Id, @Assessment2Id, 'A stack follows FIFO principle', 'TrueFalse', 10, 3, NULL),
(@Q8Id, @Assessment2Id, 'Explain the difference between a queue and a stack', 'ShortAnswer', 10, 4, 'A queue follows FIFO (First In First Out) while a stack follows LIFO (Last In First Out). Queues add at rear and remove from front, stacks add and remove from the same end.'),
(@Q9Id, @Assessment2Id, 'What is the main advantage of a linked list over an array?', 'MultipleChoice', 10, 5, NULL);

-- Add options
INSERT INTO QuestionOptions (Id, QuestionId, Text, IsCorrect, [Order])
VALUES 
(NEWID(), @Q5Id, 'O(n)', 0, 1),
(NEWID(), @Q5Id, 'O(log n)', 1, 2),
(NEWID(), @Q5Id, 'O(n^2)', 0, 3),
(NEWID(), @Q7Id, 'True', 0, 1),
(NEWID(), @Q7Id, 'False', 1, 2),
(NEWID(), @Q9Id, 'Faster access', 0, 1),
(NEWID(), @Q9Id, 'Dynamic size', 1, 2),
(NEWID(), @Q9Id, 'Less memory usage', 0, 3);

-- Add questions to Assessment 3 (Algorithm Design - 4 questions, 25 points each)
DECLARE @Q10Id NVARCHAR(450) = NEWID();
DECLARE @Q11Id NVARCHAR(450) = NEWID();
DECLARE @Q12Id NVARCHAR(450) = NEWID();
DECLARE @Q13Id NVARCHAR(450) = NEWID();

INSERT INTO Questions (Id, AssessmentId, Text, Type, Points, [Order], ExpectedAnswer)
VALUES 
(@Q10Id, @Assessment3Id, 'Explain the divide and conquer strategy with an example', 'Essay', 25, 1, 'Divide and conquer breaks a problem into smaller subproblems, solves them recursively, and combines solutions. Example: Merge sort divides array in half, sorts each half, then merges sorted halves.'),
(@Q11Id, @Assessment3Id, 'Which algorithm is used for finding shortest paths?', 'MultipleChoice', 25, 2, NULL),
(@Q12Id, @Assessment3Id, 'Describe dynamic programming and when to use it', 'Essay', 25, 3, 'Dynamic programming solves problems by breaking them into overlapping subproblems and storing solutions to avoid recomputation. Use when problem has optimal substructure and overlapping subproblems.'),
(@Q13Id, @Assessment3Id, 'What is the purpose of memoization?', 'ShortAnswer', 25, 4, 'Memoization stores results of expensive function calls and returns cached result when same inputs occur again, optimizing performance by avoiding redundant calculations.');

INSERT INTO QuestionOptions (Id, QuestionId, Text, IsCorrect, [Order])
VALUES 
(NEWID(), @Q11Id, 'Bubble Sort', 0, 1),
(NEWID(), @Q11Id, 'Dijkstra''s Algorithm', 1, 2),
(NEWID(), @Q11Id, 'Quick Sort', 0, 3);

-- Now create student attempts with varied scores to demonstrate analytics

-- Get student IDs
DECLARE @StudentIds TABLE (Id NVARCHAR(450), Name NVARCHAR(256), RowNum INT);
INSERT INTO @StudentIds
SELECT Id, Name, ROW_NUMBER() OVER (ORDER BY Name)
FROM Users WHERE Role = 'Student';

-- Assessment 1 Attempts (Easy - Python Basics - 20 points total)
-- Student 1: 20/20 (100% - A)
DECLARE @Attempt1Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt1Id, @Assessment1Id, Id, DATEADD(day, -8, GETDATE()), DATEADD(day, -8, DATEADD(minute, 15, GETDATE())), 'Completed', 20, 20
FROM @StudentIds WHERE RowNum = 1;

-- Student 2: 18/20 (90% - A)
DECLARE @Attempt2Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt2Id, @Assessment1Id, Id, DATEADD(day, -8, GETDATE()), DATEADD(day, -8, DATEADD(minute, 20, GETDATE())), 'Completed', 18, 20
FROM @StudentIds WHERE RowNum = 2;

-- Student 3: 17/20 (85% - B)
DECLARE @Attempt3Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt3Id, @Assessment1Id, Id, DATEADD(day, -7, GETDATE()), DATEADD(day, -7, DATEADD(minute, 18, GETDATE())), 'Completed', 17, 20
FROM @StudentIds WHERE RowNum = 3;

-- Student 4: 15/20 (75% - C)
DECLARE @Attempt4Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt4Id, @Assessment1Id, Id, DATEADD(day, -7, GETDATE()), DATEADD(day, -7, DATEADD(minute, 25, GETDATE())), 'Completed', 15, 20
FROM @StudentIds WHERE RowNum = 4;

-- Student 5: 14/20 (70% - C)
DECLARE @Attempt5Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt5Id, @Assessment1Id, Id, DATEADD(day, -6, GETDATE()), DATEADD(day, -6, DATEADD(minute, 22, GETDATE())), 'Completed', 14, 20
FROM @StudentIds WHERE RowNum = 5;

-- Student 6: 12/20 (60% - D)
DECLARE @Attempt6Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt6Id, @Assessment1Id, Id, DATEADD(day, -6, GETDATE()), DATEADD(day, -6, DATEADD(minute, 28, GETDATE())), 'Completed', 12, 20
FROM @StudentIds WHERE RowNum = 6;

-- Student 7: 10/20 (50% - F)
DECLARE @Attempt7Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt7Id, @Assessment1Id, Id, DATEADD(day, -5, GETDATE()), DATEADD(day, -5, DATEADD(minute, 30, GETDATE())), 'Completed', 10, 20
FROM @StudentIds WHERE RowNum = 7;

-- Student 8: In Progress
DECLARE @Attempt8Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt8Id, @Assessment1Id, Id, DATEADD(minute, -10, GETDATE()), NULL, 'InProgress', 0, 20
FROM @StudentIds WHERE RowNum = 8;

-- Assessment 2 Attempts (Medium - Data Structures - 50 points total)
-- Student 1: 48/50 (96% - A)
DECLARE @Attempt9Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt9Id, @Assessment2Id, Id, DATEADD(day, -3, GETDATE()), DATEADD(day, -3, DATEADD(minute, 45, GETDATE())), 'Completed', 48, 50
FROM @StudentIds WHERE RowNum = 1;

-- Student 2: 45/50 (90% - A)
DECLARE @Attempt10Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt10Id, @Assessment2Id, Id, DATEADD(day, -3, GETDATE()), DATEADD(day, -3, DATEADD(minute, 50, GETDATE())), 'Completed', 45, 50
FROM @StudentIds WHERE RowNum = 2;

-- Student 3: 42/50 (84% - B)
DECLARE @Attempt11Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt11Id, @Assessment2Id, Id, DATEADD(day, -2, GETDATE()), DATEADD(day, -2, DATEADD(minute, 55, GETDATE())), 'Completed', 42, 50
FROM @StudentIds WHERE RowNum = 3;

-- Student 4: 38/50 (76% - C)
DECLARE @Attempt12Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt12Id, @Assessment2Id, Id, DATEADD(day, -2, GETDATE()), DATEADD(day, -2, DATEADD(minute, 58, GETDATE())), 'Completed', 38, 50
FROM @StudentIds WHERE RowNum = 4;

-- Student 5: 32/50 (64% - D)
DECLARE @Attempt13Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt13Id, @Assessment2Id, Id, DATEADD(day, -1, GETDATE()), DATEADD(day, -1, DATEADD(hour, 1, GETDATE())), 'Completed', 32, 50
FROM @StudentIds WHERE RowNum = 5;

-- Student 6: 28/50 (56% - F)
DECLARE @Attempt14Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt14Id, @Assessment2Id, Id, DATEADD(day, -1, GETDATE()), DATEADD(day, -1, DATEADD(hour, 1, GETDATE())), 'Completed', 28, 50
FROM @StudentIds WHERE RowNum = 6;

-- Assessment 3 Attempts (Hard - Algorithm Design - 100 points total) - Results not released yet
-- Student 1: 92/100 (92% - A)
DECLARE @Attempt15Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt15Id, @Assessment3Id, Id, DATEADD(hour, -4, GETDATE()), DATEADD(hour, -2, DATEADD(minute, 30, GETDATE())), 'Completed', 92, 100
FROM @StudentIds WHERE RowNum = 1;

-- Student 2: 85/100 (85% - B)
DECLARE @Attempt16Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt16Id, @Assessment3Id, Id, DATEADD(hour, -3, GETDATE()), DATEADD(hour, -1, GETDATE()), 'Completed', 85, 100
FROM @StudentIds WHERE RowNum = 2;

-- Student 3: 78/100 (78% - C)
DECLARE @Attempt17Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt17Id, @Assessment3Id, Id, DATEADD(hour, -2, GETDATE()), DATEADD(minute, -30, GETDATE()), 'Completed', 78, 100
FROM @StudentIds WHERE RowNum = 3;

-- Student 4: In Progress
DECLARE @Attempt18Id NVARCHAR(450) = NEWID();
INSERT INTO AssessmentAttempts (Id, AssessmentId, StudentId, StartedAt, CompletedAt, Status, Score, MaxScore)
SELECT @Attempt18Id, @Assessment3Id, Id, DATEADD(minute, -45, GETDATE()), NULL, 'InProgress', 0, 100
FROM @StudentIds WHERE RowNum = 4;

PRINT 'Sample analytics data added successfully!';
PRINT 'Summary:';
PRINT '- Assessment 1 (Python Basics): 7 completed, 1 in progress (Grade distribution: 2 A, 1 B, 2 C, 1 D, 1 F)';
PRINT '- Assessment 2 (Data Structures): 6 completed (Grade distribution: 2 A, 1 B, 1 C, 1 D, 1 F)';
PRINT '- Assessment 3 (Algorithm Design): 3 completed, 1 in progress (Results not released yet)';
