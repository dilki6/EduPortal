import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { progressApi, courseApi, assessmentApi } from '@/lib/api';
import type { StudentProgress, CourseProgressDto, AssessmentAttempt, Course } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const StudentDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<StudentProgress | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<AssessmentAttempt[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [progress, courses, attempts] = await Promise.all([
        progressApi.getStudentProgress(),
        courseApi.getMyEnrolledCourses(),
        assessmentApi.getStudentAttempts()
      ]);
      
      setProgressData(progress);
      setEnrolledCourses(courses);
      setRecentAttempts(attempts.slice(0, 4));
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
    enrolledCourses: progressData?.totalCourses || 0,
    completedAssessments: progressData?.completedAssessments || 0,
    pendingAssessments: progressData?.pendingAssessments || 0,
    averageScore: progressData?.averageScore || 0
  };

  const coursesWithProgress = enrolledCourses.map(course => {
    const courseProgress = progressData?.courseProgress.find(cp => cp.courseId === course.id);
    return {
      ...course,
      progress: courseProgress?.progress || 0,
      completedAssessments: courseProgress?.completedAssessments || 0,
      totalAssessments: courseProgress?.totalAssessments || 0,
      averageScore: courseProgress?.averageScore || 0
    };
  });

  const getAssessmentStatus = (attempt: AssessmentAttempt) => {
    if (attempt.status === 'Completed' && attempt.resultsReleased) {
      return 'completed';
    } else if (attempt.status === 'Completed' && !attempt.resultsReleased) {
      return 'pending';
    } else if (attempt.status === 'InProgress') {
      return 'in-progress';
    }
    return 'not-started';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', padding: '24px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 4px 0', color: '#0f172a' }}>Student Dashboard</h1>
          <p style={{ color: '#718096', margin: '0', fontSize: '14px' }}>Your learning progress</p>
        </div>

        {/* My Courses */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0', color: '#0f172a' }}>My Courses</h2>
            <Link to="/my-courses" style={{ color: '#0066cc', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
              View All →
            </Link>
          </div>
          {coursesWithProgress.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {coursesWithProgress.slice(0, 3).map((course) => (
                <div key={course.id} style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{course.name}</h4>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#0066cc' }}>{Math.round(course.progress)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${course.progress}%`, height: '100%', backgroundColor: '#0066cc' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#718096', padding: '12px 0' }}>
              No enrolled courses
            </div>
          )}
        </div>

        {/* Recent Assessments */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', color: '#0f172a' }}>Recent Assessments</h2>
          {recentAttempts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentAttempts.map((attempt) => {
                const status = getAssessmentStatus(attempt);
                const percentage = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
                const statusLabel = status === 'completed' ? `${percentage}%` : status === 'pending' ? 'Pending' : status === 'in-progress' ? 'In Progress' : 'Not Started';
                
                return (
                  <div key={attempt.id} style={{
                    padding: '10px 0',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{attempt.assessmentTitle}</div>
                      <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>{attempt.courseName}</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#0066cc' }}>
                      {statusLabel}
                    </span>
                  </div>
                );
              })
            }
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#718096', padding: '10px 0' }}>
              No assessments yet
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', color: '#0f172a' }}>Quick Links</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            {[
              { label: 'My Courses', to: '/my-courses' },
              { label: 'Take Assessment', to: '/my-courses' },
              { label: 'My Progress', to: '/my-progress' }
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

export default StudentDashboard;