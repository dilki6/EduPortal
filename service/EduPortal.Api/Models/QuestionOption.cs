namespace EduPortal.Api.Models;

public class QuestionOption
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string QuestionId { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; } = false;
    public int Order { get; set; }
    
    // Navigation property
    public virtual Question? Question { get; set; }
}
