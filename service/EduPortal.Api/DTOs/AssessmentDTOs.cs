namespace EduPortal.Api.DTOs;

public class AssessmentDto
{
    public string Id { get; set; } = string.Empty;
    public string CourseId { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsPublished { get; set; }
    public int QuestionCount { get; set; }
    public int TotalPoints { get; set; }
}

public class CreateAssessmentRequest
{
    public string CourseId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public DateTime? DueDate { get; set; }
    public List<CreateQuestionRequest> Questions { get; set; } = new();
}

public class CreateQuestionRequest
{
    public string Text { get; set; } = string.Empty;
    public string Type { get; set; } = "MultipleChoice";
    public int Points { get; set; } = 1;
    public string? ExpectedAnswer { get; set; }
    public List<CreateQuestionOptionRequest> Options { get; set; } = new();
}

public class CreateQuestionOptionRequest
{
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class QuestionDto
{
    public string Id { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Points { get; set; }
    public int Order { get; set; }
    public string? ExpectedAnswer { get; set; }
    public List<QuestionOptionDto> Options { get; set; } = new();
}

public class QuestionOptionDto
{
    public string Id { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int Order { get; set; }
}

public class AssessmentAttemptDto
{
    public string Id { get; set; } = string.Empty;
    public string AssessmentId { get; set; } = string.Empty;
    public string AssessmentTitle { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? Score { get; set; }
    public int? MaxScore { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class SubmitAnswerRequest
{
    public string QuestionId { get; set; } = string.Empty;
    public string? SelectedOptionId { get; set; }
    public string? TextAnswer { get; set; }
}

public class SubmitAssessmentRequest
{
    public List<SubmitAnswerRequest> Answers { get; set; } = new();
}

public class AnswerDto
{
    public string Id { get; set; } = string.Empty;
    public string QuestionId { get; set; } = string.Empty;
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public int QuestionPoints { get; set; }
    public List<QuestionOptionDto> QuestionOptions { get; set; } = new();
    public string? SelectedOptionId { get; set; }
    public string? SelectedOptionText { get; set; }
    public string? TextAnswer { get; set; }
    public int? PointsEarned { get; set; }
    public bool IsCorrect { get; set; }
    public string? CorrectOptionId { get; set; }
    public string? CorrectAnswer { get; set; }
    public string? ExpectedAnswer { get; set; }
}
