namespace EduPortal.Api.DTOs;

public class ProgressDto
{
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public int TotalCourses { get; set; }
    public int CompletedAssessments { get; set; }
    public int PendingAssessments { get; set; }
    public double AverageScore { get; set; }
    public List<CourseProgressDto> CourseProgress { get; set; } = new();
}

public class CourseProgressDto
{
    public string CourseId { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int Progress { get; set; }
    public int CompletedAssessments { get; set; }
    public int TotalAssessments { get; set; }
    public double? AverageScore { get; set; }
}

public class StudentDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
}
