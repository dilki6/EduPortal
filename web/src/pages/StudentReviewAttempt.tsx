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

        // Fetch answers
        const answersData = await assessmentApi.getAttemptAnswers(attemptId);
        console.log('📝 Answers data:', answersData);
        console.log('📝 Number of answers:', answersData.length);
        setAnswers(answersData);

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

        {/* Header Card */}
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
            answers.map((answer, index) => (
            <Card key={answer.id} className={`border-l-4 ${answer.isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Badge variant="outline" className="shrink-0">Q{index + 1}</Badge>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{answer.questionText}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={answer.questionType === 'MultipleChoice' ? 'default' : 'secondary'} className="text-xs">
                          {answer.questionType === 'MultipleChoice' ? 'Multiple Choice' : 'Text Answer'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {answer.questionPoints} points
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {answer.isCorrect ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Correct
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Incorrect
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {answer.pointsEarned ?? 0}/{answer.questionPoints}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Multiple Choice Answer */}
                {answer.questionType === 'MultipleChoice' && answer.questionOptions && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Options:</p>
                    {answer.questionOptions.map((option, optIndex) => {
                      const isSelected = option.id === answer.selectedOptionId;
                      const isCorrect = option.isCorrect;
                      
                      return (
                        <div
                          key={option.id}
                          className={`flex items-start gap-2 p-3 rounded-lg border ${
                            isCorrect 
                              ? 'bg-green-50 border-green-200' 
                              : isSelected 
                                ? 'bg-red-50 border-red-200' 
                                : 'bg-background'
                          }`}
                        >
                          <span className="font-medium text-sm shrink-0">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          <span className={`flex-1 text-sm ${isCorrect ? 'text-green-900 font-medium' : isSelected ? 'text-red-900' : ''}`}>
                            {option.text}
                          </span>
                          {isSelected && (
                            <Badge variant="outline" className="shrink-0 text-xs">
                              Your Answer
                            </Badge>
                          )}
                          {isCorrect && (
                            <Badge variant="outline" className="shrink-0 text-xs bg-green-100 text-green-700 border-green-300">
                              Correct Answer
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Text Answer */}
                {answer.questionType !== 'MultipleChoice' && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Your Answer:</p>
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <p className="text-sm whitespace-pre-wrap">
                          {answer.textAnswer || <span className="italic text-muted-foreground">No answer provided</span>}
                        </p>
                      </div>
                    </div>
                    
                    {answer.expectedAnswer && (
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-2">Model Answer:</p>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-900 whitespace-pre-wrap">{answer.expectedAnswer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Points Breakdown */}
                {answer.pointsEarned !== null && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Points Earned:</span>
                      <span className="font-semibold">
                        {answer.pointsEarned} / {answer.questionPoints} points
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            ))
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
      </div>
    </div>
  );
};

export default StudentReviewAttempt;
