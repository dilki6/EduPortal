import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseApi, assessmentApi } from '@/lib/api';
import type { Course, Assessment, EnrollmentWithDetails, AssessmentAttempt } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CourseWithDetails extends Course {
  studentCount: number;
  assessmentCount: number;
}

const TeacherDashboard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseWithDetails[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pendingEvaluations, setPendingEvaluations] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [teacherCourses, teacherAssessments] = await Promise.all([
        courseApi.getMyTeachingCourses(),
        assessmentApi.getMyTeachingAssessments()
      ]);

      const coursesWithDetails = await Promise.all(
        teacherCourses.map(async (course) => {
          try {
            const enrollments = await courseApi.getEnrollments(course.id);
            const courseAssessments = teacherAssessments.filter(a => a.courseId === course.id);
            
            return {
              ...course,
              studentCount: enrollments.length,
              assessmentCount: courseAssessments.length
            };
          } catch (error) {
            console.error(`Failed to fetch details for course ${course.id}:`, error);
            return {
              ...course,
              studentCount: 0,
              assessmentCount: 0
            };
          }
        })
      );

      const allEnrollments = await Promise.all(
        teacherCourses.map(course => 
          courseApi.getEnrollments(course.id).catch(() => [])
        )
      );
      const uniqueStudentIds = new Set(
        allEnrollments.flat().map(enrollment => enrollment.studentId)
      );

      let pending = 0;
      for (const assessment of teacherAssessments) {
        try {
          const attempts = await assessmentApi.getAssessmentAttempts(assessment.id);
          const completedUnreleased = attempts.filter(
            attempt => attempt.status === 'Completed' && !assessment.resultsReleased
          );
          pending += completedUnreleased.length;
        } catch (error) {
          console.error(`Failed to fetch attempts for assessment ${assessment.id}:`, error);
        }
      }

      setCourses(coursesWithDetails);
      setAssessments(teacherAssessments);
      setTotalStudents(uniqueStudentIds.size);
      setPendingEvaluations(pending);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#718096', fontWeight: '500' }}>Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  const stats = {
    totalCourses: courses.length,
    totalStudents: totalStudents,
    totalAssessments: assessments.length,
    pendingEvaluations: pendingEvaluations
  };

  const handleManageCourse = (courseId: string) => {
    navigate('/course-management', { state: { editCourseId: courseId } });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', padding: '24px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 4px 0', color: '#0f172a' }}>Teacher Dashboard</h1>
          <p style={{ color: '#718096', margin: '0', fontSize: '14px' }}>Manage courses and assessments</p>
        </div>

        {/* Your Courses */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0', color: '#0f172a' }}>Your Courses</h2>
            <Link to="/course-management" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '8px 14px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                + New Course
              </button>
            </Link>
          </div>
          {courses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {courses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3).map((course) => (
                <div key={course.id} style={{
                  padding: '10px 0',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{course.name}</h4>
                    <div style={{ fontSize: '12px', color: '#718096' }}>
                      {course.studentCount} students • {course.assessmentCount} assessments
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#718096', padding: '10px 0' }}>
              No courses created yet
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', color: '#0f172a' }}>Recent Activity</h2>
          {assessments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {assessments.slice(0, 4).map((assessment) => (
                <div key={assessment.id} style={{
                  padding: '10px 0',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{assessment.title}</div>
                    <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
                      {assessment.isPublished ? '✅ Published' : '📝 Draft'} • {new Date(assessment.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: assessment.isPublished ? '#065f46' : '#92400e',
                    padding: '3px 8px'
                  }}>
                    {assessment.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#718096', padding: '10px 0' }}>
              No activity yet
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', color: '#0f172a' }}>Quick Links</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Manage Courses', to: '/course-management' },
              { label: 'Create Assessment', to: '/assessment-management' },
              { label: 'Review Answers', to: '/review-answers' }
            ].map((action, idx) => (
              <Link key={idx} to={action.to} style={{ textDecoration: 'none' }}>
                <button style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0066cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  {action.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;