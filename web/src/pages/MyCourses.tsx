import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { courseApi, assessmentApi, type Course, type Assessment, type AssessmentAttempt } from '@/lib/api';

interface AssessmentCard {
  assessmentId: string;
  assessmentTitle: string;
  assessmentDescription: string;
  courseId: string;
  courseName: string;
  isCompleted: boolean;
  score?: number;
  maxScore?: number;
  durationMinutes?: number;
  attemptId?: string;
  resultsReleased?: boolean;
}

const MyCourses: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assessmentCards, setAssessmentCards] = useState<AssessmentCard[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessmentsData();
  }, []);

  const fetchAssessmentsData = async () => {
    try {
      setLoading(true);
      const enrolledCourses = await courseApi.getMyEnrolledCourses();
      setCourses(enrolledCourses);
      
      const allAttempts = await assessmentApi.getStudentAttempts();
      const allAssessmentCards: AssessmentCard[] = [];
      
      await Promise.all(
        enrolledCourses.map(async (course) => {
          try {
            const courseAssessments = await assessmentApi.getAllByCourse(course.id);
            const publishedAssessments = courseAssessments.filter(a => a.isPublished);
            
            publishedAssessments.forEach((assessment) => {
              const attempt = allAttempts.find(a => a.assessmentId === assessment.id);
              allAssessmentCards.push({
                assessmentId: assessment.id,
                assessmentTitle: assessment.title,
                assessmentDescription: assessment.description,
                courseId: course.id,
                courseName: course.name,
                isCompleted: !!attempt,
                score: attempt?.score,
                maxScore: attempt?.maxScore,
                durationMinutes: assessment.durationMinutes,
                attemptId: attempt?.id,
                resultsReleased: attempt?.resultsReleased,
              });
            });
          } catch (error) {
            console.error(`Error fetching assessments for course ${course.id}:`, error);
          }
        })
      );
      
      setAssessmentCards(allAssessmentCards);
    } catch (error: any) {
      console.error('Failed to fetch assessments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assessments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = (assessmentId: string) => {
    navigate(`/attempt-assessment/${assessmentId}`);
  };

  const stats = {
    completed: assessmentCards.filter(a => a.isCompleted).length,
    pending: assessmentCards.filter(a => !a.isCompleted).length,
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#718096', fontWeight: '500' }}>Loading your assessments...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', padding: '24px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 4px 0', color: '#0f172a' }}>Assessments</h1>
          <p style={{ color: '#718096', margin: '0', fontSize: '13px' }}>{assessmentCards.length} available</p>
        </div>
        
        {/* Assessments List */}
        {assessmentCards.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assessmentCards.map((card) => (
              <div key={card.assessmentId} style={{
                padding: '12px 0',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 3px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{card.assessmentTitle}</h3>
                    <p style={{ margin: '0', fontSize: '12px', color: '#718096' }}>{card.courseName}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {card.isCompleted && card.resultsReleased && (
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#065f46', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                        {card.score}/{card.maxScore} pts
                      </span>
                    )}
                    <span style={{ fontSize: '12px', fontWeight: '600', color: card.isCompleted ? '#065f46' : '#92400e' }}>
                      {card.isCompleted ? (card.resultsReleased ? '✓ Graded' : '✓ Done') : 'Pending'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#718096' }}>
                    {card.durationMinutes} min • {card.assessmentDescription}
                  </div>
                  <button
                    onClick={() => card.isCompleted && card.attemptId ? navigate(`/review-attempt/${card.attemptId}`) : startAssessment(card.assessmentId)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: card.isCompleted ? (card.resultsReleased ? '#10b981' : '#f59e0b') : '#0066cc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      opacity: 1
                    }}>
                    {card.isCompleted ? (card.resultsReleased ? 'View Results' : 'Submitted') : 'Start'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '20px 0', color: '#718096', fontSize: '13px' }}>
            No assessments available
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;