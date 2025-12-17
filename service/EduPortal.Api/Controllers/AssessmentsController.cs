using EduPortal.Api.DTOs;
using EduPortal.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EduPortal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssessmentsController : ControllerBase
{
    private readonly IAssessmentService _assessmentService;

    public AssessmentsController(IAssessmentService assessmentService)
    {
        _assessmentService = assessmentService;
    }

    [HttpGet("my-teaching")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetMyAssessments()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return userId == null ? Unauthorized() : Ok(await _assessmentService.GetTeacherAssessmentsAsync(userId));
    }

    [HttpGet("course/{courseId}")]
    public async Task<IActionResult> GetCourseAssessments(string courseId) => Ok(await _assessmentService.GetCourseAssessmentsAsync(courseId));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAssessment(string id)
    {
        var assessment = await _assessmentService.GetAssessmentByIdAsync(id);
        return assessment == null ? NotFound(new { message = "Assessment not found" }) : Ok(assessment);
    }

    [HttpGet("{id}/questions")]
    public async Task<IActionResult> GetAssessmentQuestions(string id, [FromQuery] bool includeAnswers = false)
    {
        var isTeacher = User.FindFirstValue(ClaimTypes.Role) == "Teacher";
        return Ok(await _assessmentService.GetAssessmentQuestionsAsync(id, includeAnswers && isTeacher));
    }

    [HttpPost("{id}/questions")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> AddQuestionToAssessment(string id, [FromBody] CreateQuestionRequest request)
    {
        var question = await _assessmentService.AddQuestionToAssessmentAsync(id, request);
        return question == null ? BadRequest(new { message = "Failed to add question" }) : Ok(question);
    }

    [HttpPut("questions/{questionId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> UpdateQuestion(string questionId, [FromBody] CreateQuestionRequest request)
    {
        var question = await _assessmentService.UpdateQuestionAsync(questionId, request);
        return question == null ? NotFound(new { message = "Question not found" }) : Ok(question);
    }

    [HttpDelete("questions/{questionId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> DeleteQuestion(string questionId)
    {
        var result = await _assessmentService.DeleteQuestionAsync(questionId);
        return result ? NoContent() : NotFound(new { message = "Question not found" });
    }

    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> CreateAssessment([FromBody] CreateAssessmentRequest request)
    {
        var assessment = await _assessmentService.CreateAssessmentAsync(request);
        return assessment == null ? BadRequest(new { message = "Failed to create assessment" }) 
            : CreatedAtAction(nameof(GetAssessment), new { id = assessment.Id }, assessment);
    }

    [HttpPost("{id}/publish")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> PublishAssessment(string id)
    {
        var result = await _assessmentService.PublishAssessmentAsync(id);
        return result ? Ok(new { message = "Assessment published successfully" }) : NotFound(new { message = "Assessment not found" });
    }

    [HttpPost("{id}/unpublish")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> UnpublishAssessment(string id)
    {
        var result = await _assessmentService.UnpublishAssessmentAsync(id);
        return result ? Ok(new { message = "Assessment unpublished successfully" }) : NotFound(new { message = "Assessment not found" });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> DeleteAssessment(string id)
    {
        var result = await _assessmentService.DeleteAssessmentAsync(id);
        return result ? NoContent() : NotFound(new { message = "Assessment not found" });
    }

    [HttpPost("{id}/start")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> StartAssessment(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var attempt = await _assessmentService.StartAssessmentAsync(id, userId);
        return attempt == null ? BadRequest(new { message = "Cannot start assessment" }) : Ok(attempt);
    }

    [HttpPost("attempts/{attemptId}/submit")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> SubmitAssessment(string attemptId, [FromBody] SubmitAssessmentRequest request)
    {
        var attempt = await _assessmentService.SubmitAssessmentAsync(attemptId, request);
        return attempt == null ? BadRequest(new { message = "Cannot submit assessment" }) : Ok(attempt);
    }

    [HttpGet("attempts/student")]
    public async Task<IActionResult> GetStudentAttempts()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return userId == null ? Unauthorized() : Ok(await _assessmentService.GetStudentAttemptsAsync(userId));
    }

    [HttpGet("{id}/attempts")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetAssessmentAttempts(string id) => Ok(await _assessmentService.GetAssessmentAttemptsAsync(id));

    [HttpGet("attempts/{attemptId}")]
    public async Task<IActionResult> GetAttempt(string attemptId)
    {
        var attempt = await _assessmentService.GetAttemptByIdAsync(attemptId);
        return attempt == null ? NotFound(new { message = "Attempt not found" }) : Ok(attempt);
    }

    [HttpGet("attempts/{attemptId}/answers")]
    public async Task<IActionResult> GetAttemptAnswers(string attemptId) => Ok(await _assessmentService.GetAttemptAnswersAsync(attemptId));

    [HttpGet("{assessmentId}/attempt-status")]
    public async Task<IActionResult> GetAttemptStatus(string assessmentId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        
        var attempt = await _assessmentService.GetAttemptByAssessmentAndStudentAsync(assessmentId, userId);
        return Ok(new { hasAttempted = attempt != null, attempt });
    }
}
