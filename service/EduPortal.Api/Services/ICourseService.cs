using EduPortal.Api.DTOs;

namespace EduPortal.Api.Services;

public interface ICourseService
{
    Task<List<CourseDto>> GetAllCoursesAsync();
    Task<List<CourseDto>> GetTeacherCoursesAsync(string teacherId);
    Task<List<CourseDto>> GetStudentCoursesAsync(string studentId);
    Task<CourseDto?> GetCourseByIdAsync(string courseId);
    Task<CourseDto?> CreateCourseAsync(string teacherId, CreateCourseRequest request);
    Task<CourseDto?> UpdateCourseAsync(string courseId, string teacherId, UpdateCourseRequest request);
    Task<bool> DeleteCourseAsync(string courseId, string teacherId);
    Task<bool> EnrollStudentAsync(EnrollStudentRequest request);
    Task<bool> UnenrollStudentAsync(string enrollmentId);
    Task<List<EnrollmentDto>> GetCourseEnrollmentsAsync(string courseId);
    Task<List<StudentDto>> GetAllStudentsAsync();
}
