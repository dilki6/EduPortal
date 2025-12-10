using EduPortal.Api.DTOs;

namespace EduPortal.Api.Services;

public interface IProgressService
{
    Task<ProgressDto?> GetStudentProgressAsync(string studentId);
    Task<List<CourseProgressDto>> GetStudentCourseProgressAsync(string studentId);
}
