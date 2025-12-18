import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, FileText, User, CheckCircle, XCircle, AlertCircle, ChevronDown, Loader2, Sparkles, Zap, Save } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Review Student Answers</h1>
            <p className="text-muted-foreground">Evaluate and provide feedback on student submissions</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleSaveScores}
              disabled={savingScores || manualScores.size === 0}
              variant="default"
            >
              {savingScores ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Scores ({manualScores.size})
                </>
              )}
            </Button>
            <Button
              onClick={handleEvaluateAll}
              disabled={
                evaluatingAll || 
                expandedStudents.size === 0 ||
                // Check if there are any unevaluated text answers
                (() => {
                  let hasUnevaluated = false;
                  expandedStudents.forEach(attemptId => {
                    const answers = answersMap.get(attemptId) || [];
                    answers.forEach(answer => {
                      const isTextQuestion = answer.questionType !== 'MultipleChoice' && answer.questionType !== 'TrueFalse';
                      if (isTextQuestion && !evaluatedAnswers.has(answer.id)) {
                        hasUnevaluated = true;
                      }
                    });
                  });
                  return !hasUnevaluated;
                })()
              }
              className="bg-purple-600 hover:bg-purple-700"
            >
              {evaluatingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating All...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Evaluate All with AI
                </>
              )}
            </Button>
          </div>
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
                                className={`p-4 rounded-lg border ${getEvaluationColor(answer.isCorrect, answer.pointsEarned ?? 0, answer.questionPoints, answer.questionType)}`}
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
                                <div className="space-y-3">
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

                                  {/* AI Grading for Text Questions */}
                                  {!isMCQ && (
                                    <div className="flex items-center gap-3 pt-2 border-t">
                                      <div className="flex items-center gap-2 flex-1">
                                        <label className="text-sm font-medium whitespace-nowrap">Manual Score:</label>
                                        <Input
                                          type="number"
                                          min={0}
                                          max={answer.questionPoints}
                                          step={0.5}
                                          value={manualScores.get(answer.id) ?? answer.pointsEarned ?? 0}
                                          onChange={(e) => handleManualScoreChange(answer.id, e.target.value, answer.questionPoints, answer.pointsEarned ?? 0)}
                                          className="w-24"
                                          placeholder="0"
                                        />
                                        <span className="text-sm text-muted-foreground">/ {answer.questionPoints}</span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEvaluateSingle(answer.id, answer)}
                                        disabled={evaluatingAnswers.has(answer.id) || evaluatedAnswers.has(answer.id)}
                                        className="border-purple-200 hover:bg-purple-50"
                                      >
                                        {evaluatingAnswers.has(answer.id) ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Evaluating...
                                          </>
                                        ) : evaluatedAnswers.has(answer.id) ? (
                                          <>
                                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                            AI Evaluated
                                          </>
                                        ) : (
                                          <>
                                            <Sparkles className="mr-2 h-4 w-4 text-purple-600" />
                                            Evaluate with AI
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  )}
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