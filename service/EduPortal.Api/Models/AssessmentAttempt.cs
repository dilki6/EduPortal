namespace EduPortal.Api.Models;

public class AssessmentAttempt
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string AssessmentId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public int? Score { get; set; }
    public int? MaxScore { get; set; }
    public AssessmentStatus Status { get; set; } = AssessmentStatus.InProgress;
    
    // Navigation properties
    public virtual Assessment? Assessment { get; set; }
    public virtual User? Student { get; set; }
    public virtual ICollection<Answer> Answers { get; set; } = new List<Answer>();
}

public enum AssessmentStatus
{
    InProgress,
    Completed,
    Graded
}
