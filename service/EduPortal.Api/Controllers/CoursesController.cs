using EduPortal.Api.DTOs;
using EduPortal.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EduPortal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courseService;

    public CoursesController(ICourseService courseService)
    {
        _courseService = courseService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllCourses() => Ok(await _courseService.GetAllCoursesAsync());

    [HttpGet("my-teaching")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetMyTeachingCourses()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return userId == null ? Unauthorized() : Ok(await _courseService.GetTeacherCoursesAsync(userId));
    }

    [HttpGet("my-enrolled")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyEnrolledCourses()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Console.WriteLine($"📚 GetMyEnrolledCourses: Request from user {userId}");
        
        if (userId == null) 
        {
            Console.WriteLine("❌ GetMyEnrolledCourses: Unauthorized - No userId");
            return Unauthorized();
        }
        
        var courses = await _courseService.GetStudentCoursesAsync(userId);
        Console.WriteLine($"✅ GetMyEnrolledCourses: Returning {courses.Count} courses");
        
        return Ok(courses);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCourse(string id)
    {
        var course = await _courseService.GetCourseByIdAsync(id);
        return course == null ? NotFound(new { message = "Course not found" }) : Ok(course);
    }

    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var course = await _courseService.CreateCourseAsync(userId, request);
        return CreatedAtAction(nameof(GetCourse), new { id = course!.Id }, course);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> UpdateCourse(string id, [FromBody] UpdateCourseRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var course = await _courseService.UpdateCourseAsync(id, userId, request);
        return course == null ? NotFound(new { message = "Course not found or you don't have permission" }) : Ok(course);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> DeleteCourse(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var result = await _courseService.DeleteCourseAsync(id, userId);
        return result ? NoContent() : NotFound(new { message = "Course not found or you don't have permission" });
    }

    [HttpPost("enroll")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> EnrollStudent([FromBody] EnrollStudentRequest request)
    {
        var result = await _courseService.EnrollStudentAsync(request);
        return result ? Ok(new { message = "Student enrolled successfully" }) : BadRequest(new { message = "Student already enrolled or invalid data" });
    }

    [HttpDelete("enroll/{enrollmentId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> UnenrollStudent(string enrollmentId)
    {
        var result = await _courseService.UnenrollStudentAsync(enrollmentId);
        return result ? NoContent() : NotFound(new { message = "Enrollment not found" });
    }

    [HttpGet("{id}/enrollments")]
    public async Task<IActionResult> GetCourseEnrollments(string id) => Ok(await _courseService.GetCourseEnrollmentsAsync(id));

    [HttpPut("{id}/progress")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> UpdateProgress(string id, [FromBody] UpdateProgressRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        
        var result = await _courseService.UpdateProgressAsync(id, userId, request.Progress);
        return result != null ? Ok(result) : NotFound(new { message = "Enrollment not found" });
    }

    [HttpGet("students/all")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetAllStudents() => Ok(await _courseService.GetAllStudentsAsync());
}
