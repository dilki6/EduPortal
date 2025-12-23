import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, CheckCircle, XCircle, Clock, Trophy, ArrowLeft, Loader2, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { assessmentApi, type AssessmentAttempt, type Answer } from '@/lib/api';

const StudentReviewAttempt: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttemptData = async () => {
      if (!attemptId) {
        toast({
          title: 'Error',
          description: 'Attempt ID is missing',
          variant: 'destructive'
        });
        navigate('/my-courses');
        return;
      }

      try {
        setLoading(true);

        // Fetch attempt details
        const attemptData = await assessmentApi.getAttempt(attemptId);
        console.log('📊 Attempt data:', attemptData);
        setAttempt(attemptData);

        // Only fetch answers if results are released
        if (attemptData.resultsReleased) {
          const answersData = await assessmentApi.getAttemptAnswers(attemptId);
          console.log('📝 Answers data:', answersData);
          console.log('📝 Number of answers:', answersData.length);
          setAnswers(answersData);
        } else {
          console.log('⏳ Results not released yet, skipping answers fetch');
        }

      } catch (error: any) {
        console.error('❌ Failed to fetch attempt data:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load attempt details',
          variant: 'destructive'
        });
        navigate('/my-courses');
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptData();
  }, [attemptId, navigate, toast]);

  if (loading || !attempt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading assessment results...</p>
        </div>
      </div>
    );
  }

  const totalScore = attempt.score ?? 0;
  const maxScore = attempt.maxScore ?? 0;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const correctAnswers = answers.filter(a => a.isCorrect).length;

  // Check if results are released
  const resultsReleased = attempt.resultsReleased ?? false;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate('/my-courses')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Courses
        </Button>

        {/* Results Not Released Message */}
        {!resultsReleased && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-orange-600" />
                <div>
                  <CardTitle className="text-orange-900">Assessment Submitted</CardTitle>
                  <CardDescription className="text-orange-700">
                    Your assessment has been submitted successfully. Results will be available once your instructor releases them.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-orange-800">
                  <strong>Assessment:</strong> {attempt.assessmentTitle}
                </p>
                <p className="text-sm text-orange-800">
                  <strong>Submitted:</strong> {new Date(attempt.completedAt!).toLocaleString()}
                </p>
                <p className="text-sm text-orange-800 mt-4">
                  You will be able to view your score and review your answers once the instructor releases the results.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header Card - Only show if results are released */}
        {resultsReleased && (
          <>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{attempt.assessmentTitle}</CardTitle>
                <CardDescription className="mt-2">
                  Submitted on {new Date(attempt.completedAt!).toLocaleString()}
                </CardDescription>
              </div>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Score Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <h3 className="font-medium text-primary">Score</h3>
                </div>
                <p className="text-2xl font-bold">{totalScore}/{maxScore}</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green/10 to-green/5 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-green-700">Percentage</h3>
                </div>
                <p className="text-2xl font-bold text-green-600">{percentage}%</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue/10 to-blue/5 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-700">Questions</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600">{answers.length}</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple/10 to-purple/5 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  <h3 className="font-medium text-purple-700">Correct</h3>
                </div>
                <p className="text-2xl font-bold text-purple-600">{correctAnswers}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your Performance</span>
                <span className="font-medium">{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Answers Review */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Answers</h2>
          
          {answers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No answers found for this attempt.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This might indicate that the assessment was not completed or answers were not saved properly.
                </p>
              </CardContent>
            </Card>
          ) : (
            answers.map((answer, index) => {
              const isMCQ = answer.questionType === 'MultipleChoice' || answer.questionType === 'TrueFalse';
              const isCorrect = answer.isCorrect;
              const bgColor = isCorrect ? '#f0fdf4' : '#fef2f2';
              const borderColor = isCorrect ? '#86efac' : '#fca5a5';

              return (
              <div
                key={answer.id}
                style={{
                  background: 'white',
                  border: `2px solid ${borderColor}`,
                  borderLeft: `4px solid ${borderColor}`,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Question Header */}
                <div style={{
                  padding: '16px',
                  background: bgColor,
                  borderBottom: `1px solid ${borderColor}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  gap: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        background: isCorrect ? '#10b981' : '#ef4444',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        Q{index + 1}
                      </span>
                      <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                        {answer.questionText}
                      </h3>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: isCorrect ? '#dbeafe' : '#fee2e2',
                      color: isCorrect ? '#0369a1' : '#991b1b'
                    }}>
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: '#f0f1f3',
                      color: '#0f172a'
                    }}>
                      {answer.pointsEarned ?? 0}/{answer.questionPoints} pts
                    </span>
                  </div>
                </div>

                {/* Question Content */}
                <div style={{ padding: '16px' }}>
                  {/* Multiple Choice Answer */}
                  {isMCQ && answer.questionOptions && (
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>All Options:</p>
                      {answer.questionOptions.map((option, optIndex) => {
                        const isSelected = option.id === answer.selectedOptionId;
                        const isCorrectOption = option.isCorrect;

                        return (
                          <div
                            key={option.id}
                            style={{
                              padding: '10px 12px',
                              marginBottom: '8px',
                              borderRadius: '6px',
                              border: `1px solid ${isCorrectOption ? '#10b981' : isSelected ? '#ef4444' : '#e2e8f0'}`,
                              background: isCorrectOption ? '#f0fdf4' : isSelected ? '#fef2f2' : '#f8fafc'
                            }}
                          >
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'start' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#718096', minWidth: '24px' }}>
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              <div style={{ flex: 1 }}>
                                <p style={{
                                  margin: '0',
                                  fontSize: '13px',
                                  color: isCorrectOption ? '#15803d' : isSelected ? '#7f1d1d' : '#0f172a',
                                  fontWeight: isCorrectOption || isSelected ? '600' : '400'
                                }}>
                                  {option.text}
                                </p>
                              </div>
                              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                {isSelected && !isCorrectOption && (
                                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '3px', background: '#fee2e2', color: '#991b1b', fontWeight: '600' }}>Your Answer</span>
                                )}
                                {isCorrectOption && (
                                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '3px', background: '#dcfce7', color: '#15803d', fontWeight: '600' }}>✓ Correct Answer</span>
                                )}
                                {isSelected && isCorrectOption && (
                                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '3px', background: '#dcfce7', color: '#15803d', fontWeight: '600' }}>✓ Your Answer</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Text Answer */}
                  {!isMCQ && (
                    <div>
                      <div style={{ marginBottom: '14px' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Answer:</p>
                        <div style={{
                          padding: '12px',
                          background: '#f8fafc',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <p style={{
                            margin: '0',
                            fontSize: '13px',
                            color: '#0f172a',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}>
                            {answer.textAnswer || <span style={{ fontStyle: 'italic', color: '#718096' }}>No answer provided</span>}
                          </p>
                        </div>
                      </div>

                      {answer.expectedAnswer && (
                        <div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✓ Model Answer:</p>
                          <div style={{
                            padding: '12px',
                            background: '#f0fdf4',
                            borderRadius: '6px',
                            border: '1px solid #86efac'
                          }}>
                            <p style={{
                              margin: '0',
                              fontSize: '13px',
                              color: '#15803d',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word'
                            }}>
                              {answer.expectedAnswer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-center pt-6">
          <Button
            onClick={() => navigate('/my-courses')}
            variant="outline"
            size="lg"
          >
            Return to My Courses
          </Button>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default StudentReviewAttempt;
