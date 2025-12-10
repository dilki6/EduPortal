using EduPortal.Api.Data;
using EduPortal.Api.DTOs;
using EduPortal.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EduPortal.Api.Services;

public class AssessmentService : IAssessmentService
{
    private readonly EduPortalDbContext _context;

    public AssessmentService(EduPortalDbContext context)
    {
        _context = context;
    }

    public async Task<List<AssessmentDto>> GetCourseAssessmentsAsync(string courseId) =>
        (await _context.Assessments.Include(a => a.Course).Include(a => a.Questions)
            .Where(a => a.CourseId == courseId).ToListAsync())
        .Select(MapToAssessmentDto).ToList();

    public async Task<List<AssessmentDto>> GetTeacherAssessmentsAsync(string teacherId) =>
        (await _context.Assessments
            .Include(a => a.Course)
            .Include(a => a.Questions)
            .Where(a => a.Course!.TeacherId == teacherId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync())
        .Select(MapToAssessmentDto).ToList();

    public async Task<AssessmentDto?> GetAssessmentByIdAsync(string assessmentId)
    {
        var assessment = await _context.Assessments.Include(a => a.Course).Include(a => a.Questions)
            .FirstOrDefaultAsync(a => a.Id == assessmentId);
        return assessment == null ? null : MapToAssessmentDto(assessment);
    }

    public async Task<List<QuestionDto>> GetAssessmentQuestionsAsync(string assessmentId, bool includeAnswers = false) =>
        (await _context.Questions.Include(q => q.Options).Where(q => q.AssessmentId == assessmentId)
            .OrderBy(q => q.Order).ToListAsync())
        .Select(q => new QuestionDto
        {
            Id = q.Id,
            Text = q.Text,
            Type = q.Type.ToString(),
            Points = q.Points,
            Order = q.Order,
            ExpectedAnswer = includeAnswers ? q.ExpectedAnswer : null,
            Options = q.Options.OrderBy(o => o.Order).Select(o => new QuestionOptionDto
            {
                Id = o.Id,
                Text = o.Text,
                IsCorrect = includeAnswers && o.IsCorrect,
                Order = o.Order
            }).ToList()
        }).ToList();

    public async Task<AssessmentDto?> CreateAssessmentAsync(CreateAssessmentRequest request)
    {
        var assessment = new Assessment
        {
            CourseId = request.CourseId,
            Title = request.Title,
            Description = request.Description,
            DurationMinutes = request.DurationMinutes,
            DueDate = request.DueDate
        };

        _context.Assessments.Add(assessment);
        await _context.SaveChangesAsync();

        // Add questions
        for (int i = 0; i < request.Questions.Count; i++)
        {
            var questionRequest = request.Questions[i];
            var question = new Question
            {
                AssessmentId = assessment.Id,
                Text = questionRequest.Text,
                Type = Enum.Parse<QuestionType>(questionRequest.Type),
                Points = questionRequest.Points,
                Order = i + 1,
                ExpectedAnswer = questionRequest.ExpectedAnswer
            };

            _context.Questions.Add(question);
            await _context.SaveChangesAsync();

            // Add options
            for (int j = 0; j < questionRequest.Options.Count; j++)
            {
                var optionRequest = questionRequest.Options[j];
                var option = new QuestionOption
                {
                    QuestionId = question.Id,
                    Text = optionRequest.Text,
                    IsCorrect = optionRequest.IsCorrect,
                    Order = j + 1
                };

                _context.QuestionOptions.Add(option);
            }

            await _context.SaveChangesAsync();
        }

        return await GetAssessmentByIdAsync(assessment.Id);
    }

    public async Task<QuestionDto?> AddQuestionToAssessmentAsync(string assessmentId, CreateQuestionRequest request)
    {
        var assessment = await _context.Assessments.Include(a => a.Questions)
            .FirstOrDefaultAsync(a => a.Id == assessmentId);
        
        if (assessment == null) return null;

        // Get the next order number
        var maxOrder = assessment.Questions.Any() ? assessment.Questions.Max(q => q.Order) : 0;

        var question = new Question
        {
            AssessmentId = assessmentId,
            Text = request.Text,
            Type = Enum.Parse<QuestionType>(request.Type),
            Points = request.Points,
            Order = maxOrder + 1,
            ExpectedAnswer = request.ExpectedAnswer
        };

        _context.Questions.Add(question);
        await _context.SaveChangesAsync();

        // Add options
        for (int i = 0; i < request.Options.Count; i++)
        {
            var optionRequest = request.Options[i];
            var option = new QuestionOption
            {
                QuestionId = question.Id,
                Text = optionRequest.Text,
                IsCorrect = optionRequest.IsCorrect,
                Order = i + 1
            };

            _context.QuestionOptions.Add(option);
        }

        await _context.SaveChangesAsync();

        // Return the created question
        var createdQuestion = await _context.Questions.Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == question.Id);

        return createdQuestion == null ? null : new QuestionDto
        {
            Id = createdQuestion.Id,
            Text = createdQuestion.Text,
            Type = createdQuestion.Type.ToString(),
            Points = createdQuestion.Points,
            Order = createdQuestion.Order,
            ExpectedAnswer = createdQuestion.ExpectedAnswer,
            Options = createdQuestion.Options.OrderBy(o => o.Order).Select(o => new QuestionOptionDto
            {
                Id = o.Id,
                Text = o.Text,
                IsCorrect = o.IsCorrect,
                Order = o.Order
            }).ToList()
        };
    }

