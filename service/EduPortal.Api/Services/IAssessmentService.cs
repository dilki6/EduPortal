using EduPortal.Api.DTOs;

namespace EduPortal.Api.Services;

public interface IAssessmentService
{
    Task<List<AssessmentDto>> GetCourseAssessmentsAsync(string courseId);
    Task<List<AssessmentDto>> GetTeacherAssessmentsAsync(string teacherId);
    Task<AssessmentDto?> GetAssessmentByIdAsync(string assessmentId);
    Task<List<QuestionDto>> GetAssessmentQuestionsAsync(string assessmentId, bool includeAnswers = false);
    Task<AssessmentDto?> CreateAssessmentAsync(CreateAssessmentRequest request);
    Task<bool> PublishAssessmentAsync(string assessmentId);
    Task<bool> DeleteAssessmentAsync(string assessmentId);
    Task<AssessmentAttemptDto?> StartAssessmentAsync(string assessmentId, string studentId);
    Task<AssessmentAttemptDto?> SubmitAssessmentAsync(string attemptId, SubmitAssessmentRequest request);
    Task<List<AssessmentAttemptDto>> GetStudentAttemptsAsync(string studentId);
    Task<List<AssessmentAttemptDto>> GetAssessmentAttemptsAsync(string assessmentId);
    Task<AssessmentAttemptDto?> GetAttemptByIdAsync(string attemptId);
    Task<List<AnswerDto>> GetAttemptAnswersAsync(string attemptId);
}
