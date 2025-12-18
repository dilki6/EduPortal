import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, FileText, BarChart3, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { progressApi, courseApi, assessmentApi } from '@/lib/api';
import type { StudentProgress, CourseProgressDto, AssessmentAttempt, Course } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const StudentDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<StudentProgress | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<AssessmentAttempt[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [progress, courses, attempts] = await Promise.all([
        progressApi.getStudentProgress(),
        courseApi.getMyEnrolledCourses(),
        assessmentApi.getStudentAttempts()
      ]);
      
      setProgressData(progress);
      setEnrolledCourses(courses);
      setRecentAttempts(attempts.slice(0, 4)); // Get latest 4 attempts
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = {
    enrolledCourses: progressData?.totalCourses || 0,
    completedAssessments: progressData?.completedAssessments || 0,
    pendingAssessments: progressData?.pendingAssessments || 0,
    averageScore: progressData?.averageScore || 0
  };

  // Get courses with their progress from progressData
  const coursesWithProgress = enrolledCourses.map(course => {
    const courseProgress = progressData?.courseProgress.find(cp => cp.courseId === course.id);
    return {
      ...course,
      progress: courseProgress?.progress || 0,
      completedAssessments: courseProgress?.completedAssessments || 0,
      totalAssessments: courseProgress?.totalAssessments || 0,
      averageScore: courseProgress?.averageScore || 0
    };
  });

  // Get upcoming assessments from enrolled courses
  const getUpcomingDeadlines = () => {
    // This would need assessment data with due dates - placeholder for now
    return [];
  };

  const getAssessmentStatus = (attempt: AssessmentAttempt) => {
    if (attempt.status === 'Completed' && attempt.resultsReleased) {
      return 'completed';
    } else if (attempt.status === 'Completed' && !attempt.resultsReleased) {
      return 'pending';
    } else if (attempt.status === 'InProgress') {
      return 'in-progress';
    }
    return 'not-started';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground">Track your progress and stay on top of your coursework</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.enrolledCourses}</div>
              <p className="text-xs text-muted-foreground">Active enrollments</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.completedAssessments}</div>
              <p className="text-xs text-muted-foreground">Assessments done</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.pendingAssessments}</div>
              <p className="text-xs text-muted-foreground">Assessments due</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {stats.averageScore}%
              </div>
              <p className="text-xs text-muted-foreground">Overall performance</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrolled Courses */}
          <Card>
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>Your enrolled courses and progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {coursesWithProgress.length > 0 ? (
                <>
                  {coursesWithProgress.slice(0, 3).map((course) => (
                    <div key={course.id} className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground">{course.name}</h4>
                        <span className="text-sm text-muted-foreground">{Math.round(course.progress)}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {course.completedAssessments} of {course.totalAssessments} assessments completed
                        </span>
                        {course.averageScore > 0 && (
                          <span className="text-primary font-medium">Avg: {Math.round(course.averageScore)}%</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <Link to="/my-courses">
                    <Button variant="outline" className="w-full">
                      View All Courses
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No enrolled courses yet</p>
                  <Link to="/my-courses">
                    <Button variant="outline" className="mt-4">
                      Browse Courses
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Assessments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>Your latest assessment results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentAttempts.length > 0 ? (
                recentAttempts.map((attempt) => {
                  const status = getAssessmentStatus(attempt);
                  const percentage = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
                  
                  return (
                    <div key={attempt.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{attempt.assessmentTitle}</h4>
                        <p className="text-sm text-muted-foreground">{attempt.courseName}</p>
                      </div>
                      <div className="text-right">
                        {status === 'completed' && (
                          <>
                            <div className="text-lg font-bold text-secondary">{percentage}%</div>
                            <div className="flex items-center text-xs text-secondary">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </div>
                          </>
                        )}
                        {status === 'pending' && (
                          <div className="flex items-center text-xs text-accent">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending Review
                          </div>
                        )}
                        {status === 'in-progress' && (
                          <div className="flex items-center text-xs text-primary">
                            <Clock className="h-3 w-3 mr-1" />
                            In Progress
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No assessments attempted yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest course activities and assessments</CardDescription>
          </CardHeader>
          <CardContent>
            {coursesWithProgress.length > 0 ? (
              <div className="space-y-3">
                {coursesWithProgress.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        course.progress >= 80 ? 'bg-secondary' :
                        course.progress >= 50 ? 'bg-accent' : 'bg-primary'
                      }`} />
                      <div>
                        <h4 className="font-medium text-foreground">{course.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {course.completedAssessments} of {course.totalAssessments} assessments completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">{Math.round(course.progress)}% Complete</div>
                      {course.averageScore > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Average: {Math.round(course.averageScore)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No activity yet. Enroll in courses to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Quick access to common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/my-courses">
                <Button variant="card" className="h-20 flex-col space-y-2 w-full">
                  <BookOpen className="h-6 w-6" />
                  <span>Browse Courses</span>
                </Button>
              </Link>
              <Link to="/attempt-assessment">
                <Button variant="card" className="h-20 flex-col space-y-2 w-full">
                  <FileText className="h-6 w-6" />
                  <span>Take Assessment</span>
                </Button>
              </Link>
              <Link to="/analytics-student">
                <Button variant="card" className="h-20 flex-col space-y-2 w-full">
                  <BarChart3 className="h-6 w-6" />
                  <span>View Progress</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;