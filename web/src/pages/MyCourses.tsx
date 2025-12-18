import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Calendar, Clock, Trophy, Play, Loader2, FileText, RefreshCw, Award, Timer, HelpCircle, ChevronDown, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  courseApi, 
  assessmentApi, 
  type Course, 
  type Assessment,
  type AssessmentAttempt,
  type Question 
} from '@/lib/api';

interface AssessmentCard {
  assessmentId: string;
  assessmentTitle: string;
  assessmentDescription: string;
  dueDate?: string;
  courseId: string;
  courseName: string;
  teacherName?: string;
  isCompleted: boolean;
  resultsReleased?: boolean;
  attempt?: AssessmentAttempt;
  score?: number;
  maxScore?: number;
  durationMinutes?: number;
  questionCount?: number;
  totalPoints?: number;
  questions?: Question[];
}

const MyCourses: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [assessmentCards, setAssessmentCards] = useState<AssessmentCard[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');

  useEffect(() => {
    fetchAssessmentsData();
    
    // Refresh data when window regains focus (e.g., after teacher creates new assessment)
    const handleFocus = () => {
      fetchAssessmentsData(true);
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchAssessmentsData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch enrolled courses
      const enrolledCourses = await courseApi.getMyEnrolledCourses();
      console.log(`📚 Fetched ${enrolledCourses.length} enrolled courses:`, enrolledCourses.map(c => c.name));
      setCourses(enrolledCourses);
      
      // Fetch all student attempts
      const allAttempts = await assessmentApi.getStudentAttempts();
      console.log(`✅ Fetched ${allAttempts.length} student attempts`);
      
      // For each course, fetch its assessments
      const allAssessmentCards: AssessmentCard[] = [];
      
      await Promise.all(
        enrolledCourses.map(async (course) => {
          try {
            // Fetch assessments for this course
            const courseAssessments = await assessmentApi.getAllByCourse(course.id);
            console.log(`📝 Course "${course.name}": ${courseAssessments.length} total assessments`);
            
            // Filter only published assessments
            const publishedAssessments = courseAssessments.filter(a => a.isPublished);
            console.log(`✨ Course "${course.name}": ${publishedAssessments.length} published assessments`);
            
            // Create a card for each assessment and fetch questions
            await Promise.all(
              publishedAssessments.map(async (assessment) => {
                // Find attempt for this assessment
                const attempt = allAttempts.find(
                  a => a.assessmentId === assessment.id && (a.status === 'Completed' || a.status === 1)
                );
                
                // Fetch questions for this assessment (without answers for students)
                let questions: Question[] = [];
                try {
                  questions = await assessmentApi.getQuestions(assessment.id);
                } catch (error) {
                  console.error(`Failed to fetch questions for assessment ${assessment.id}:`, error);
                }
                
                allAssessmentCards.push({
                  assessmentId: assessment.id,
                  assessmentTitle: assessment.title,
                  assessmentDescription: assessment.description,
                  dueDate: assessment.dueDate,
                  courseId: course.id,
                  courseName: course.name,
                  teacherName: course.teacherName,
                  isCompleted: !!attempt,
                  resultsReleased: assessment.resultsReleased || false,
                  attempt: attempt,
                  score: attempt?.score,
                  maxScore: attempt?.maxScore,
                  durationMinutes: assessment.durationMinutes,
                  questionCount: assessment.questionCount,
                  totalPoints: assessment.totalPoints,
                  questions: questions
                });
              })
            );
          } catch (error) {
            console.error(`Error fetching assessments for course ${course.id}:`, error);
          }
        })
      );
      
      // Sort by due date (earliest first), then by completion status
      allAssessmentCards.sort((a, b) => {
        // Incomplete assessments first
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
        // Then sort by due date
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
      
      console.log(`🎯 Total assessments loaded: ${allAssessmentCards.length}`);
      console.log(`✅ Completed: ${allAssessmentCards.filter(a => a.isCompleted).length}`);
      console.log(`⏳ Pending: ${allAssessmentCards.filter(a => !a.isCompleted).length}`);
      
      setAssessmentCards(allAssessmentCards);
      
      if (isRefresh) {
        toast({
          title: 'Refreshed',
          description: 'Assessment list updated successfully',
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch assessments:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load assessments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchAssessmentsData(true);
  };

  const startAssessment = (assessmentId: string) => {
    navigate(`/attempt-assessment/${assessmentId}`);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredAssessments = selectedCourseFilter === 'all' 
    ? assessmentCards 
    : assessmentCards.filter(card => card.courseId === selectedCourseFilter);

  const stats = {
    totalAssessments: assessmentCards.length,
    completed: assessmentCards.filter(a => a.isCompleted).length,
    pending: assessmentCards.filter(a => !a.isCompleted).length,
    totalCourses: courses.length
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Assessments</h1>
            <p className="text-muted-foreground">View and complete your assigned assessments</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Enrolled Courses</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalCourses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Total Assessments</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.totalAssessments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-green-700 font-medium">Completed</p>
                    <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-amber-600" />
                  <div>
                    <p className="text-sm text-amber-700 font-medium">Pending</p>
                    <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Course Filter */}
        {!loading && courses.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Filter by course:</span>
            <Button
              variant={selectedCourseFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCourseFilter('all')}
            >
              All Courses ({assessmentCards.length})
            </Button>
            {courses.map(course => (
              <Button
                key={course.id}
                variant={selectedCourseFilter === course.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCourseFilter(course.id)}
              >
                {course.name} ({assessmentCards.filter(a => a.courseId === course.id).length})
              </Button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Assessments Grid */}
        {!loading && filteredAssessments.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAssessments.map((card) => (
              <Card key={card.assessmentId} className="bg-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <FileText className="h-6 w-6 text-primary mt-1" />
                      <div>
                        <CardTitle className="text-xl">{card.assessmentTitle}</CardTitle>
                        <CardDescription className="mt-1">
                          Course: {card.courseName}
                        </CardDescription>
                        {card.teacherName && (
                          <CardDescription className="text-xs">
                            Instructor: {card.teacherName}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge variant={card.isCompleted ? "default" : "outline"}>
                      {card.isCompleted ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Assessment Description */}
                  <p className="text-sm text-muted-foreground">{card.assessmentDescription}</p>
                  
                  {/* Assessment Details */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                      <Timer className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-blue-700 font-medium">Duration</p>
                        <p className="text-sm font-semibold text-blue-900">
                          {card.durationMinutes || 0} min
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                      <HelpCircle className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-purple-700 font-medium">Questions</p>
                        <p className="text-sm font-semibold text-purple-900">
                          {card.questionCount || 0}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                      <Award className="h-4 w-4 text-amber-600" />
                      <div>
                        <p className="text-xs text-amber-700 font-medium">Total Marks</p>
                        <p className="text-sm font-semibold text-amber-900">
                          {card.totalPoints || 0} pts
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Score Display (if completed and results released) */}
                  {card.isCompleted && card.resultsReleased && card.score !== undefined && card.maxScore !== undefined && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Assessment Completed</span>
                        </div>
                        <Badge variant="secondary" className="text-base bg-green-100 text-green-800">
                          {card.score}/{card.maxScore} pts
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-green-700 mb-1">
                          <span>Score</span>
                          <span>{Math.round((card.score / card.maxScore) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(card.score / card.maxScore) * 100} 
                          className="h-2 bg-green-200"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submitted but results not released */}
                  {card.isCompleted && !card.resultsReleased && (
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">Assessment Submitted</span>
                      </div>
                      <p className="text-xs text-orange-700">
                        Your assessment has been submitted. Results will be available once your instructor releases them.
                      </p>
                    </div>
                  )}

                  {/* Questions Preview Section */}
                  {card.questions && card.questions.length > 0 && (
                    <div className="border-t pt-4">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="questions" className="border-none">
                          <AccordionTrigger className="hover:no-underline py-2">
                            <div className="flex items-center gap-2">
                              <List className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold">
                                View Questions ({card.questions.length})
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 mt-2 max-h-80 overflow-y-auto pr-2">
                              {card.questions.map((question, index) => (
                                <div key={question.id} className="p-3 bg-muted/40 rounded-lg border">
                                  <div className="flex items-start gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs shrink-0">
                                      Q{index + 1}
                                    </Badge>
                                    <p className="text-sm font-medium text-foreground flex-1">
                                      {question.text}
                                    </p>
                                  </div>
                                  
                                  <div className="flex gap-2 mb-2">
                                    <Badge 
                                      variant={question.type === 'MultipleChoice' ? 'default' : 'secondary'} 
                                      className="text-xs"
                                    >
                                      {question.type === 'MultipleChoice' ? 'Multiple Choice' : 'Text Answer'}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {question.points} {question.points === 1 ? 'point' : 'points'}
                                    </Badge>
                                  </div>

                                  {/* Show options for MCQ (without revealing correct answer) */}
                                  {question.type === 'MultipleChoice' && question.options && question.options.length > 0 && (
                                    <div className="mt-2 space-y-1.5">
                                      <p className="text-xs font-medium text-muted-foreground mb-1">Options:</p>
                                      {question.options.map((option, optIndex) => (
                                        <div 
                                          key={option.id} 
                                          className="flex items-start gap-2 text-xs p-2 bg-background rounded border"
                                        >
                                          <span className="text-muted-foreground font-medium shrink-0">
                                            {String.fromCharCode(65 + optIndex)}.
                                          </span>
                                          <span className="text-foreground">{option.text}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* For text questions, just show it's a text answer */}
                                  {question.type !== 'MultipleChoice' && (
                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                      <p className="text-xs text-blue-700">
                                        This question requires a written answer.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}

                  {/* Empty Questions State */}
                  {(!card.questions || card.questions.length === 0) && !card.isCompleted && (
                    <div className="border-t pt-4">
                      <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed">
                        <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">
                          Questions will be revealed when you start the assessment
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Due Date and Action */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4 text-sm">
                      {card.dueDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">
                            {card.isCompleted ? (
                              `Submitted`
                            ) : (
                              <>
                                Due in {getDaysUntilDue(card.dueDate)} days
                                <span className="text-xs ml-1 text-muted-foreground">
                                  ({new Date(card.dueDate).toLocaleDateString()})
                                </span>
                              </>
                            )}
                          </span>
                        </div>
                      )}
                      {!card.dueDate && !card.isCompleted && (
                        <span className="text-muted-foreground text-sm">No deadline</span>
                      )}
                    </div>
                    
                    {!card.isCompleted && (
                      <Button
                        size="default"
                        onClick={() => startAssessment(card.assessmentId)}
                        className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                      >
                        <Play className="h-4 w-4" />
                        Start Assessment
                      </Button>
                    )}
                    
                    {card.isCompleted && card.resultsReleased && (
                      <Button
                        size="default"
                        variant="outline"
                        onClick={() => {
                          if (card.attempt?.id) {
                            navigate(`/review-attempt/${card.attempt.id}`);
                          } else {
                            navigate('/my-progress');
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        View My Answers
                      </Button>
                    )}
                    
                    {card.isCompleted && !card.resultsReleased && (
                      <Button
                        size="default"
                        variant="outline"
                        disabled
                        className="flex items-center gap-2 cursor-not-allowed"
                      >
                        <Clock className="h-4 w-4" />
                        Results Pending
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && assessmentCards.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Assessments Available</h3>
              <p className="text-muted-foreground text-center">
                You don't have any assessments assigned yet. Check back later or contact your instructor.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filtered Empty State */}
        {!loading && assessmentCards.length > 0 && filteredAssessments.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Assessments in This Course</h3>
              <p className="text-muted-foreground text-center">
                This course doesn't have any published assessments yet.
              </p>
              <Button
                variant="outline"
                onClick={() => setSelectedCourseFilter('all')}
                className="mt-4"
              >
                View All Assessments
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyCourses;