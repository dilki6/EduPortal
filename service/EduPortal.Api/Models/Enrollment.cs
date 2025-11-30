namespace EduPortal.Api.Models;

public class Enrollment
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string StudentId { get; set; } = string.Empty;
    public string CourseId { get; set; } = string.Empty;
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public int Progress { get; set; } = 0; // Progress percentage
    
    // Navigation properties
    public virtual User? Student { get; set; }
    public virtual Course? Course { get; set; }
}
