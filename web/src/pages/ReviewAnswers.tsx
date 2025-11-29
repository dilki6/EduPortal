import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, FileText, User, Brain, CheckCircle, XCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StudentAnswer {
  id: string;
  studentId: string;
  studentName: string;
  questionId: string;
  answer: string;
  submittedAt: string;
  evaluation?: {
    status: 'correct' | 'partial' | 'incorrect';
    aiScore: number;
    feedback: string;
    evaluatedAt: string;
  };
}

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
  courseId: string;
  courseName: string;
  questions: Question[];
}

const ReviewAnswers: React.FC = () => {
  const { toast } = useToast();
  
  const [courses] = useState([
    { id: '1', name: 'Advanced Mathematics' },
    { id: '2', name: 'Physics Fundamentals' },
    { id: '3', name: 'Chemistry Lab' }
  ]);

  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  const [assessments] = useState<Assessment[]>([
    {
      id: '1',
      title: 'Calculus Basics',
      courseId: '1',
      courseName: 'Advanced Mathematics',
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
          question: 'Explain the fundamental theorem of calculus.',
          modelAnswer: 'The fundamental theorem of calculus establishes the relationship between differentiation and integration. It states that if f is continuous on [a,b] and F is an antiderivative of f, then the definite integral of f from a to b equals F(b) - F(a).',
          points: 20
        }
      ]
    },
    {
      id: '2',
      title: 'Newton\'s Laws',
      courseId: '2',
      courseName: 'Physics Fundamentals',
      questions: [
        {
          id: '3',
          type: 'text',
          question: 'Describe Newton\'s second law of motion and provide an example.',
          modelAnswer: 'Newton\'s second law states that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass (F = ma). For example, when you push a shopping cart, the harder you push (more force), the faster it accelerates.',
          points: 15
        }
      ]
    }
  ]);

  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([
    {
      id: '1',
      studentId: '2',
      studentName: 'Alex Chen',
      questionId: '1',
      answer: '2x',
      submittedAt: '2024-01-20T10:30:00Z',
      evaluation: {
        status: 'correct',
        aiScore: 10,
        feedback: 'Perfect! This is the correct derivative.',
        evaluatedAt: '2024-01-20T11:00:00Z'
      }
    },
    {
      id: '2',
      studentId: '2',
      studentName: 'Alex Chen',
      questionId: '2',
      answer: 'The fundamental theorem connects derivatives and integrals. It says that integration and differentiation are inverse operations.',
      submittedAt: '2024-01-20T10:35:00Z'
    },
    {
      id: '3',
      studentId: '3',
      studentName: 'Emily Davis',
      questionId: '1',
      answer: 'x',
      submittedAt: '2024-01-20T10:32:00Z'
    },
    {
      id: '4',
      studentId: '3',
      studentName: 'Emily Davis',
      questionId: '3',
      answer: 'Newton\'s second law is F = ma. This means force equals mass times acceleration. An example is when you throw a ball - the harder you throw it, the faster it goes.',
      submittedAt: '2024-01-21T09:15:00Z'
    }
  ]);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');

  const toggleExpanded = (studentKey: string) => {
    setExpandedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentKey)) {
        newSet.delete(studentKey);
      } else {
        newSet.add(studentKey);
      }
      return newSet;
    });
  };

  const getFilteredAssessments = () => {
    if (!selectedCourse) return [];
    return assessments.filter(assessment => assessment.courseId === selectedCourse);
  };

  const getStudentAnswersForAssessment = () => {
    if (!selectedAssessment) return [];
    const assessment = assessments.find(a => a.id === selectedAssessment);
    if (!assessment) return [];
    
    const questionIds = assessment.questions.map(q => q.id);
    return studentAnswers.filter(answer => questionIds.includes(answer.questionId));
  };

  const getQuestionById = (questionId: string): Question | undefined => {
    for (const assessment of assessments) {
      const question = assessment.questions.find(q => q.id === questionId);
      if (question) return question;
    }
    return undefined;
  };

  const evaluateAnswer = async (studentAnswer: StudentAnswer) => {
    const question = getQuestionById(studentAnswer.questionId);
    if (!question) return;

    // Mock AI evaluation
    let evaluation;
    
    if (question.type === 'mcq') {
      evaluation = {
        status: studentAnswer.answer === question.correctAnswer ? 'correct' : 'incorrect' as const,
        aiScore: studentAnswer.answer === question.correctAnswer ? question.points : 0,
        feedback: studentAnswer.answer === question.correctAnswer 
          ? 'Correct answer!' 
          : `Incorrect. The correct answer is: ${question.correctAnswer}`,
        evaluatedAt: new Date().toISOString()
      };
    } else {
      // Mock AI comparison for text answers
      const similarity = Math.random(); // Mock similarity score
      let status: 'correct' | 'partial' | 'incorrect';
      let score: number;
      let feedback: string;

      if (similarity > 0.8) {
        status = 'correct';
        score = question.points;
        feedback = 'Excellent answer! Demonstrates clear understanding of the concept.';
      } else if (similarity > 0.5) {
        status = 'partial';
        score = Math.round(question.points * 0.7);
        feedback = 'Good attempt but missing some key points. Consider including more details about the relationship between concepts.';
      } else {
        status = 'incorrect';
        score = Math.round(question.points * 0.3);
        feedback = 'The answer shows some understanding but lacks depth. Please review the model answer and try to include more specific details.';
      }

      evaluation = { status, aiScore: score, feedback, evaluatedAt: new Date().toISOString() };
    }

    // Update the student answer with evaluation
    setStudentAnswers(answers => 
      answers.map(answer => 
        answer.id === studentAnswer.id 
          ? { ...answer, evaluation }
          : answer
      )
    );

    toast({
      title: "Answer Evaluated",
      description: `AI evaluation completed for ${studentAnswer.studentName}'s answer`
    });
  };

  const getEvaluationIcon = (status: string) => {
    switch (status) {
      case 'correct':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'incorrect':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getEvaluationColor = (status: string) => {
    switch (status) {
      case 'correct':
        return 'bg-green-50 border-green-200';
      case 'partial':
        return 'bg-yellow-50 border-yellow-200';
      case 'incorrect':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Review Student Answers</h1>
          <p className="text-muted-foreground">Evaluate and provide feedback on student submissions</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Course</label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {course.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Select Assessment</label>
            <Select 
              value={selectedAssessment} 
              onValueChange={setSelectedAssessment}
              disabled={!selectedCourse}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an assessment" />
              </SelectTrigger>
              <SelectContent>
                {getFilteredAssessments().map((assessment) => (
                  <SelectItem key={assessment.id} value={assessment.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {assessment.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Student Answers */}
        {selectedAssessment && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Student Submissions</h2>
            
            {getStudentAnswersForAssessment().length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No student submissions found for this assessment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  getStudentAnswersForAssessment()
                    .reduce((groups: { [key: string]: StudentAnswer[] }, answer) => {
                      const key = `${answer.studentId}-${answer.studentName}`;
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(answer);
                      return groups;
                    }, {})
                ).map(([studentKey, studentAnswers]) => {
                  const [studentId, studentName] = studentKey.split('-');
                  const isExpanded = expandedStudents.has(studentKey);
                  const totalScore = studentAnswers.reduce((sum, answer) => {
                    return sum + (answer.evaluation?.aiScore || 0);
                  }, 0);
                  const maxScore = studentAnswers.reduce((sum, answer) => {
                    const question = getQuestionById(answer.questionId);
                    return sum + (question?.points || 0);
                  }, 0);

                  return (
                    <Card key={studentKey} className="bg-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-primary" />
                            <div>
                              <CardTitle className="text-lg">{studentName}</CardTitle>
                              <CardDescription>
                                {studentAnswers.length} answers submitted
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Score: {totalScore}/{maxScore}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(studentKey)}
                              className="flex items-center gap-2"
                            >
                              {isExpanded ? 'Collapse' : 'Expand'}
                              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="space-y-4">
                          {studentAnswers.map((studentAnswer) => {
                            const question = getQuestionById(studentAnswer.questionId);
                            if (!question) return null;

                            return (
                              <div key={studentAnswer.id} className={`p-4 rounded-lg border ${studentAnswer.evaluation ? getEvaluationColor(studentAnswer.evaluation.status) : 'bg-muted/20'}`}>
                                {/* Question */}
                                <div className="mb-4">
                                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Question:</h4>
                                  <p className="text-foreground">{question.question}</p>
                                  {question.type === 'mcq' && question.options && (
                                    <div className="mt-2 space-y-1">
                                      {question.options.map((option, index) => (
                                        <Badge 
                                          key={index} 
                                          variant={option === question.correctAnswer ? "default" : "outline"}
                                          className="mr-2"
                                        >
                                          {option}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Student Answer */}
                                <div className="mb-4">
                                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Student Answer:</h4>
                                  <div className="p-3 bg-background/50 rounded-lg border">
                                    <p className="text-foreground">{studentAnswer.answer}</p>
                                  </div>
                                </div>

                                {/* Model Answer for Text Questions */}
                                {question.type === 'text' && question.modelAnswer && (
                                  <div className="mb-4">
                                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Model Answer:</h4>
                                    <div className="p-3 bg-muted/30 rounded-lg border">
                                      <p className="text-foreground text-sm">{question.modelAnswer}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Evaluation Section */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{question.points} points</Badge>
                                    {studentAnswer.evaluation && (
                                      <div className="flex items-center gap-2">
                                        {getEvaluationIcon(studentAnswer.evaluation.status)}
                                        <Badge variant="secondary">
                                          {studentAnswer.evaluation.aiScore}/{question.points}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {question.type === 'text' && !studentAnswer.evaluation && (
                                    <Button
                                      onClick={() => evaluateAnswer(studentAnswer)}
                                      size="sm"
                                      variant="outline"
                                      className="flex items-center gap-2"
                                    >
                                      <Brain className="h-4 w-4" />
                                      Evaluate Answer
                                    </Button>
                                  )}
                                </div>

                                {/* AI Evaluation Feedback */}
                                {studentAnswer.evaluation && (
                                  <div className="mt-4 p-3 rounded-lg border bg-background/50">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Brain className="h-4 w-4 text-primary" />
                                      <span className="font-medium text-sm">AI Evaluation</span>
                                      <Badge variant="outline" className="text-xs">
                                        {new Date(studentAnswer.evaluation.evaluatedAt).toLocaleString()}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{studentAnswer.evaluation.feedback}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </CardContent>
                      )}
                    </Card>
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