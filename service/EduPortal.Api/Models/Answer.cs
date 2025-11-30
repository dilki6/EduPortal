namespace EduPortal.Api.Models;

public class Answer
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string AttemptId { get; set; } = string.Empty;
    public string QuestionId { get; set; } = string.Empty;
    public string? SelectedOptionId { get; set; }
    public string? TextAnswer { get; set; }
    public int? PointsEarned { get; set; }
    public bool IsCorrect { get; set; } = false;
    
    // Navigation properties
    public virtual AssessmentAttempt? Attempt { get; set; }
    public virtual Question? Question { get; set; }
}
