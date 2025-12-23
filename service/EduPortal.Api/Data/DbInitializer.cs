using EduPortal.Api.Models;

namespace EduPortal.Api.Data;

public static class DbInitializer
{
    public static void Initialize(EduPortalDbContext context)
    {
        // Ensure database is created
        context.Database.EnsureCreated();

        // Check if already seeded
        if (context.Users.Any())
        {
            return;
        }

        // Seed Users
        var teacher1 = new User
        {
            Id = "1",
            Username = "teacher1",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            Name = "Mr. Nimali Perera",
            Email = "nimali.perera@university.edu",
            Role = UserRole.Teacher
        };

        var student1 = new User
        {
            Id = "2",
            Username = "student1",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            Name = "Alex Chen",
            Email = "alex.chen@student.edu",
            Role = UserRole.Student
        };

        var student2 = new User
        {
            Id = "3",
            Username = "student2",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            Name = "Emily Davis",
            Email = "emily.davis@student.edu",
            Role = UserRole.Student
        };

        var student3 = new User
        {
            Id = "4",
            Username = "student3",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            Name = "John Smith",
            Email = "john.smith@student.edu",
            Role = UserRole.Student
        };

        context.Users.AddRange(teacher1, student1, student2, student3);
        context.SaveChanges();

        // Seed Courses
        var course1 = new Course
        {
            Id = "1",
            Name = "Advanced Mathematics",
            Description = "Advanced calculus and linear algebra concepts",
            TeacherId = "1",
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };

        var course2 = new Course
        {
            Id = "2",
            Name = "Physics Fundamentals",
            Description = "Basic principles of physics and mechanics",
            TeacherId = "1",
            CreatedAt = DateTime.UtcNow.AddDays(-25)
        };

        var course3 = new Course
        {
            Id = "3",
            Name = "Chemistry Lab",
            Description = "Practical chemistry experiments and theory",
            TeacherId = "1",
            CreatedAt = DateTime.UtcNow.AddDays(-20)
        };

        context.Courses.AddRange(course1, course2, course3);
        context.SaveChanges();

        // Seed Enrollments
        var enrollment1 = new Enrollment
        {
            Id = "1",
            StudentId = "2",
            CourseId = "1",
            Progress = 75,
            EnrolledAt = DateTime.UtcNow.AddDays(-28)
        };

        var enrollment2 = new Enrollment
        {
            Id = "2",
            StudentId = "2",
            CourseId = "2",
            Progress = 60,
            EnrolledAt = DateTime.UtcNow.AddDays(-23)
        };

        var enrollment3 = new Enrollment
        {
            Id = "3",
            StudentId = "2",
            CourseId = "3",
            Progress = 90,
            EnrolledAt = DateTime.UtcNow.AddDays(-18)
        };

        var enrollment4 = new Enrollment
        {
            Id = "4",
            StudentId = "3",
            CourseId = "1",
            Progress = 45,
            EnrolledAt = DateTime.UtcNow.AddDays(-20)
        };

        var enrollment5 = new Enrollment
        {
            Id = "5",
            StudentId = "3",
            CourseId = "2",
            Progress = 30,
            EnrolledAt = DateTime.UtcNow.AddDays(-15)
        };

        context.Enrollments.AddRange(enrollment1, enrollment2, enrollment3, enrollment4, enrollment5);
        context.SaveChanges();

        // Seed Assessments
        var assessment1 = new Assessment
        {
            Id = "1",
            CourseId = "1",
            Title = "Calculus Quiz",
            Description = "Test your knowledge of calculus fundamentals",
            DurationMinutes = 30,
            DueDate = DateTime.UtcNow.AddDays(1),
            IsPublished = true,
            CreatedAt = DateTime.UtcNow.AddDays(-5)
        };

        var assessment2 = new Assessment
        {
            Id = "2",
            CourseId = "1",
            Title = "Algebra Test",
            Description = "Comprehensive algebra assessment",
            DurationMinutes = 45,
            DueDate = DateTime.UtcNow.AddDays(-2),
            IsPublished = true,
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };

        var assessment3 = new Assessment
        {
            Id = "3",
            CourseId = "2",
            Title = "Motion Problems",
            Description = "Physics motion and force problems",
            DurationMinutes = 40,
            DueDate = DateTime.UtcNow.AddDays(3),
            IsPublished = true,
            CreatedAt = DateTime.UtcNow.AddDays(-7)
        };

        context.Assessments.AddRange(assessment1, assessment2, assessment3);
        context.SaveChanges();

        // Seed Questions for Assessment 1
        var question1 = new Question
        {
            Id = "1",
            AssessmentId = "1",
            Text = "What is the derivative of x²?",
            Type = QuestionType.MultipleChoice,
            Points = 5,
            Order = 1
        };

        var question2 = new Question
        {
            Id = "2",
            AssessmentId = "1",
            Text = "Is the integral of 1/x equal to ln|x| + C?",
            Type = QuestionType.TrueFalse,
            Points = 5,
            Order = 2
        };

        context.Questions.AddRange(question1, question2);
        context.SaveChanges();

        // Seed Question Options
        var options = new[]
        {
            new QuestionOption { Id = "1", QuestionId = "1", Text = "2x", IsCorrect = true, Order = 1 },
            new QuestionOption { Id = "2", QuestionId = "1", Text = "x", IsCorrect = false, Order = 2 },
            new QuestionOption { Id = "3", QuestionId = "1", Text = "2x²", IsCorrect = false, Order = 3 },
            new QuestionOption { Id = "4", QuestionId = "1", Text = "x²/2", IsCorrect = false, Order = 4 },
            new QuestionOption { Id = "5", QuestionId = "2", Text = "True", IsCorrect = true, Order = 1 },
            new QuestionOption { Id = "6", QuestionId = "2", Text = "False", IsCorrect = false, Order = 2 }
        };

        context.QuestionOptions.AddRange(options);
        context.SaveChanges();

        // Seed Assessment Attempt
        var attempt1 = new AssessmentAttempt
        {
            Id = "1",
            AssessmentId = "2",
            StudentId = "2",
            StartedAt = DateTime.UtcNow.AddDays(-3),
            CompletedAt = DateTime.UtcNow.AddDays(-3).AddMinutes(35),
            Score = 92,
            MaxScore = 100,
            Status = AssessmentStatus.Graded
        };

        context.AssessmentAttempts.Add(attempt1);
        context.SaveChanges();
    }
}
