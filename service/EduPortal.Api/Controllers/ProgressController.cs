using EduPortal.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EduPortal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProgressController : ControllerBase
{
    private readonly IProgressService _progressService;

    public ProgressController(IProgressService progressService)
    {
        _progressService = progressService;
    }

    [HttpGet("student")]
    public async Task<IActionResult> GetStudentProgress()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var progress = await _progressService.GetStudentProgressAsync(userId);
        return progress == null ? NotFound(new { message = "Student not found" }) : Ok(progress);
    }

    [HttpGet("student/{studentId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetStudentProgressById(string studentId)
    {
        var progress = await _progressService.GetStudentProgressAsync(studentId);
        return progress == null ? NotFound(new { message = "Student not found" }) : Ok(progress);
    }

    [HttpGet("student/courses")]
    public async Task<IActionResult> GetStudentCourseProgress()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return userId == null ? Unauthorized() : Ok(await _progressService.GetStudentCourseProgressAsync(userId));
    }
}
