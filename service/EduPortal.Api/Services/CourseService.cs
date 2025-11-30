using EduPortal.Api.Data;
using EduPortal.Api.DTOs;
using EduPortal.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EduPortal.Api.Services;

public class CourseService : ICourseService
{
    private readonly EduPortalDbContext _context;

    public CourseService(EduPortalDbContext context)
    {
        _context = context;
    }

    public async Task<List<CourseDto>> GetAllCoursesAsync() =>
        (await _context.Courses.Include(c => c.Teacher).Include(c => c.Enrollments).ToListAsync())
        .Select(MapToCourseDto).ToList();

    public async Task<List<CourseDto>> GetTeacherCoursesAsync(string teacherId) =>
        (await _context.Courses.Include(c => c.Teacher).Include(c => c.Enrollments)
            .Where(c => c.TeacherId == teacherId).ToListAsync())
        .Select(MapToCourseDto).ToList();

    public async Task<List<CourseDto>> GetStudentCoursesAsync(string studentId) =>
        (await _context.Enrollments.Include(e => e.Course).ThenInclude(c => c!.Teacher)
            .Include(e => e.Course).ThenInclude(c => c!.Enrollments)
            .Where(e => e.StudentId == studentId).Select(e => e.Course!).ToListAsync())
        .Select(MapToCourseDto).ToList();

    public async Task<CourseDto?> GetCourseByIdAsync(string courseId)
    {
        var course = await _context.Courses.Include(c => c.Teacher).Include(c => c.Enrollments)
            .FirstOrDefaultAsync(c => c.Id == courseId);
        return course == null ? null : MapToCourseDto(course);
    }

    public async Task<CourseDto?> CreateCourseAsync(string teacherId, CreateCourseRequest request)
    {
        var course = new Course
        {
            Name = request.Name,
            Description = request.Description,
            TeacherId = teacherId
        };

        _context.Courses.Add(course);
        await _context.SaveChangesAsync();

        return await GetCourseByIdAsync(course.Id);
    }

    public async Task<CourseDto?> UpdateCourseAsync(string courseId, string teacherId, UpdateCourseRequest request)
    {
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == courseId && c.TeacherId == teacherId);

        if (course == null) return null;

        course.Name = request.Name;
        course.Description = request.Description;

        await _context.SaveChangesAsync();

        return await GetCourseByIdAsync(course.Id);
    }

    public async Task<bool> DeleteCourseAsync(string courseId, string teacherId)
    {
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == courseId && c.TeacherId == teacherId);

        if (course == null) return false;

        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> EnrollStudentAsync(EnrollStudentRequest request)
    {
        if (await _context.Enrollments.AnyAsync(e => e.StudentId == request.StudentId && e.CourseId == request.CourseId))
            return false;

        _context.Enrollments.Add(new Enrollment { StudentId = request.StudentId, CourseId = request.CourseId });
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UnenrollStudentAsync(string enrollmentId)
    {
        var enrollment = await _context.Enrollments.FindAsync(enrollmentId);
        if (enrollment == null) return false;
        
        _context.Enrollments.Remove(enrollment);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<EnrollmentDto?> UpdateProgressAsync(string courseId, string studentId, int progress)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.Student)
            .Include(e => e.Course)
            .FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == studentId);

        if (enrollment == null) return null;

        enrollment.Progress = Math.Clamp(progress, 0, 100);
        await _context.SaveChangesAsync();

        return new EnrollmentDto
        {
            Id = enrollment.Id,
            StudentId = enrollment.StudentId,
            StudentName = enrollment.Student?.Name ?? "",
            StudentEmail = enrollment.Student?.Email ?? "",
            CourseId = enrollment.CourseId,
            CourseName = enrollment.Course?.Name ?? "",
            EnrolledAt = enrollment.EnrolledAt,
            Progress = enrollment.Progress
        };
    }

    public async Task<List<EnrollmentDto>> GetCourseEnrollmentsAsync(string courseId) =>
        (await _context.Enrollments.Include(e => e.Student).Include(e => e.Course)
            .Where(e => e.CourseId == courseId).ToListAsync())
        .Select(e => new EnrollmentDto
        {
            Id = e.Id,
            StudentId = e.StudentId,
            StudentName = e.Student?.Name ?? "",
            StudentEmail = e.Student?.Email ?? "",
            CourseId = e.CourseId,
            CourseName = e.Course?.Name ?? "",
            EnrolledAt = e.EnrolledAt,
            Progress = e.Progress
        }).ToList();

    public async Task<List<StudentDto>> GetAllStudentsAsync() =>
        (await _context.Users.Where(u => u.Role == UserRole.Student).ToListAsync())
        .Select(s => new StudentDto { Id = s.Id, Name = s.Name, Email = s.Email, Username = s.Username }).ToList();

    private static CourseDto MapToCourseDto(Course course)
    {
        return new CourseDto
        {
            Id = course.Id,
            Name = course.Name,
            Description = course.Description,
            TeacherId = course.TeacherId,
            TeacherName = course.Teacher?.Name ?? "",
            CreatedAt = course.CreatedAt,
            EnrolledStudentsCount = course.Enrollments.Count,
            EnrolledStudentIds = course.Enrollments.Select(e => e.StudentId).ToList()
        };
    }
}
