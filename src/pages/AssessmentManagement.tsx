import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileText, Plus, Edit, Trash2, Clock, Users } from 'lucide-react';
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
  questions: Question[];
  timeLimit: number; // in minutes
  createdAt: string;
}

const AssessmentManagement: React.FC = () => {
  const { toast } = useToast();
  
  const [courses] = useState([
    { id: '1', name: 'Advanced Mathematics' },
    { id: '2', name: 'Physics Fundamentals' },
    { id: '3', name: 'Chemistry Lab' }
  ]);

  const [assessments, setAssessments] = useState<Assessment[]>([
    {
      id: '1',
      title: 'Calculus Basics',
      description: 'Test on fundamental calculus concepts',
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
        }
      ],
      timeLimit: 60,
      createdAt: '2024-01-15'
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);

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

  const handleCreateAssessment = () => {
    if (!assessmentTitle.trim() || !assessmentDescription.trim() || !selectedCourse || !timeLimit) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const courseName = courses.find(c => c.id === selectedCourse)?.name || '';
    const newAssessment: Assessment = {
      id: Date.now().toString(),
      title: assessmentTitle,
      description: assessmentDescription,
      courseId: selectedCourse,
      courseName,
      questions: [],
      timeLimit: parseInt(timeLimit),
      createdAt: new Date().toISOString().split('T')[0]
    };

    setAssessments([...assessments, newAssessment]);
    resetAssessmentForm();
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Assessment created successfully"
    });
  };

  const handleAddQuestion = () => {
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

    const newQuestion: Question = {
      id: Date.now().toString(),
      type: questionType,
      question: questionText,
      ...(questionType === 'mcq' ? {
        options: options.filter(opt => opt.trim()),
        correctAnswer
      } : {
        modelAnswer
      }),
      points: parseInt(points)
    };

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
  };

  const handleDeleteQuestion = (assessmentId: string, questionId: string) => {
    setAssessments(assessments.map(assessment => 
      assessment.id === assessmentId
        ? { ...assessment, questions: assessment.questions.filter(q => q.id !== questionId) }
        : assessment
    ));
    
    toast({
      title: "Success",
      description: "Question deleted successfully"
    });
  };

  const handleDeleteAssessment = (assessmentId: string) => {
    setAssessments(assessments.filter(assessment => assessment.id !== assessmentId));
    toast({
      title: "Success",
      description: "Assessment deleted successfully"
    });
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
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAssessment}>Create Assessment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assessments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-primary" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAssessment(assessment.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
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
                          >
                            <Trash2 className="h-3 w-3" />
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
          ))}
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
              <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddQuestion}>Add Question</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AssessmentManagement;