    public async Task<QuestionDto?> UpdateQuestionAsync(string questionId, CreateQuestionRequest request)
    {
        var question = await _context.Questions.Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == questionId);
        
        if (question == null) return null;

        // Update question properties
        question.Text = request.Text;
        question.Type = Enum.Parse<QuestionType>(request.Type);
        question.Points = request.Points;
        question.ExpectedAnswer = request.ExpectedAnswer;

        // Remove old options
        _context.QuestionOptions.RemoveRange(question.Options);
        
        // Add new options
        for (int i = 0; i < request.Options.Count; i++)
        {
            var optionRequest = request.Options[i];
            var option = new QuestionOption
            {
                QuestionId = question.Id,
                Text = optionRequest.Text,
                IsCorrect = optionRequest.IsCorrect,
                Order = i + 1
            };
            _context.QuestionOptions.Add(option);
        }

        await _context.SaveChangesAsync();

        // Return updated question
        var updatedQuestion = await _context.Questions.Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == questionId);

        return updatedQuestion == null ? null : new QuestionDto
        {
            Id = updatedQuestion.Id,
            Text = updatedQuestion.Text,
            Type = updatedQuestion.Type.ToString(),
            Points = updatedQuestion.Points,
            Order = updatedQuestion.Order,
            ExpectedAnswer = updatedQuestion.ExpectedAnswer,
            Options = updatedQuestion.Options.OrderBy(o => o.Order).Select(o => new QuestionOptionDto
            {
                Id = o.Id,
                Text = o.Text,
                IsCorrect = o.IsCorrect,
                Order = o.Order
            }).ToList()
        };
    }

    public async Task<bool> DeleteQuestionAsync(string questionId)
    {
        var question = await _context.Questions.FindAsync(questionId);
        if (question == null) return false;
        
        _context.Questions.Remove(question);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> PublishAssessmentAsync(string assessmentId)
    {
        var assessment = await _context.Assessments.FindAsync(assessmentId);
        if (assessment == null) return false;
        assessment.IsPublished = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAssessmentAsync(string assessmentId)
    {
        var assessment = await _context.Assessments.FindAsync(assessmentId);
        if (assessment == null) return false;
        _context.Assessments.Remove(assessment);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<AssessmentAttemptDto?> StartAssessmentAsync(string assessmentId, string studentId)
    {
        var assessment = await _context.Assessments.FindAsync(assessmentId);
        if (assessment == null || !assessment.IsPublished) return null;

        var attempt = new AssessmentAttempt { AssessmentId = assessmentId, StudentId = studentId };
        _context.AssessmentAttempts.Add(attempt);
        await _context.SaveChangesAsync();
        return await GetAttemptByIdAsync(attempt.Id);
    }

    public async Task<AssessmentAttemptDto?> SubmitAssessmentAsync(string attemptId, SubmitAssessmentRequest request)
    {
        var attempt = await _context.AssessmentAttempts.Include(a => a.Assessment)
            .ThenInclude(a => a!.Questions).ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(a => a.Id == attemptId);

        if (attempt == null || attempt.Status != AssessmentStatus.InProgress) return null;

        attempt.CompletedAt = DateTime.UtcNow;
        int totalScore = 0, maxScore = 0;

        foreach (var answerRequest in request.Answers)
        {
            var question = attempt.Assessment?.Questions.FirstOrDefault(q => q.Id == answerRequest.QuestionId);
            if (question == null) continue;

            maxScore += question.Points;
            var correctOption = question.Options.FirstOrDefault(o => o.IsCorrect);
            var isCorrect = correctOption?.Id == answerRequest.SelectedOptionId;
            
            if (isCorrect) totalScore += question.Points;

            _context.Answers.Add(new Answer
            {
                AttemptId = attemptId,
                QuestionId = answerRequest.QuestionId,
                SelectedOptionId = answerRequest.SelectedOptionId,
                TextAnswer = answerRequest.TextAnswer,
                IsCorrect = isCorrect,
                PointsEarned = isCorrect ? question.Points : 0
            });
        }

        attempt.Score = totalScore;
        attempt.MaxScore = maxScore;
        attempt.Status = AssessmentStatus.Graded;
        await _context.SaveChangesAsync();
        return await GetAttemptByIdAsync(attemptId);
    }

    public async Task<List<AssessmentAttemptDto>> GetStudentAttemptsAsync(string studentId) =>
        (await _context.AssessmentAttempts.Include(a => a.Assessment).Include(a => a.Student)
            .Where(a => a.StudentId == studentId).OrderByDescending(a => a.StartedAt).ToListAsync())
        .Select(MapToAttemptDto).ToList();

    public async Task<List<AssessmentAttemptDto>> GetAssessmentAttemptsAsync(string assessmentId) =>
        (await _context.AssessmentAttempts.Include(a => a.Assessment).Include(a => a.Student)
            .Where(a => a.AssessmentId == assessmentId).OrderByDescending(a => a.StartedAt).ToListAsync())
        .Select(MapToAttemptDto).ToList();

    public async Task<AssessmentAttemptDto?> GetAttemptByIdAsync(string attemptId)
    {
        var attempt = await _context.AssessmentAttempts.Include(a => a.Assessment).Include(a => a.Student)
            .FirstOrDefaultAsync(a => a.Id == attemptId);
        return attempt == null ? null : MapToAttemptDto(attempt);
    }

    public async Task<List<AnswerDto>> GetAttemptAnswersAsync(string attemptId) =>
        (await _context.Answers.Include(a => a.Question).ThenInclude(q => q!.Options)
            .Where(a => a.AttemptId == attemptId).ToListAsync())
        .Select(a => new AnswerDto
        {
            Id = a.Id,
            QuestionId = a.QuestionId,
            QuestionText = a.Question?.Text ?? "",
            QuestionType = a.Question?.Type.ToString() ?? "",
            QuestionPoints = a.Question?.Points ?? 0,
            QuestionOptions = a.Question?.Options.OrderBy(o => o.Order).Select(o => new QuestionOptionDto
            {
                Id = o.Id,
                Text = o.Text,
                IsCorrect = o.IsCorrect,
                Order = o.Order
            }).ToList() ?? new List<QuestionOptionDto>(),
            SelectedOptionId = a.SelectedOptionId,
            SelectedOptionText = a.Question?.Options.FirstOrDefault(o => o.Id == a.SelectedOptionId)?.Text,
            TextAnswer = a.TextAnswer,
            PointsEarned = a.PointsEarned,
            IsCorrect = a.IsCorrect,
            CorrectOptionId = a.Question?.Options.FirstOrDefault(o => o.IsCorrect)?.Id,
            CorrectAnswer = a.Question?.Options.FirstOrDefault(o => o.IsCorrect)?.Text,
            ExpectedAnswer = a.Question?.ExpectedAnswer
        }).ToList();

    private static AssessmentDto MapToAssessmentDto(Assessment assessment)
    {
        return new AssessmentDto
        {
            Id = assessment.Id,
            CourseId = assessment.CourseId,
            CourseName = assessment.Course?.Name ?? "",
            Title = assessment.Title,
            Description = assessment.Description,
            DurationMinutes = assessment.DurationMinutes,
            DueDate = assessment.DueDate,
            CreatedAt = assessment.CreatedAt,
            IsPublished = assessment.IsPublished,
            QuestionCount = assessment.Questions.Count,
            TotalPoints = assessment.Questions.Sum(q => q.Points)
        };
    }

    private static AssessmentAttemptDto MapToAttemptDto(AssessmentAttempt attempt)
    {
        return new AssessmentAttemptDto
        {
            Id = attempt.Id,
            AssessmentId = attempt.AssessmentId,
            AssessmentTitle = attempt.Assessment?.Title ?? "",
            StudentId = attempt.StudentId,
            StudentName = attempt.Student?.Name ?? "",
            StartedAt = attempt.StartedAt,
            CompletedAt = attempt.CompletedAt,
            Score = attempt.Score,
            MaxScore = attempt.MaxScore,
            Status = attempt.Status.ToString()
        };
    }
}
