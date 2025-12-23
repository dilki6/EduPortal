import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { courseApi, assessmentApi, type Course, type Assessment, type AssessmentAttempt, type Answer } from '@/lib/api';

const ReviewAnswers: React.FC = () => {
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [answersMap, setAnswersMap] = useState<Map<string, Answer[]>>(new Map());
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [loadingAnswers, setLoadingAnswers] = useState<Set<string>>(new Set());
  const [evaluatingAnswers, setEvaluatingAnswers] = useState<Set<string>>(new Set());
  const [evaluatingAll, setEvaluatingAll] = useState(false);
  const [manualScores, setManualScores] = useState<Map<string, number>>(new Map());
  const [savingScores, setSavingScores] = useState(false);
  const [evaluatedAnswers, setEvaluatedAnswers] = useState<Set<string>>(new Set());

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch assessments when course is selected
  useEffect(() => {
    if (selectedCourse) {
      fetchAssessments(selectedCourse);
      setSelectedAssessment('');
      setAttempts([]);
      setAnswersMap(new Map());
      setEvaluatedAnswers(new Set());
    }
  }, [selectedCourse]);

  // Fetch attempts when assessment is selected
  useEffect(() => {
    if (selectedAssessment) {
      fetchAttempts(selectedAssessment);
      setAnswersMap(new Map());
      setExpandedStudents(new Set());
      setEvaluatedAnswers(new Set());
    }
  }, [selectedAssessment]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const data = await courseApi.getMyTeachingCourses();
      setCourses(data);
    } catch (error: any) {
      console.error('Failed to fetch courses:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load courses',
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchAssessments = async (courseId: string) => {
    try {
      setLoadingAssessments(true);
      const data = await assessmentApi.getAllByCourse(courseId);
      // Only show published assessments
      setAssessments(data.filter(a => a.isPublished));
    } catch (error: any) {
      console.error('Failed to fetch assessments:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load assessments',
        variant: 'destructive',
      });
    } finally {
      setLoadingAssessments(false);
    }
  };

  const fetchAttempts = async (assessmentId: string) => {
    try {
      setLoadingAttempts(true);
      const data = await assessmentApi.getAssessmentAttempts(assessmentId);
      // Only show completed attempts (status could be string or enum)
      setAttempts(data.filter(a => 
        a.status === 'Completed' || 
        a.status === 1 || 
        (a.completedAt !== null && a.completedAt !== undefined)
      ));
    } catch (error: any) {
      console.error('Failed to fetch attempts:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load student attempts',
        variant: 'destructive',
      });
    } finally {
      setLoadingAttempts(false);
    }
  };

  const fetchAnswersForAttempt = async (attemptId: string) => {
    if (answersMap.has(attemptId)) return; // Already loaded

    try {
      setLoadingAnswers(prev => new Set(prev).add(attemptId));
      const answers = await assessmentApi.getAttemptAnswers(attemptId);
      setAnswersMap(prev => new Map(prev).set(attemptId, answers));
    } catch (error: any) {
      console.error('Failed to fetch answers:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load answers',
        variant: 'destructive',
      });
    } finally {
      setLoadingAnswers(prev => {
        const newSet = new Set(prev);
        newSet.delete(attemptId);
        return newSet;
      });
    }
  };

  const toggleExpanded = async (attemptId: string) => {
    const isExpanded = expandedStudents.has(attemptId);
    
    if (!isExpanded) {
      // Expanding - fetch answers if not already loaded
      await fetchAnswersForAttempt(attemptId);
    }
    
    setExpandedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(attemptId)) {
        newSet.delete(attemptId);
      } else {
        newSet.add(attemptId);
      }
      return newSet;
    });
  };

  const getEvaluationIcon = (isCorrect: boolean, pointsEarned: number, maxPoints: number) => {
    if (isCorrect || pointsEarned === maxPoints) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (pointsEarned > 0) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getEvaluationColor = (isCorrect: boolean, pointsEarned: number, maxPoints: number, questionType: string) => {
    const isTextQuestion = questionType !== 'MultipleChoice' && questionType !== 'TrueFalse';
    
    // For text questions with no points earned yet (not graded)
    if (isTextQuestion && pointsEarned === 0 && maxPoints > 0) {
      return 'bg-blue-50 border-blue-200'; // Blue for ungraded text questions
    }
    
    if (isCorrect || pointsEarned === maxPoints) {
      return 'bg-green-50 border-green-200';
    } else if (pointsEarned > 0) {
      return 'bg-yellow-50 border-yellow-200';
    } else {
      return 'bg-red-50 border-red-200';
    }
  };

  const evaluateWithAI = async (answer: Answer) => {
    try {
      const result = await assessmentApi.evaluateAnswer({
        question: answer.questionText,
        expectedAnswer: answer.expectedAnswer || undefined,
        studentAnswer: answer.textAnswer || '',
        maxPoints: answer.questionPoints,
      });
      
      return result.suggestedScore;
    } catch (error) {
      console.error('AI evaluation failed, using fallback:', error);
      
      // Fallback to simple keyword matching if API fails
      const studentAnswer = answer.textAnswer?.toLowerCase() || '';
      const expectedAnswer = answer.expectedAnswer?.toLowerCase() || '';
      
      if (!studentAnswer || !expectedAnswer) {
        return 0;
      }

      const expectedWords = expectedAnswer.split(/\s+/).filter(w => w.length > 3);
      const studentWords = studentAnswer.split(/\s+/);
      
      let matchCount = 0;
      expectedWords.forEach(word => {
        if (studentWords.some(sw => sw.includes(word) || word.includes(sw))) {
          matchCount++;
        }
      });

      const matchPercentage = expectedWords.length > 0 ? matchCount / expectedWords.length : 0;
      const score = Math.round(matchPercentage * answer.questionPoints);
      
      return Math.min(score, answer.questionPoints);
    }
  };

  const handleEvaluateSingle = async (answerId: string, answer: Answer) => {
    try {
      setEvaluatingAnswers(prev => new Set(prev).add(answerId));
      
      const aiScore = await evaluateWithAI(answer);
      
      setManualScores(prev => new Map(prev).set(answerId, aiScore));
      
      // Mark this answer as evaluated
      setEvaluatedAnswers(prev => new Set(prev).add(answerId));
      
      toast({
        title: 'AI Evaluation Complete',
        description: `Suggested score: ${aiScore}/${answer.questionPoints} points`,
      });
    } catch (error) {
      console.error('Failed to evaluate answer:', error);
      toast({
        title: 'Evaluation Failed',
        description: 'Failed to evaluate with AI. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setEvaluatingAnswers(prev => {
        const newSet = new Set(prev);
        newSet.delete(answerId);
        return newSet;
      });
    }
  };

  const handleEvaluateAll = async () => {
    try {
      setEvaluatingAll(true);
      
      const allTextAnswers: Array<{ answerId: string; answer: Answer }> = [];
      
      // Collect all text-based answers from all expanded attempts
      expandedStudents.forEach(attemptId => {
        const answers = answersMap.get(attemptId) || [];
        answers.forEach(answer => {
          const isTextQuestion = answer.questionType !== 'MultipleChoice' && answer.questionType !== 'TrueFalse';
          // Skip already-evaluated answers
          if (isTextQuestion && !evaluatedAnswers.has(answer.id)) {
            allTextAnswers.push({ answerId: answer.id, answer });
          }
        });
      });

      if (allTextAnswers.length === 0) {
        toast({
          title: 'No Unevaluated Answers',
          description: 'All text-based answers have already been evaluated.',
          variant: 'default',
        });
        return;
      }

      // Evaluate all in parallel
      const evaluations = await Promise.all(
        allTextAnswers.map(async ({ answerId, answer }) => {
          const score = await evaluateWithAI(answer);
          return { answerId, score };
        })
      );

      // Update all scores
      const newScores = new Map(manualScores);
      const newEvaluated = new Set(evaluatedAnswers);
      evaluations.forEach(({ answerId, score }) => {
        newScores.set(answerId, score);
        newEvaluated.add(answerId);
      });
      setManualScores(newScores);
      setEvaluatedAnswers(newEvaluated);

      toast({
        title: 'Bulk Evaluation Complete',
        description: `Evaluated ${allTextAnswers.length} text answer(s) with AI`,
      });
    } catch (error) {
      console.error('Failed to evaluate all answers:', error);
      toast({
        title: 'Bulk Evaluation Failed',
        description: 'Failed to evaluate answers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setEvaluatingAll(false);
    }
  };

  const handleManualScoreChange = (answerId: string, value: string, maxPoints: number, originalScore: number) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= maxPoints) {
      // Only track as modified if different from original
      if (numValue !== originalScore) {
        setManualScores(prev => new Map(prev).set(answerId, numValue));
      } else {
        // Remove from modified scores if reverted to original
        setManualScores(prev => {
          const newMap = new Map(prev);
          newMap.delete(answerId);
          return newMap;
        });
      }
    }
  };

  const handleSaveScores = async () => {
    if (manualScores.size === 0) {
      toast({
        title: 'No Changes',
        description: 'No scores have been modified.',
        variant: 'default',
      });
      return;
    }

    try {
      setSavingScores(true);

      const savePromises = Array.from(manualScores.entries()).map(([answerId, score]) =>
        assessmentApi.updateAnswerScore(answerId, score)
      );

      await Promise.all(savePromises);

      toast({
        title: 'Scores Saved',
        description: `Successfully updated ${manualScores.size} score(s)`,
      });

      // Clear manual scores after saving (they're now persisted in DB)
      setManualScores(new Map());
      // Clear evaluated state to allow re-evaluation after saving
      setEvaluatedAnswers(new Set());

      // Refresh the attempts list to show updated total scores
      if (selectedAssessment) {
        const attempts = await assessmentApi.getAssessmentAttempts(selectedAssessment);
        setAttempts(attempts);
        
        // Reload answers for expanded students to get fresh data from database
        const answersToReload = Array.from(expandedStudents);
        const updatedAnswersMap = new Map(answersMap);
        
        for (const attemptId of answersToReload) {
          const answers = await assessmentApi.getAttemptAnswers(attemptId);
          updatedAnswersMap.set(attemptId, answers);
        }
        
        setAnswersMap(updatedAnswersMap);
      }
    } catch (error) {
      console.error('Failed to save scores:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save scores. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingScores(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', padding: '24px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 4px 0', color: '#0f172a' }}>Review Answers</h1>
            <p style={{ color: '#718096', margin: '0', fontSize: '13px' }}>Evaluate and provide feedback on submissions</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSaveScores}
              disabled={savingScores || manualScores.size === 0 || !selectedAssessment}
              style={{
                padding: '8px 14px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                opacity: savingScores || manualScores.size === 0 || !selectedAssessment ? 0.6 : 1
              }}
            >
              {savingScores ? 'Saving...' : `Save (${manualScores.size})`}
            </button>
            <button
              onClick={handleEvaluateAll}
              disabled={evaluatingAll || expandedStudents.size === 0 || !selectedAssessment}
              style={{
                padding: '8px 14px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                opacity: evaluatingAll || expandedStudents.size === 0 || !selectedAssessment ? 0.6 : 1
              }}
            >
              {evaluatingAll ? 'Evaluating...' : 'AI Evaluate All'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#0f172a' }}>Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              disabled={loadingCourses}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '13px',
                fontFamily: 'inherit',
                cursor: 'pointer'
              }}
            >
              <option value="">{loadingCourses ? 'Loading...' : 'Choose a course'}</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#0f172a' }}>Select Assessment</label>
            <select
              value={selectedAssessment}
              onChange={(e) => setSelectedAssessment(e.target.value)}
              disabled={!selectedCourse || loadingAssessments}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '13px',
                fontFamily: 'inherit',
                cursor: 'pointer'
              }}
            >
              <option value="">{loadingAssessments ? 'Loading...' : 'Choose an assessment'}</option>
              {assessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loadingAttempts && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#718096', fontSize: '14px' }}>
            Loading submissions...
          </div>
        )}

        {/* Submissions */}
        {!loadingAttempts && selectedAssessment && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 14px 0', color: '#0f172a' }}>Student Submissions</h2>
            
            {attempts.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#718096', fontSize: '13px' }}>
                No submissions found for this assessment.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {attempts.map((attempt) => {
                  const isExpanded = expandedStudents.has(attempt.id);
                  const answers = answersMap.get(attempt.id) || [];

                  return (
                    <div key={attempt.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <div
                        onClick={() => toggleExpanded(attempt.id)}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: isExpanded ? '#f8f9fa' : 'transparent'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{attempt.studentName}</h3>
                          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#718096' }}>
                            Score: {attempt.score ?? 0}/{attempt.maxScore ?? 0} • Submitted {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span style={{ fontSize: '20px', color: '#718096' }}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </div>

                      {isExpanded && answers.length > 0 && (
                        <div style={{ padding: '12px 0', borderTop: '1px solid #e2e8f0' }}>
                          {answers.map((answer, index) => {
                            const isMCQ = answer.questionType === 'MultipleChoice' || answer.questionType === 'TrueFalse';
                            const pointsEarned = answer.pointsEarned ?? 0;
                            const isCorrect = pointsEarned === answer.questionPoints;
                            const isPartial = pointsEarned > 0 && !isCorrect;

                            const bgColor = isCorrect ? '#f0fdf4' : isPartial ? '#fefce8' : '#fef2f2';
                            const borderColor = isCorrect ? '#86efac' : isPartial ? '#fde047' : '#fca5a5';

                            return (
                              <div
                                key={answer.id}
                                style={{
                                  padding: '14px',
                                  marginBottom: '12px',
                                  backgroundColor: bgColor,
                                  borderLeft: `4px solid ${borderColor}`,
                                  borderRadius: '6px',
                                  border: `1px solid ${borderColor}`
                                }}
                              >
                                {/* Question Number & Type */}
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'start',
                                  marginBottom: '10px'
                                }}>
                                  <h4 style={{ margin: '0', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                                    Question {index + 1}: {answer.questionText}
                                  </h4>
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    backgroundColor: isCorrect ? '#dbeafe' : isPartial ? '#fef3c7' : '#fee2e2',
                                    color: isCorrect ? '#0369a1' : isPartial ? '#92400e' : '#991b1b'
                                  }}>
                                    {isCorrect ? '✓ Correct' : isPartial ? '◐ Partial' : '✗ Incorrect'}
                                  </span>
                                </div>

                                {/* Student Answer */}
                                <div style={{ marginBottom: '8px' }}>
                                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Answer:</p>
                                  <p style={{ margin: '0', fontSize: '13px', color: '#0f172a', padding: '8px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                                    {isMCQ ? answer.selectedOptionText : answer.textAnswer}
                                  </p>
                                </div>

                                {/* Correct Answer for MCQ */}
                                {isMCQ && answer.questionOptions && (
                                  <div style={{ marginBottom: '8px' }}>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: '600', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✓ Correct Answer:</p>
                                    <p style={{ margin: '0', fontSize: '13px', color: '#15803d', padding: '8px', backgroundColor: '#f0fdf4', borderRadius: '4px', border: '1px solid #86efac' }}>
                                      {answer.questionOptions.find(opt => opt.isCorrect)?.text || 'Not specified'}
                                    </p>
                                  </div>
                                )}

                                {/* Expected Answer for Text */}
                                {!isMCQ && answer.expectedAnswer && (
                                  <div style={{ marginBottom: '8px' }}>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expected Answer:</p>
                                    <p style={{ margin: '0', fontSize: '13px', color: '#0f172a', padding: '8px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                                      {answer.expectedAnswer}
                                    </p>
                                  </div>
                                )}

                                {/* Score and AI Evaluation */}
                                {!isMCQ && (
                                  <div style={{
                                    marginTop: '10px',
                                    paddingTop: '10px',
                                    borderTop: `1px solid ${borderColor}`,
                                    display: 'flex',
                                    gap: '10px',
                                    alignItems: 'center'
                                  }}>
                                    <div style={{ flex: 1 }}>
                                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#718096', display: 'block', marginBottom: '4px' }}>Points Earned:</label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={answer.questionPoints}
                                        step={0.5}
                                        value={manualScores.get(answer.id) ?? pointsEarned}
                                        onChange={(e) => handleManualScoreChange(answer.id, e.target.value, answer.questionPoints, pointsEarned)}
                                        style={{
                                          padding: '6px 8px',
                                          border: '1px solid #e2e8f0',
                                          borderRadius: '4px',
                                          fontSize: '13px',
                                          width: '60px',
                                          fontWeight: '600',
                                          color: '#0f172a'
                                        }}
                                      />
                                      <span style={{ fontSize: '11px', color: '#718096', marginLeft: '6px', fontWeight: '500' }}>/ {answer.questionPoints}</span>
                                    </div>
                                    <button
                                      onClick={() => handleEvaluateSingle(answer.id, answer)}
                                      disabled={evaluatingAnswers.has(answer.id) || evaluatedAnswers.has(answer.id)}
                                      style={{
                                        padding: '6px 12px',
                                        backgroundColor: evaluatedAnswers.has(answer.id) ? '#10b981' : '#0066cc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        opacity: evaluatingAnswers.has(answer.id) || evaluatedAnswers.has(answer.id) ? 0.6 : 1
                                      }}
                                    >
                                      {evaluatingAnswers.has(answer.id) ? 'AI...' : evaluatedAnswers.has(answer.id) ? 'Done' : 'AI Eval'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewAnswers;