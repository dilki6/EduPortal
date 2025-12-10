import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Calendar, Clock, Trophy, Play, Loader2, FileText, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  courseApi, 
  assessmentApi, 
  type Course, 
  type Assessment,
  type AssessmentAttempt 
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
  attempt?: AssessmentAttempt;
  score?: number;
  maxScore?: number;
}

const MyCourses: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [assessmentCards, setAssessmentCards] = useState<AssessmentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
            
            // Create a card for each assessment
            publishedAssessments.forEach((assessment) => {
              // Find attempt for this assessment
              const attempt = allAttempts.find(
                a => a.assessmentId === assessment.id && (a.status === 'Completed' || a.status === 1)
              );
              
              allAssessmentCards.push({
                assessmentId: assessment.id,
                assessmentTitle: assessment.title,
                assessmentDescription: assessment.description,
                dueDate: assessment.dueDate,
                courseId: course.id,
                courseName: course.name,
                teacherName: course.teacherName,
                isCompleted: !!attempt,
                attempt: attempt,
                score: attempt?.score,
                maxScore: attempt?.maxScore
              });
            });
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Assessments Grid */}
        {!loading && assessmentCards.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {assessmentCards.map((card) => (
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
                  
                  {/* Score Display (if completed) */}
                  {card.isCompleted && card.score !== undefined && card.maxScore !== undefined && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Assessment Completed</span>
                        </div>
                        <Badge variant="secondary" className="text-base">
                          {card.score}/{card.maxScore}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Due Date and Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      {card.dueDate && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">
                            {card.isCompleted ? (
                              `Completed`
                            ) : (
                              <>
                                Due in {getDaysUntilDue(card.dueDate)} days
                                <span className="text-xs ml-1">
                                  ({new Date(card.dueDate).toLocaleDateString()})
                                </span>
                              </>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {!card.isCompleted && (
                      <Button
                        size="sm"
                        onClick={() => startAssessment(card.assessmentId)}
                        className="flex items-center gap-2"
                      >
                        <Play className="h-4 w-4" />
                        Start
                      </Button>
                    )}
                    
                    {card.isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/my-progress`)}
                        className="flex items-center gap-2"
                      >
                        View Results
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
      </div>
    </div>
  );
};

export default MyCourses;