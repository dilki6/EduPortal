import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { assessmentApi, type Assessment, type Question, type AssessmentAttempt, type SubmitAnswerRequest } from '@/lib/api';

interface Answer {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
}

const AttemptAssessment: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch assessment and start attempt
  useEffect(() => {
    const initializeAttempt = async () => {
      if (!assessmentId) {
        toast({
          title: 'Error',
          description: 'Assessment ID is missing',
          variant: 'destructive'
        });
        navigate('/my-courses');
        return;
      }

      try {
        setLoading(true);

        // First check if student has already attempted this assessment
        const attemptStatus = await assessmentApi.getAttemptStatus(assessmentId);
        
        if (attemptStatus.hasAttempted) {
          const resultsReleased = attemptStatus.attempt?.resultsReleased || false;
          toast({
            title: 'Assessment Already Attempted',
            description: resultsReleased 
              ? 'You have already attempted this assessment. Redirecting to your results...'
              : 'You have already submitted this assessment. Results will be available once released by your instructor.',
            variant: 'default'
          });
          setTimeout(() => {
            if (attemptStatus.attempt) {
              navigate(`/review-attempt/${attemptStatus.attempt.id}`);
            } else {
              navigate('/my-courses');
            }
          }, 2000);
          return;
        }

        // Fetch assessment details
        const assessmentData = await assessmentApi.getById(assessmentId);
        setAssessment(assessmentData);

        // Fetch questions (without answers for students)
        const questionsData = await assessmentApi.getQuestions(assessmentId);
        setQuestions(questionsData);

        // Start the attempt
        const attemptData = await assessmentApi.startAttempt(assessmentId);
        setAttempt(attemptData);

        // Set initial time
        setTimeRemaining(assessmentData.durationMinutes * 60);

        toast({
          title: 'Assessment Started',
          description: `You have ${assessmentData.durationMinutes} minutes to complete this assessment.`
        });

      } catch (error: any) {
        console.error('Failed to initialize assessment:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to start assessment',
          variant: 'destructive'
        });
        navigate('/my-courses');
      } finally {
        setLoading(false);
      }
    };

    initializeAttempt();
  }, [assessmentId, navigate, toast]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !isSubmitted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [timeRemaining, isSubmitted]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, selectedOptionId?: string, textAnswer?: string) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => 
          a.questionId === questionId 
            ? { ...a, selectedOptionId, textAnswer } 
            : a
        );
      }
      return [...prev, { questionId, selectedOptionId, textAnswer }];
    });
  };

  const getAnswer = (questionId: string) => {
    return answers.find(a => a.questionId === questionId);
  };

  const handleSubmit = async () => {
    if (!attempt) {
      toast({
        title: 'Error',
        description: 'No active attempt found',
        variant: 'destructive'
      });
      return;
    }

    // Validate all questions are answered
    const unansweredQuestions = questions.filter(q => {
      const answer = getAnswer(q.id);
      if (q.type === 'MultipleChoice') {
        return !answer?.selectedOptionId;
      } else {
        return !answer?.textAnswer?.trim();
      }
    });

    if (unansweredQuestions.length > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unansweredQuestions.length} unanswered question(s). Do you want to submit anyway?`
      );
      if (!confirmSubmit) return;
    }

    try {
      setSubmitting(true);

      // Prepare answers for ALL questions (not just answered ones)
      const submitAnswers: SubmitAnswerRequest[] = questions.map(question => {
        const answer = answers.find(a => a.questionId === question.id);
        return {
          questionId: question.id,
          selectedOptionId: answer?.selectedOptionId || undefined,
          textAnswer: answer?.textAnswer || undefined
        };
      });

      console.log('📤 Submitting answers:', submitAnswers);

      // Submit the assessment
      const result = await assessmentApi.submitAnswers(attempt.id, submitAnswers);
      
      setIsSubmitted(true);

      toast({
        title: 'Assessment Submitted',
        description: 'Your assessment has been submitted successfully!',
      });

      // Navigate to results or my courses
      setTimeout(() => {
        navigate('/my-progress');
      }, 2000);

    } catch (error: any) {
      console.error('Failed to submit assessment:', error);
      toast({
        title: 'Submission Error',
        description: error.message || 'Failed to submit assessment',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Loading state
  if (loading || !assessment || !currentQuestion) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#718096', marginBottom: '12px' }}>Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Submitted state
  if (isSubmitted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', padding: '24px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ padding: '40px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', margin: '0 0 8px 0' }}>Assessment Submitted!</h2>
            <p style={{ color: '#718096', margin: '0 0 16px 0', fontSize: '14px' }}>Your responses have been submitted successfully</p>
            <p style={{ color: '#718096', margin: '0 0 20px 0', fontSize: '13px' }}>
              Text answers will be reviewed by your instructor. You can view your results in the Progress section.
            </p>
            <button
              onClick={() => navigate('/my-progress')}
              style={{
                padding: '10px 24px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              View My Progress
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', padding: '24px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '24px', backgroundColor: '#f8f9fa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0', color: '#0f172a' }}>{assessment.title}</h1>
              <p style={{ fontSize: '13px', color: '#718096', margin: '4px 0 0 0' }}>{assessment.courseName || assessment.description}</p>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 4px 0' }}>Time Remaining</p>
                <p style={{ fontSize: '18px', fontWeight: '700', margin: '0', color: timeRemaining < 300 ? '#e53e3e' : '#0f172a' }}>
                  {formatTime(timeRemaining)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 4px 0' }}>Progress</p>
                <p style={{ fontSize: '13px', fontWeight: '600', margin: '0', color: '#0f172a' }}>
                  Q {currentQuestionIndex + 1} / {questions.length}
                </p>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '3px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#0066cc', transition: 'width 0.3s ease' }}></div>
          </div>
        </div>

        {/* Instructions */}
        {currentQuestionIndex === 0 && (
          <div style={{ padding: '16px', border: '1px solid #dbeafe', borderRadius: '8px', marginBottom: '24px', backgroundColor: '#f0f9ff' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 8px 0', color: '#0f172a' }}>Instructions</h3>
            <p style={{ fontSize: '13px', color: '#718096', margin: '0', lineHeight: '1.5' }}>
              Read each question carefully. For multiple choice questions, select the best answer. 
              For text questions, provide detailed explanations. You can navigate between questions 
              using the Previous/Next buttons or by clicking the question numbers below.
            </p>
          </div>
        )}

        {/* Current Question */}
        <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '24px', backgroundColor: '#ffffff' }}>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0', color: '#0f172a' }}>
                Question {currentQuestionIndex + 1}
              </h2>
              <p style={{ fontSize: '14px', color: '#0f172a', margin: '0', lineHeight: '1.6' }}>
                {currentQuestion.text}
              </p>
            </div>
            <span style={{ padding: '4px 12px', backgroundColor: '#f3f4f6', color: '#0f172a', borderRadius: '4px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
              {currentQuestion.points} points
            </span>
          </div>

          <div style={{ marginTop: '20px' }}>
            {currentQuestion.type === 'MultipleChoice' && currentQuestion.options && currentQuestion.options.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentQuestion.options.map((option, index) => {
                  const isSelected = getAnswer(currentQuestion.id)?.selectedOptionId === option.id;
                  return (
                    <label
                      key={option.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        border: `2px solid ${isSelected ? '#0066cc' : '#e2e8f0'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option.id}
                        checked={isSelected}
                        onChange={() => handleAnswerChange(currentQuestion.id, option.id, undefined)}
                        style={{ marginTop: '4px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: '600', marginRight: '8px', color: '#0f172a' }}>
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span style={{ color: '#0f172a', fontSize: '14px' }}>{option.text}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#0f172a' }}>
                  Your Answer:
                </label>
                <textarea
                  placeholder="Type your detailed answer here..."
                  value={getAnswer(currentQuestion.id)?.textAnswer || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, undefined, e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Question Navigation */}
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a', margin: '0 0 12px 0' }}>Questions</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {questions.map((q, index) => {
              const hasAnswer = getAnswer(q.id);
              const isAnswered = q.type === 'MultipleChoice' 
                ? !!hasAnswer?.selectedOptionId 
                : !!hasAnswer?.textAnswer?.trim();
              const isCurrent = index === currentQuestionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: `2px solid ${isCurrent ? '#0066cc' : isAnswered ? '#10b981' : '#e2e8f0'}`,
                    backgroundColor: isCurrent ? '#0066cc' : isAnswered ? '#f0fdf4' : '#ffffff',
                    color: isCurrent ? 'white' : '#0f172a',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            style={{
              padding: '10px 24px',
              backgroundColor: currentQuestionIndex === 0 ? '#f3f4f6' : '#ffffff',
              color: currentQuestionIndex === 0 ? '#d1d5db' : '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            Previous
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '10px 32px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: submitting ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              style={{
                padding: '10px 24px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttemptAssessment;