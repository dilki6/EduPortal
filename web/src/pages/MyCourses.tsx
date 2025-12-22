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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Loading assessments...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>My Courses & Assessments</h1>
        
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Assessments</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px' }}>{assessmentCards.length}</div>
          </div>
          <div style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Completed</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px', color: '#4CAF50' }}>{stats.completed}</div>
          </div>
          <div style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Pending</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px', color: '#FF9800' }}>{stats.pending}</div>
          </div>
        </div>

        {/* Assessments List */}
        <div style={{ border: '1px solid #ddd', padding: '15px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>Available Assessments</h2>
          {assessmentCards.length > 0 ? (
            assessmentCards.map((card) => (
              <div key={card.assessmentId} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee', backgroundColor: '#f5f5f5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ margin: '0', fontSize: '13px', fontWeight: 'bold' }}>{card.assessmentTitle}</h3>
                    <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#666' }}>Course: {card.courseName}</p>
                    <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#666' }}>{card.assessmentDescription}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {card.isCompleted && (
                      <span style={{ fontSize: '11px', color: '#4CAF50', fontWeight: 'bold' }}>✓ Completed</span>
                    )}
                    {!card.isCompleted && (
                      <span style={{ fontSize: '11px', color: '#FF9800', fontWeight: 'bold' }}>⏳ Pending</span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: '#999', marginBottom: '8px' }}>
                  Duration: {card.durationMinutes} minutes
                </div>
                <button
                  onClick={() => startAssessment(card.assessmentId)}
                  disabled={card.isCompleted}
                  style={{ padding: '6px 12px', backgroundColor: card.isCompleted ? '#ddd' : '#2196F3', color: card.isCompleted ? '#666' : 'white', border: 'none', cursor: card.isCompleted ? 'not-allowed' : 'pointer', fontSize: '11px' }}
                >
                  {card.isCompleted ? 'Completed' : 'Start Assessment'}
                </button>
              </div>
            ))
          ) : (
            <p style={{ color: '#666', fontSize: '12px' }}>No assessments available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCourses;