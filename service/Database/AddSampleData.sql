-- =============================================
-- Sample Data Expansion Script
-- Add more users, courses, and assessments
-- =============================================

USE EduPortalDb;
GO

PRINT 'Adding additional sample data...';

-- Add more teachers
INSERT INTO Users (Id, Username, PasswordHash, Name, Email, Role, CreatedAt) VALUES
('6', 'teacher2', '$2a$11$xH.VQhzGJXMRJvZ8Yg0dBOXKGvdN8ZQMFJQGPm1qYqJ0zXJqxqxqy', 'Prof. Michael Brown', 'michael.brown@university.edu', 1, GETUTCDATE()),
('7', 'teacher3', '$2a$11$xH.VQhzGJXMRJvZ8Yg0dBOXKGvdN8ZQMFJQGPm1qYqJ0zXJqxqxqy', 'Dr. Lisa Martinez', 'lisa.martinez@university.edu', 1, GETUTCDATE());

-- Add more students
INSERT INTO Users (Id, Username, PasswordHash, Name, Email, Role, CreatedAt) VALUES
('8', 'student5', '$2a$11$xH.VQhzGJXMRJvZ8Yg0dBOXKGvdN8ZQMFJQGPm1qYqJ0zXJqxqxqy', 'David Lee', 'david.lee@student.edu', 0, GETUTCDATE()),
('9', 'student6', '$2a$11$xH.VQhzGJXMRJvZ8Yg0dBOXKGvdN8ZQMFJQGPm1qYqJ0zXJqxqxqy', 'Maria Garcia', 'maria.garcia@student.edu', 0, GETUTCDATE()),
('10', 'student7', '$2a$11$xH.VQhzGJXMRJvZ8Yg0dBOXKGvdN8ZQMFJQGPm1qYqJ0zXJqxqxqy', 'James Wilson', 'james.wilson@student.edu', 0, GETUTCDATE());

-- Add more courses
INSERT INTO Courses (Id, Name, Description, TeacherId, CreatedAt) VALUES
('4', 'Introduction to Programming', 'Learn the basics of programming with Python', '6', GETUTCDATE()),
('5', 'Web Development', 'Build modern web applications', '6', GETUTCDATE()),
('6', 'Data Science Fundamentals', 'Introduction to data analysis and machine learning', '7', GETUTCDATE());

-- Add more enrollments
INSERT INTO Enrollments (Id, StudentId, CourseId, Progress, EnrolledAt) VALUES
(NEWID(), '8', '1', 25, GETUTCDATE()),
(NEWID(), '8', '4', 40, GETUTCDATE()),
(NEWID(), '9', '4', 60, GETUTCDATE()),
(NEWID(), '9', '5', 35, GETUTCDATE()),
(NEWID(), '10', '5', 50, GETUTCDATE()),
(NEWID(), '10', '6', 70, GETUTCDATE());

PRINT 'Additional sample data added successfully!';
PRINT '';
PRINT 'New Users Added:';
PRINT '  - teacher2 (Prof. Michael Brown)';
PRINT '  - teacher3 (Dr. Lisa Martinez)';
PRINT '  - student5 (David Lee)';
PRINT '  - student6 (Maria Garcia)';
PRINT '  - student7 (James Wilson)';
PRINT '';
PRINT 'New Courses Added:';
PRINT '  - Introduction to Programming';
PRINT '  - Web Development';
PRINT '  - Data Science Fundamentals';
PRINT '';

GO
