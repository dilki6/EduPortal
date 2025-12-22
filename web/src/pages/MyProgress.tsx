import React, { useState, useEffect } from 'react';
import { progressApi, assessmentApi } from '@/lib/api';
import type { CourseProgressDto } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  courseName?: string;
  score: number;
  maxScore: number;
  completedAt?: string;
  status: string;
  resultsReleased?: boolean;
}

interface ProgressData {
  studentId: string;
  studentName: string;
  totalCourses: number;
  completedAssessments: number;
  pendingAssessments: number;
  averageScore: number;
  courseProgress: CourseProgressDto[];
}

const MyProgress: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const [progress, studentAttempts] = await Promise.all([
        progressApi.getStudentProgress(),
        assessmentApi.getStudentAttempts()
      ]);
      
      setProgressData(progress);
      setAttempts(studentAttempts);
    } catch (error: any) {
      console.error('Failed to fetch progress data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load progress data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Loading progress...</div>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <div style={{ border: '1px solid #ddd', padding: '20px', textAlign: 'center', maxWidth: '300px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 10px 0' }}>No Data Available</h3>
          <p style={{ fontSize: '12px', color: '#666', margin: '0' }}>Unable to load your progress information.</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalAssessments: progressData.completedAssessments + progressData.pendingAssessments,
    completedAssessments: progressData.completedAssessments,
    averageScore: Math.round(progressData.averageScore),
    pendingAssessments: progressData.pendingAssessments,
    totalCourses: progressData.totalCourses
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>My Progress</h1>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '12px' }}>Your academic performance</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Average Score</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px' }}>{stats.averageScore}%</div>
          </div>
          <div style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Completed</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px', color: '#4CAF50' }}>{stats.completedAssessments}</div>
          </div>
          <div style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Pending</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px', color: '#FF9800' }}>{stats.pendingAssessments}</div>
          </div>
          <div style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Courses</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px' }}>{stats.totalCourses}</div>
          </div>
        </div>

        {/* Course Progress */}
        <div style={{ border: '1px solid #ddd', marginBottom: '20px', padding: '15px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Course Progress</h2>
          {progressData.courseProgress.length > 0 ? (
            progressData.courseProgress.map((course, idx) => (
              <div key={idx} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <h3 style={{ margin: '0', fontSize: '13px', fontWeight: 'bold' }}>{course.courseName}</h3>
                  <span style={{ fontSize: '11px', color: '#666' }}>{course.progress}% complete</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#ddd', marginBottom: '5px' }}>
                  <div style={{ width: `${course.progress}%`, height: '100%', backgroundColor: '#4CAF50' }}></div>
                </div>
                <div style={{ fontSize: '10px', color: '#999' }}>
                  {course.completedAssessments}/{course.totalAssessments} assessments completed - Avg: {Math.round(course.averageScore || 0)}%
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#666', fontSize: '12px' }}>No course progress available</p>
          )}
        </div>

        {/* Assessment History */}
        <div style={{ border: '1px solid #ddd', padding: '15px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Assessment Results</h2>
          {attempts.filter(a => a.status === 'Completed').length > 0 ? (
            attempts.filter(a => a.status === 'Completed').map((attempt) => (
              <div key={attempt.id} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f5f5f5', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{attempt.assessmentTitle}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>{attempt.courseName}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px' }}>
                  {attempt.resultsReleased ? (
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                        {attempt.score}/{attempt.maxScore} ({Math.round((attempt.score / attempt.maxScore) * 100)}%)
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#FF9800' }}>Results Pending</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#666', fontSize: '12px' }}>No assessment results yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProgress;