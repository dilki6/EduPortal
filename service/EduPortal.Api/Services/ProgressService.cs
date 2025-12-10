using EduPortal.Api.Data;
using EduPortal.Api.DTOs;
using EduPortal.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EduPortal.Api.Services;

public class ProgressService : IProgressService
{
    private readonly EduPortalDbContext _context;

    public ProgressService(EduPortalDbContext context)
    {
        _context = context;
    }

    public async Task<ProgressDto?> GetStudentProgressAsync(string studentId)
    {
        var student = await _context.Users.FindAsync(studentId);
        if (student == null) return null;

        var enrollments = await _context.Enrollments.Where(e => e.StudentId == studentId).ToListAsync();
        var attempts = await _context.AssessmentAttempts.Where(a => a.StudentId == studentId && a.Status == AssessmentStatus.Graded).ToListAsync();

        return new ProgressDto
        {
            StudentId = studentId,
            StudentName = student.Name,
            TotalCourses = enrollments.Count,
            CompletedAssessments = attempts.Count,
            PendingAssessments = await GetPendingAssessmentsCountAsync(studentId),
            AverageScore = attempts.Any() ? Math.Round(attempts.Average(a => (a.Score ?? 0) * 100.0 / (a.MaxScore ?? 1)), 2) : 0,
            CourseProgress = await GetStudentCourseProgressAsync(studentId)
        };
    }

    public async Task<List<CourseProgressDto>> GetStudentCourseProgressAsync(string studentId)
    {
        var enrollments = await _context.Enrollments.Include(e => e.Course).ThenInclude(c => c!.Assessments)
            .Where(e => e.StudentId == studentId).ToListAsync();

        var progressList = new List<CourseProgressDto>();
        foreach (var enrollment in enrollments)
        {
            if (enrollment.Course == null) continue;

            var assessmentIds = enrollment.Course.Assessments.Where(a => a.IsPublished).Select(a => a.Id).ToList();
            var attempts = await _context.AssessmentAttempts.Where(a => a.StudentId == studentId && 
                assessmentIds.Contains(a.AssessmentId) && a.Status == AssessmentStatus.Graded).ToListAsync();

            progressList.Add(new CourseProgressDto
            {
                CourseId = enrollment.Course.Id,
                CourseName = enrollment.Course.Name,
                Progress = enrollment.Progress,
                CompletedAssessments = attempts.Count,
                TotalAssessments = assessmentIds.Count,
                AverageScore = attempts.Any() ? Math.Round(attempts.Average(a => (a.Score ?? 0) * 100.0 / (a.MaxScore ?? 1)), 2) : null
            });
        }
        return progressList;
    }

    private async Task<int> GetPendingAssessmentsCountAsync(string studentId)
    {
        var enrolledCourses = await _context.Enrollments.Where(e => e.StudentId == studentId).Select(e => e.CourseId).ToListAsync();
        var publishedCount = await _context.Assessments.CountAsync(a => enrolledCourses.Contains(a.CourseId) && a.IsPublished);
        var completedCount = await _context.AssessmentAttempts.Where(a => a.StudentId == studentId && a.Status == AssessmentStatus.Graded)
            .Select(a => a.AssessmentId).Distinct().CountAsync();
        return publishedCount - completedCount;
    }
}
