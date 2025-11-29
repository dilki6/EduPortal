import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  type: 'mcq' | 'text';
  question: string;
  options?: string[];
  correctAnswer?: string;
  modelAnswer?: string;
  points: number;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  timeLimit: number; // in minutes
  questions: Question[];
  instructions: string;
}

interface Answer {
  questionId: string;
  answer: string;
}

const AttemptAssessment: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assessment] = useState<Assessment>({
    id: '1',
    title: 'Calculus Basics',
    description: 'Test your understanding of fundamental calculus concepts',
    courseId: '1',
    courseName: 'Advanced Mathematics',
    timeLimit: 60,
    instructions: 'Read each question carefully. For multiple choice questions, select the best answer. For text questions, provide detailed explanations.',
    questions: [
      {
        id: '1',
        type: 'mcq',
        question: 'What is the derivative of x²?',
        options: ['x', '2x', 'x²', '2x²'],
        correctAnswer: '2x',
        points: 10
      },
      {
        id: '2',
        type: 'text',
        question: 'Explain the fundamental theorem of calculus and provide an example of its application.',
        modelAnswer: 'The fundamental theorem of calculus establishes the relationship between differentiation and integration. It states that if f is continuous on [a,b] and F is an antiderivative of f, then the definite integral of f from a to b equals F(b) - F(a). For example, to find the area under the curve y = x² from x = 0 to x = 2, we can use the antiderivative F(x) = x³/3, giving us F(2) - F(0) = 8/3 - 0 = 8/3.',
        points: 20
      },
      {
        id: '3',
        type: 'mcq',
        question: 'What is the integral of 2x dx?',
        options: ['x²', 'x² + C', '2x²', '2x² + C'],
        correctAnswer: 'x² + C',
        points: 10
      },
      {
        id: '4',
        type: 'text',
        question: 'Describe the process of finding the limit of a function as x approaches infinity, and give an example.',
        points: 15
      }
    ]
  });

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(assessment.timeLimit * 60); // in seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

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

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => a.questionId === questionId ? { ...a, answer } : a);
      }
      return [...prev, { questionId, answer }];
    });
  };

  const getAnswer = (questionId: string) => {
    return answers.find(a => a.questionId === questionId)?.answer || '';
  };

  const calculateScore = () => {
    let totalScore = 0;
    let maxScore = 0;

    assessment.questions.forEach(question => {
      maxScore += question.points;
      const answer = getAnswer(question.id);
      
      if (question.type === 'mcq' && answer === question.correctAnswer) {
        totalScore += question.points;
      } else if (question.type === 'text' && answer.trim()) {
        // Mock scoring for text answers
        totalScore += Math.floor(question.points * 0.8); // 80% for having an answer
      }
    });

    return { totalScore, maxScore, percentage: Math.round((totalScore / maxScore) * 100) };
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowResults(true);
    
    const { totalScore, maxScore, percentage } = calculateScore();
    
    toast({
      title: "Assessment Submitted",
      description: `Your assessment has been submitted successfully. Score: ${totalScore}/${maxScore} (${percentage}%)`
    });
  };

  const handleFinish = () => {
    navigate('/my-courses');
  };

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;

  if (showResults) {
    const { totalScore, maxScore, percentage } = calculateScore();
    
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Assessment Completed!</CardTitle>
              <CardDescription>
                Your responses have been submitted successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h3 className="font-medium text-primary">Score</h3>
                  <p className="text-2xl font-bold">{totalScore}/{maxScore}</p>
                </div>
                <div className="p-4 bg-secondary/5 rounded-lg">
                  <h3 className="font-medium text-secondary">Percentage</h3>
                  <p className="text-2xl font-bold">{percentage}%</p>
                </div>
                <div className="p-4 bg-accent/5 rounded-lg">
                  <h3 className="font-medium text-accent">Grade</h3>
                  <p className="text-2xl font-bold">
                    {percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Text answers will be reviewed by your instructor for final grading.
                </p>
                <Button onClick={handleFinish} className="w-full">
                  Return to My Courses
                </Button>
              </div>
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
                <CardDescription>{assessment.courseName}</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className={`font-mono ${timeRemaining < 300 ? 'text-red-500' : ''}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <Badge variant="outline">
                  Question {currentQuestionIndex + 1} of {assessment.questions.length}
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
              <p className="text-sm">{assessment.instructions}</p>
            </CardContent>
          </Card>
        )}

        {/* Current Question */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-1" />
                <div>
                  <CardTitle className="text-lg">Question {currentQuestionIndex + 1}</CardTitle>
                  <CardDescription className="mt-2">
                    {currentQuestion.question}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline">{currentQuestion.points} points</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion.type === 'mcq' && currentQuestion.options ? (
              <RadioGroup
                value={getAnswer(currentQuestion.id)}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
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
                  value={getAnswer(currentQuestion.id)}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
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
          
          <div className="flex gap-2">
            {assessment.questions.map((_, index) => (
              <Button
                key={index}
                variant={index === currentQuestionIndex ? "default" : getAnswer(assessment.questions[index].id) ? "secondary" : "outline"}
                size="sm"
                onClick={() => setCurrentQuestionIndex(index)}
                className="w-10 h-10"
              >
                {index + 1}
              </Button>
            ))}
          </div>

          {currentQuestionIndex === assessment.questions.length - 1 ? (
            <Button onClick={handleSubmit} disabled={isSubmitted}>
              Submit Assessment
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex(Math.min(assessment.questions.length - 1, currentQuestionIndex + 1))}
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