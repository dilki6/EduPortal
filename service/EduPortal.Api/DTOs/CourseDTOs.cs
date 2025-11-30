namespace EduPortal.Api.DTOs;

public class CourseDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TeacherId { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int EnrolledStudentsCount { get; set; }
    public List<string> EnrolledStudentIds { get; set; } = new();
}

public class CreateCourseRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class UpdateCourseRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class EnrollmentDto
{
    public string Id { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string CourseId { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public DateTime EnrolledAt { get; set; }
    public int Progress { get; set; }
}

public class EnrollStudentRequest
{
    public string StudentId { get; set; } = string.Empty;
    public string CourseId { get; set; } = string.Empty;
}

public class UpdateProgressRequest
{
    public int Progress { get; set; }
}
