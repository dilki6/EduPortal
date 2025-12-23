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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '24px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0', color: '#0f172a' }}>Teacher Dashboard</h1>
          <p style={{ color: '#718096', margin: '0', fontSize: '15px' }}>Manage your courses and assessments</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Courses', value: stats.totalCourses, color: '#0066cc', icon: '📚' },
            { label: 'Total Students', value: stats.totalStudents, color: '#059669', icon: '👥' },
            { label: 'Total Assessments', value: stats.totalAssessments, color: '#7c3aed', icon: '📝' },
            { label: 'Pending Evaluations', value: stats.pendingEvaluations, color: '#dc2626', highlight: stats.pendingEvaluations > 0, icon: '⏳' }
          ].map((stat, idx) => (
            <div key={idx} style={{
              padding: '20px',
              backgroundColor: stat.highlight ? '#fee2e2' : '#ffffff',
              borderRadius: '8px',
              borderLeft: `4px solid ${stat.color}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#718096', marginBottom: '8px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>
                    {stat.value}
                  </div>
                </div>
                <div style={{ fontSize: '24px' }}>{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Your Courses */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0', color: '#0f172a' }}>Your Courses ({courses.length})</h2>
            <Link to="/course-management" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '8px 16px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'background-color 0.2s'
              }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0052a3'} 
                 onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0066cc'}>
                + New Course
              </button>
            </Link>
          </div>
          {courses.length > 0 ? (
            <div style={{ 
              overflowX: 'auto',
              overflowY: 'hidden',
              paddingBottom: '8px',
              scrollBehavior: 'smooth'
            }}>
              <div style={{ display: 'flex', gap: '16px', minWidth: 'min-content' }}>
                {courses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((course) => (
                  <Link key={course.id} to="/course-management" style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      borderTop: '3px solid #0066cc',
                      minWidth: '300px',
                      flex: '0 0 auto',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s, transform 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{course.name}</h4>
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#718096', lineHeight: '1.5', minHeight: '2.6em' }}>
                        {course.description?.substring(0, 80) || 'No description'}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>👥 Students</div>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: '#059669' }}>{course.studentCount}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>📋 Assessments</div>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: '#7c3aed' }}>{course.assessmentCount}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '10px' }}>
                        📅 {new Date(course.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '32px', 
              backgroundColor: '#f3f4f6', 
              borderRadius: '8px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '14px', color: '#718096', marginBottom: '12px' }}>No courses created yet</div>
              <Link to="/course-management" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#0066cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  Create First Course
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Assessments */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 16px 0', color: '#0f172a' }}>Recent Assessments</h2>
          {assessments.length > 0 ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {assessments.slice(0, 5).map((assessment, idx) => {
                  const isLastItem = idx === assessments.slice(0, 5).length - 1;
                  return (
                    <div key={assessment.id} style={{
                      padding: '16px',
                      borderBottom: isLastItem ? 'none' : '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                          {assessment.title}
                        </div>
                        <div style={{ fontSize: '13px', color: '#718096' }}>
                          {assessment.isPublished ? '✅ Published' : '📝 Draft'} • {new Date(assessment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: assessment.isPublished ? '#065f46' : '#92400e',
                        backgroundColor: assessment.isPublished ? '#dcfce7' : '#fef3c7',
                        padding: '4px 10px',
                        borderRadius: '4px'
                      }}>
                        {assessment.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '24px', 
              backgroundColor: '#f3f4f6', 
              borderRadius: '8px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '14px', color: '#718096' }}>No assessments created yet</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;