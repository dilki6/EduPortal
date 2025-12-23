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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#718096', fontWeight: '500' }}>Loading your progress...</div>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', maxWidth: '400px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0', color: '#0f172a' }}>No Data Available</h3>
          <p style={{ fontSize: '14px', color: '#718096', margin: '0' }}>Unable to load your progress information. Try again later.</p>
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
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', padding: '24px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 4px 0', color: '#0f172a' }}>Progress</h1>
          <p style={{ color: '#718096', margin: '0', fontSize: '13px' }}>Your learning overview</p>
        </div>

        {/* Course Progress */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 14px 0', color: '#0f172a' }}>Courses</h2>
          {progressData.courseProgress.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {progressData.courseProgress.map((course, idx) => (
                <div key={idx} style={{
                  padding: '10px 0',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{course.courseName}</div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#0066cc' }}>{Math.round(course.progress)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '3px', backgroundColor: '#e2e8f0', borderRadius: '1px', overflow: 'hidden' }}>
                    <div style={{ width: `${course.progress}%`, height: '100%', backgroundColor: '#0066cc' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#718096', padding: '10px 0' }}>
              No course progress data
            </div>
          )}
        </div>

        {/* Assessment Results */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 14px 0', color: '#0f172a' }}>Assessments</h2>
          {attempts.filter(a => a.status === 'Completed').length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {attempts.filter(a => a.status === 'Completed').map((attempt) => {
                const score = Math.round((attempt.score / attempt.maxScore) * 100);
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
                      <div style={{ fontSize: '11px', color: '#718096', marginTop: '1px' }}>{attempt.courseName}</div>
                    </div>
                    {attempt.resultsReleased ? (
                      <div style={{ fontSize: '13px', fontWeight: '700', color: score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#e53e3e' }}>
                        {score}%
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#718096' }}>Pending</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#718096', padding: '10px 0' }}>
              No completed assessments yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProgress;