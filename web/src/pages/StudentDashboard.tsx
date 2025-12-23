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

  // Calculate overall progress from course progress
  const overallProgress = progressData?.courseProgress && progressData.courseProgress.length > 0
    ? Math.round(progressData.courseProgress.reduce((sum, cp) => sum + cp.progress, 0) / progressData.courseProgress.length)
    : 0;

  const stats = {
    enrolledCourses: progressData?.totalCourses || 0,
    completedAssessments: progressData?.completedAssessments || 0,
    pendingAssessments: progressData?.pendingAssessments || 0,
    averageScore: progressData?.averageScore || 0,
    overallProgress: overallProgress
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '24px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0', color: '#0f172a' }}>My Learning Dashboard</h1>
          <p style={{ color: '#718096', margin: '0', fontSize: '15px' }}>Track your progress and continue learning</p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Overall Progress', value: `${stats.overallProgress}%`, color: '#0066cc', icon: '📈' },
            { label: 'Completed Assessments', value: stats.completedAssessments, color: '#059669', icon: '✅' },
            { label: 'Pending Assessments', value: stats.pendingAssessments, color: '#f59e0b', highlight: stats.pendingAssessments > 0, icon: '⏳' },
            { label: 'Average Score', value: `${Math.round(stats.averageScore)}%`, color: '#7c3aed', icon: '⭐' }
          ].map((stat, idx) => (
            <div key={idx} style={{
              padding: '20px',
              backgroundColor: stat.highlight ? '#fffbeb' : '#ffffff',
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

        {/* My Courses */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0', color: '#0f172a' }}>My Courses ({coursesWithProgress.length})</h2>
            <Link to="/my-courses" style={{ color: '#0066cc', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
              View All →
            </Link>
          </div>
          {coursesWithProgress.length > 0 ? (
            <div style={{ 
              overflowX: 'auto',
              overflowY: 'hidden',
              paddingBottom: '8px',
              scrollBehavior: 'smooth'
            }}>
              <div style={{ display: 'flex', gap: '16px', minWidth: 'min-content' }}>
                {coursesWithProgress.map((course) => (
                  <div key={course.id} style={{
                    padding: '16px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderTop: '3px solid #0066cc',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    minWidth: '300px',
                    flex: '0 0 auto'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <h4 style={{ margin: '0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{course.name}</h4>
                    </div>
                    
                    {/* Course Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>📋 Completed</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#059669' }}>
                          {course.completedAssessments}/{course.totalAssessments}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>⭐ Avg Score</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#7c3aed' }}>
                          {Math.round(course.averageScore)}%
                        </div>
                      </div>
                    </div>
                  </div>
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
              <div style={{ fontSize: '14px', color: '#718096', marginBottom: '12px' }}>Not enrolled in any courses yet</div>
              <Link to="/my-courses" style={{ textDecoration: 'none' }}>
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
                  Browse Courses
                </button>
              </Link>
            </div>
          )}
        </div>
        {/* Recent Assessments */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 16px 0', color: '#0f172a' }}>Recent Assessments</h2>
            {recentAttempts.length > 0 ? (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {recentAttempts.map((attempt, idx) => {
                    const status = getAssessmentStatus(attempt);
                    const percentage = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
                    
                    let statusColor = '#718096';
                    let statusBg = '#f3f4f6';
                    let statusLabel = 'Not Started';
                    
                    if (status === 'completed') {
                      statusColor = '#065f46';
                      statusBg = '#dcfce7';
                      statusLabel = `${percentage}%`;
                    } else if (status === 'pending') {
                      statusColor = '#92400e';
                      statusBg = '#fef3c7';
                      statusLabel = 'Pending Review';
                    } else if (status === 'in-progress') {
                      statusColor = '#1e40af';
                      statusBg = '#dbeafe';
                      statusLabel = 'In Progress';
                    }
                    
                    return (
                      <div key={attempt.id} style={{
                        padding: '16px',
                        borderBottom: idx < recentAttempts.length - 1 ? '1px solid #e2e8f0' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                            {attempt.assessmentTitle}
                          </div>
                          <div style={{ fontSize: '13px', color: '#718096' }}>
                            {attempt.courseName} • {new Date(attempt.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {status === 'completed' && (
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '12px', color: '#718096', marginBottom: '2px' }}>Your Score</div>
                              <div style={{ fontSize: '18px', fontWeight: '700', color: statusColor }}>
                                {attempt.score}/{attempt.maxScore}
                              </div>
                            </div>
                          )}
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: statusColor,
                            backgroundColor: statusBg,
                            padding: '6px 12px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap'
                          }}>
                            {statusLabel}
                          </span>
                        </div>
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
                <div style={{ fontSize: '14px', color: '#718096' }}>No assessments yet</div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;