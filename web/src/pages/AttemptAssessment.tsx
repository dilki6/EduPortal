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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Submitted state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Assessment Submitted!</CardTitle>
              <CardDescription>
                Your responses have been submitted successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Your assessment has been submitted for grading.
                </p>
                <p className="text-sm text-muted-foreground">
                  Text answers will be reviewed by your instructor. You can view your results in the Progress section.
                </p>
              </div>
              
              <Button onClick={() => navigate('/my-progress')} className="w-full">
                View My Progress
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{assessment.title}</CardTitle>
                <CardDescription>{assessment.courseName || assessment.description}</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className={`font-mono font-semibold ${timeRemaining < 300 ? 'text-red-500' : ''}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <Badge variant="outline">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Instructions (show only for first question) */}
        {currentQuestionIndex === 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Read each question carefully. For multiple choice questions, select the best answer. 
                For text questions, provide detailed explanations. You can navigate between questions 
                using the Previous/Next buttons or by clicking the question numbers below.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Current Question */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <FileText className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="flex-1">
                  <CardTitle className="text-lg">Question {currentQuestionIndex + 1}</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {currentQuestion.text}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0">{currentQuestion.points} points</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion.type === 'MultipleChoice' && currentQuestion.options && currentQuestion.options.length > 0 ? (
              <RadioGroup
                value={getAnswer(currentQuestion.id)?.selectedOptionId || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value, undefined)}
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={option.id} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                    <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer">
                      <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="text-answer">Your Answer:</Label>
                <Textarea
                  id="text-answer"
                  placeholder="Type your detailed answer here..."
                  value={getAnswer(currentQuestion.id)?.textAnswer || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, undefined, e.target.value)}
                  className="min-h-32"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2 flex-wrap justify-center">
            {questions.map((q, index) => {
              const hasAnswer = getAnswer(q.id);
              const isAnswered = q.type === 'MultipleChoice' 
                ? !!hasAnswer?.selectedOptionId 
                : !!hasAnswer?.textAnswer?.trim();
              
              return (
                <Button
                  key={q.id}
                  variant={index === currentQuestionIndex ? "default" : isAnswered ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className="w-10 h-10"
                >
                  {index + 1}
                </Button>
              );
            })}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="min-w-32"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Assessment'
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttemptAssessment;