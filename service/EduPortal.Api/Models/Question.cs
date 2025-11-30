namespace EduPortal.Api.Models;

public class Question
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string AssessmentId { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public QuestionType Type { get; set; }
    public int Points { get; set; } = 1;
    public int Order { get; set; }
    
    // Navigation properties
    public virtual Assessment? Assessment { get; set; }
    public virtual ICollection<QuestionOption> Options { get; set; } = new List<QuestionOption>();
    public virtual ICollection<Answer> Answers { get; set; } = new List<Answer>();
}

public enum QuestionType
{
    MultipleChoice,
    TrueFalse,
    ShortAnswer,
    Essay
}
