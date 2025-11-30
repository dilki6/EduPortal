import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileText, Plus, Edit, Trash2, Clock, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { courseApi, assessmentApi, Course, Assessment as ApiAssessment, Question as ApiQuestion, CreateAssessmentRequest, CreateQuestionRequest } from '@/lib/api';

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
  questions: Question[];
  timeLimit: number; // in minutes
  isPublished: boolean;
  createdAt: string;
}

const AssessmentManagement: React.FC = () => {
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingAssessmentId, setDeletingAssessmentId] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  // Form states
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentDescription, setAssessmentDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  
  // Question form states
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'mcq' | 'text'>('mcq');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [modelAnswer, setModelAnswer] = useState('');
  const [points, setPoints] = useState('');

  // Fetch courses and assessments on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch teacher's courses and assessments in parallel
      const [fetchedCourses, fetchedAssessments] = await Promise.all([
        courseApi.getMyTeachingCourses(),
        assessmentApi.getMyTeachingAssessments()
      ]);
      
      setCourses(fetchedCourses);

      // Transform API assessments to local format with course names
      // Fetch questions for each assessment
      const assessmentsWithQuestions = await Promise.all(
        fetchedAssessments.map(async (assessment) => {
          const course = fetchedCourses.find(c => c.id === assessment.courseId);
          
          // Fetch questions for this assessment
          let questions: Question[] = [];
          try {
            const apiQuestions = await assessmentApi.getQuestions(assessment.id);
            questions = apiQuestions.map(q => ({
              id: q.id,
              type: q.type === 'MultipleChoice' ? 'mcq' as const : 'text' as const,
              question: q.text,
              options: q.options?.map(o => o.text) || [],
              correctAnswer: q.options?.find(o => o.isCorrect)?.text,
              modelAnswer: (q.type === 'ShortAnswer' || q.type === 'Essay') ? '' : undefined,
              points: q.points
            }));
          } catch (error) {
            console.error(`Failed to fetch questions for assessment ${assessment.id}:`, error);
          }

          return {
            id: assessment.id,
            title: assessment.title,
            description: assessment.description,
            courseId: assessment.courseId,
            courseName: course?.name || 'Unknown Course',
            timeLimit: assessment.durationMinutes,
            isPublished: assessment.isPublished,
            questions,
            createdAt: assessment.createdAt
          };
        })
      );
      
      setAssessments(assessmentsWithQuestions);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: "Error",
        description: "Failed to load courses and assessments",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!assessmentTitle.trim() || !assessmentDescription.trim() || !selectedCourse || !timeLimit) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);

      const createData: CreateAssessmentRequest = {
        courseId: selectedCourse,
        title: assessmentTitle,
        description: assessmentDescription,
        durationMinutes: parseInt(timeLimit)
      };

      const createdAssessment = await assessmentApi.create(createData);
      
      const courseName = courses.find(c => c.id === selectedCourse)?.name || '';
      const newAssessment: Assessment = {
        id: createdAssessment.id,
        title: createdAssessment.title,
        description: createdAssessment.description,
        courseId: createdAssessment.courseId,
        courseName,
        timeLimit: createdAssessment.durationMinutes,
        isPublished: createdAssessment.isPublished,
        questions: [],
        createdAt: createdAssessment.createdAt
      };

      setAssessments([...assessments, newAssessment]);
      resetAssessmentForm();
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Assessment created successfully"
      });
    } catch (error) {
      console.error('Failed to create assessment:', error);
      toast({
        title: "Error",
        description: "Failed to create assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!questionText.trim() || !points || !currentAssessment) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    if (questionType === 'mcq') {
      const validOptions = options.filter(opt => opt.trim());
      if (validOptions.length < 2 || !correctAnswer) {
        toast({
          title: "Error",
          description: "MCQ questions need at least 2 options and a correct answer",
          variant: "destructive"
        });
        return;
      }
    }

    if (questionType === 'text' && !modelAnswer.trim()) {
      toast({
        title: "Error",
        description: "Text questions require a model answer",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);

      // Prepare the question data for API
      const questionData: CreateQuestionRequest = {
        text: questionText,
        type: questionType === 'mcq' ? 'MultipleChoice' : 'ShortAnswer',
        points: parseInt(points),
        expectedAnswer: questionType === 'text' ? modelAnswer : undefined,
        options: questionType === 'mcq' 
          ? options.filter(opt => opt.trim()).map(opt => ({
              text: opt,
              isCorrect: opt === correctAnswer
            }))
          : [] // For text questions, options array should be empty
      };

      // Call API to add question
      const createdQuestion = await assessmentApi.addQuestion(currentAssessment.id, questionData);

      // Transform API response to local format
      const newQuestion: Question = {
        id: createdQuestion.id,
        type: questionType,
        question: createdQuestion.text,
        ...(questionType === 'mcq' ? {
          options: createdQuestion.options?.map(o => o.text) || [],
          correctAnswer: createdQuestion.options?.find(o => o.isCorrect)?.text
        } : {
          modelAnswer
        }),
        points: createdQuestion.points
      };

      // Update local state
      setAssessments(assessments.map(assessment => 
        assessment.id === currentAssessment.id
          ? { ...assessment, questions: [...assessment.questions, newQuestion] }
          : assessment
      ));

      resetQuestionForm();
      setIsQuestionDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Question added successfully"
      });
    } catch (error) {
      console.error('Failed to add question:', error);
      toast({
        title: "Error",
        description: "Failed to add question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (assessmentId: string, questionId: string) => {
    try {
      setDeletingQuestionId(questionId);

      // Optimistically remove from UI
      setAssessments(assessments.map(assessment => 
        assessment.id === assessmentId
          ? { ...assessment, questions: assessment.questions.filter(q => q.id !== questionId) }
          : assessment
      ));

      // Call API to delete question
      await assessmentApi.deleteQuestion(questionId);
      
      toast({
        title: "Success",
        description: "Question deleted successfully"
      });
    } catch (error) {
      console.error('Failed to delete question:', error);
      
      // Restore previous state on error
      await fetchData();
      
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingQuestionId(null);
    }
  };

  const handleDeleteAssessment = async (assessmentId: string, assessmentTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${assessmentTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingAssessmentId(assessmentId);
      
      // Optimistically remove from UI
      setAssessments(prevAssessments => prevAssessments.filter(a => a.id !== assessmentId));
      
      // Make API call
      await assessmentApi.delete(assessmentId);
      
      toast({
        title: "Success",
        description: `Assessment "${assessmentTitle}" deleted successfully`
      });
    } catch (error) {
      console.error('Failed to delete assessment:', error);
      
      // Restore the assessment list on error
      await fetchData();
      
      toast({
        title: "Error",
        description: "Failed to delete assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingAssessmentId(null);
    }
  };

  const resetAssessmentForm = () => {
    setAssessmentTitle('');
    setAssessmentDescription('');
    setSelectedCourse('');
    setTimeLimit('');
  };

  const resetQuestionForm = () => {
    setQuestionText('');
    setQuestionType('mcq');
    setOptions(['', '', '', '']);
    setCorrectAnswer('');
    setModelAnswer('');
    setPoints('');
  };

  const openQuestionDialog = (assessment: Assessment) => {
    setCurrentAssessment(assessment);
    setIsQuestionDialogOpen(true);
  };

  const getTotalPoints = (assessment: Assessment) => {
    return assessment.questions.reduce((total, question) => total + question.points, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assessment Management</h1>
            <p className="text-muted-foreground">Create and manage assessments for your courses</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Assessment</DialogTitle>
                <DialogDescription>
                  Set up a new assessment for your students
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="assessment-title">Assessment Title</Label>
                  <Input
                    id="assessment-title"
                    value={assessmentTitle}
                    onChange={(e) => setAssessmentTitle(e.target.value)}
                    placeholder="Enter assessment title"
                  />
                </div>
                <div>
                  <Label htmlFor="assessment-description">Description</Label>
                  <Textarea
                    id="assessment-description"
                    value={assessmentDescription}
                    onChange={(e) => setAssessmentDescription(e.target.value)}
                    placeholder="Enter assessment description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="course-select">Course</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                  <Input
                    id="time-limit"
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    placeholder="Enter time limit in minutes"
                    min="1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAssessment} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Assessment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assessments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {assessments.length === 0 ? (
            <Card className="col-span-full p-12">
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">No Assessments Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by creating your first assessment
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Assessment
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            assessments.map((assessment) => (
              <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-primary" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAssessment(assessment.id, assessment.title)}
                      className="text-destructive hover:text-destructive"
                      disabled={deletingAssessmentId === assessment.id}
                    >
                      {deletingAssessmentId === assessment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <CardTitle className="text-xl">{assessment.title}</CardTitle>
                  <CardDescription>{assessment.description}</CardDescription>
                </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{assessment.courseName}</Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {assessment.timeLimit} min
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {assessment.questions.length} questions
                  </Badge>
                  <Badge variant="outline">
                    {getTotalPoints(assessment)} points
                  </Badge>
                </div>

                {assessment.questions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Questions:</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {assessment.questions.map((question, index) => (
                        <div key={question.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                              {index + 1}. {question.question}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant={question.type === 'mcq' ? 'default' : 'secondary'} className="text-xs">
                                {question.type === 'mcq' ? 'Multiple Choice' : 'Text Answer'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {question.points} pts
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteQuestion(assessment.id, question.id)}
                            className="text-destructive hover:text-destructive ml-2"
                            disabled={deletingQuestionId === question.id}
                          >
                            {deletingQuestionId === question.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => openQuestionDialog(assessment)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </CardContent>
            </Card>
            ))
          )}
        </div>

        {/* Add Question Dialog */}
        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Question</DialogTitle>
              <DialogDescription>
                Add a new question to {currentAssessment?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="question-text">Question</Label>
                <Textarea
                  id="question-text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter your question"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Question Type</Label>
                <RadioGroup value={questionType} onValueChange={(value) => setQuestionType(value as 'mcq' | 'text')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mcq" id="mcq" />
                    <Label htmlFor="mcq">Multiple Choice</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="text" />
                    <Label htmlFor="text">Text Answer</Label>
                  </div>
                </RadioGroup>
              </div>

              {questionType === 'mcq' && (
                <div className="space-y-2">
                  <Label>Answer Options</Label>
                  {options.map((option, index) => (
                    <Input
                      key={index}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        setOptions(newOptions);
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                  ))}
                  <div>
                    <Label htmlFor="correct-answer">Correct Answer</Label>
                    <Select value={correctAnswer} onValueChange={setCorrectAnswer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.filter(opt => opt.trim()).map((option, index) => (
                          <SelectItem key={index} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {questionType === 'text' && (
                <div>
                  <Label htmlFor="model-answer">Model Answer</Label>
                  <Textarea
                    id="model-answer"
                    value={modelAnswer}
                    onChange={(e) => setModelAnswer(e.target.value)}
                    placeholder="Enter the model/expected answer"
                    rows={4}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="Enter points for this question"
                  min="1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleAddQuestion} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Question
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AssessmentManagement;