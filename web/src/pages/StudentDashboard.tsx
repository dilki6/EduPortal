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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Loading dashboard...</div>
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
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Student Dashboard</h1>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '12px' }}>Your courses and assessments</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Enrolled Courses</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px' }}>{stats.enrolledCourses}</div>
          </div>
          <div style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Completed Assessments</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px' }}>{stats.completedAssessments}</div>
          </div>
          <div style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Pending Assessments</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px' }}>{stats.pendingAssessments}</div>
          </div>
          <div style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Average Score</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px' }}>{stats.averageScore}%</div>
          </div>
        </div>

        {/* My Courses */}
        <div style={{ border: '1px solid #ddd', marginBottom: '20px', padding: '15px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>My Courses</h2>
          {coursesWithProgress.length > 0 ? (
            <div>
              {coursesWithProgress.slice(0, 3).map((course) => (
                <div key={course.id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <h4 style={{ margin: '0', fontSize: '13px', fontWeight: 'bold' }}>{course.name}</h4>
                    <span style={{ fontSize: '11px', color: '#666' }}>{Math.round(course.progress)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#ddd', marginBottom: '5px' }}>
                    <div style={{ width: `${course.progress}%`, height: '100%', backgroundColor: '#4CAF50' }}></div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    {course.completedAssessments} of {course.totalAssessments} assessments completed
                  </div>
                </div>
              ))}
              <Link to="/my-courses">
                <button style={{ width: '100%', padding: '8px', backgroundColor: '#ddd', border: '1px solid #999', cursor: 'pointer', fontSize: '12px' }}>
                  View All Courses
                </button>
              </Link>
            </div>
          ) : (
            <p style={{ color: '#666', fontSize: '12px' }}>No enrolled courses yet</p>
          )}
        </div>

        {/* Recent Assessments */}
        <div style={{ border: '1px solid #ddd', marginBottom: '20px', padding: '15px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Recent Assessments</h2>
          {recentAttempts.length > 0 ? (
            recentAttempts.map((attempt) => {
              const status = getAssessmentStatus(attempt);
              const percentage = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
              
              return (
                <div key={attempt.id} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f5f5f5', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{attempt.assessmentTitle}</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>{attempt.courseName}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '11px' }}>
                    {status === 'completed' && <span style={{ color: '#4CAF50' }}>{percentage}% - Completed</span>}
                    {status === 'pending' && <span style={{ color: '#FF9800' }}>Pending Review</span>}
                    {status === 'in-progress' && <span style={{ color: '#2196F3' }}>In Progress</span>}
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: '#666', fontSize: '12px' }}>No assessments attempted yet</p>
          )}
        </div>

        {/* Quick Links */}
        <div style={{ border: '1px solid #ddd', padding: '15px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <Link to="/my-courses">
              <button style={{ width: '100%', padding: '12px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px' }}>
                Browse Courses
              </button>
            </Link>
            <Link to="/attempt-assessment">
              <button style={{ width: '100%', padding: '12px', backgroundColor: '#FF9800', color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px' }}>
                Take Assessment
              </button>
            </Link>
            <Link to="/analytics-student">
              <button style={{ width: '100%', padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px' }}>
                View Progress
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;