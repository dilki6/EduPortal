import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, FileText, User, CheckCircle, XCircle, AlertCircle, ChevronDown, Loader2 } from 'lucide-react';
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
    }
  }, [selectedCourse]);

  // Fetch attempts when assessment is selected
  useEffect(() => {
    if (selectedAssessment) {
      fetchAttempts(selectedAssessment);
      setAnswersMap(new Map());
      setExpandedStudents(new Set());
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

  const getEvaluationColor = (isCorrect: boolean, pointsEarned: number, maxPoints: number) => {
    if (isCorrect || pointsEarned === maxPoints) {
      return 'bg-green-50 border-green-200';
    } else if (pointsEarned > 0) {
      return 'bg-yellow-50 border-yellow-200';
    } else {
      return 'bg-red-50 border-red-200';
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
            <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={loadingCourses}>
              <SelectTrigger>
                <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Choose a course"} />
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
              disabled={!selectedCourse || loadingAssessments}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingAssessments ? "Loading assessments..." : "Choose an assessment"} />
              </SelectTrigger>
              <SelectContent>
                {assessments.map((assessment) => (
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

        {/* Loading State */}
        {loadingAttempts && (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Student Attempts */}
        {!loadingAttempts && selectedAssessment && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Student Submissions</h2>
            
            {attempts.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No student submissions found for this assessment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {attempts.map((attempt) => {
                  const isExpanded = expandedStudents.has(attempt.id);
                  const answers = answersMap.get(attempt.id) || [];
                  const isLoadingAnswers = loadingAnswers.has(attempt.id);

                  return (
                    <Card key={attempt.id} className="bg-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-primary" />
                            <div>
                              <CardTitle className="text-lg">{attempt.studentName}</CardTitle>
                              <CardDescription>
                                Submitted: {new Date(attempt.completedAt || attempt.startedAt).toLocaleString()}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Score: {attempt.score ?? 0}/{attempt.maxScore ?? 0}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(attempt.id)}
                              className="flex items-center gap-2"
                              disabled={isLoadingAnswers}
                            >
                              {isLoadingAnswers ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  {isExpanded ? 'Collapse' : 'Expand'}
                                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {isExpanded && answers.length > 0 && (
                        <CardContent className="space-y-4">
                          {answers.map((answer) => {
                            const isMCQ = answer.questionType === 'MultipleChoice' || answer.questionType === 'TrueFalse';
                            
                            return (
                              <div 
                                key={answer.id} 
                                className={`p-4 rounded-lg border ${getEvaluationColor(answer.isCorrect, answer.pointsEarned ?? 0, answer.questionPoints)}`}
                              >
                                {/* Question */}
                                <div className="mb-4">
                                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Question:</h4>
                                  <p className="text-foreground">{answer.questionText}</p>
                                  {isMCQ && answer.questionOptions && answer.questionOptions.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {answer.questionOptions.map((option) => (
                                        <Badge 
                                          key={option.id} 
                                          variant={option.isCorrect ? "default" : "outline"}
                                          className="mr-2"
                                        >
                                          {option.text}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Student Answer */}
                                <div className="mb-4">
                                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Student Answer:</h4>
                                  <div className="p-3 bg-background/50 rounded-lg border">
                                    <p className="text-foreground">
                                      {isMCQ ? answer.selectedOptionText : answer.textAnswer}
                                    </p>
                                  </div>
                                </div>

                                {/* Correct Answer for MCQ or Expected Answer for Text Questions */}
                                {isMCQ && answer.correctAnswer && (
                                  <div className="mb-4">
                                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Correct Answer:</h4>
                                    <div className="p-3 bg-muted/30 rounded-lg border">
                                      <p className="text-foreground text-sm">{answer.correctAnswer}</p>
                                    </div>
                                  </div>
                                )}

                                {!isMCQ && answer.expectedAnswer && (
                                  <div className="mb-4">
                                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Expected Answer:</h4>
                                    <div className="p-3 bg-muted/30 rounded-lg border">
                                      <p className="text-foreground text-sm">{answer.expectedAnswer}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Evaluation Section */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{answer.questionPoints} points</Badge>
                                    <div className="flex items-center gap-2">
                                      {getEvaluationIcon(answer.isCorrect, answer.pointsEarned ?? 0, answer.questionPoints)}
                                      <Badge variant="secondary">
                                        {answer.pointsEarned ?? 0}/{answer.questionPoints}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
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