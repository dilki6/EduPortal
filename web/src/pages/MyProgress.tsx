import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Trophy, Clock, CheckCircle, XCircle, Loader2, BookOpen } from 'lucide-react';
import { progressApi, assessmentApi } from '@/lib/api';
import type { CourseProgressDto } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  courseName?: string;
  score: number;
  maxScore: number;
  completedAt?: string;
  status: string;
  resultsReleased?: boolean;
}

interface ProgressData {
  studentId: string;
  studentName: string;
  totalCourses: number;
  completedAssessments: number;
  pendingAssessments: number;
  averageScore: number;
  courseProgress: CourseProgressDto[];
}

const MyProgress: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const [progress, studentAttempts] = await Promise.all([
        progressApi.getStudentProgress(),
        assessmentApi.getStudentAttempts()
      ]);
      
      setProgressData(progress);
      setAttempts(studentAttempts);
    } catch (error: any) {
      console.error('Failed to fetch progress data:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load progress data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Progress Data</h3>
            <p className="text-muted-foreground">Unable to load your progress information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getOverallStats = () => {
    return {
      totalAssessments: progressData.completedAssessments + progressData.pendingAssessments,
      completedAssessments: progressData.completedAssessments,
      averageScore: Math.round(progressData.averageScore),
      pendingAssessments: progressData.pendingAssessments,
      totalCourses: progressData.totalCourses
    };
  };

  const getChartData = () => {
    return attempts
      .filter(attempt => attempt.status === 'Completed' && attempt.resultsReleased)
      .slice(-10) // Last 10 assessments
      .map(attempt => ({
        name: attempt.assessmentTitle.length > 15 
          ? attempt.assessmentTitle.substring(0, 15) + '...' 
          : attempt.assessmentTitle,
        score: attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0,
        fullTitle: attempt.assessmentTitle
      }));
  };

  const getAssessmentsList = () => {
    return attempts.map(attempt => ({
      id: attempt.id,
      title: attempt.assessmentTitle,
      courseName: attempt.courseName || 'Unknown Course',
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0,
      completedAt: attempt.completedAt,
      status: attempt.status === 'Completed' && attempt.resultsReleased ? 'completed' : 
              attempt.status === 'Completed' && !attempt.resultsReleased ? 'pending-release' :
              attempt.status === 'InProgress' ? 'in-progress' : 'pending',
      resultsReleased: attempt.resultsReleased
    }));
  };

  const getCourseProgress = () => {
    return progressData.courseProgress.map(course => ({
      course: course.courseName,
      progress: course.progress,
      averageScore: course.averageScore ? Math.round(course.averageScore) : 0,
      completed: course.completedAssessments,
      total: course.totalAssessments
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending-release':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in-progress':
        return 'bg-blue-50 border-blue-200';
      case 'pending-release':
        return 'bg-yellow-50 border-yellow-200';
      case 'pending':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'pending-release':
        return 'Pending Results';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const stats = getOverallStats();
  const chartData = getChartData();
  const courseProgress = getCourseProgress();
  const assessmentsList = getAssessmentsList();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Progress</h1>
          <p className="text-muted-foreground">Track your academic performance and achievements</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.averageScore}%</p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.completedAssessments}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingAssessments}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalCourses}</p>
                  <p className="text-sm text-muted-foreground">Enrolled Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Course Progress</TabsTrigger>
            <TabsTrigger value="assessments">Assessment History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Scores</CardTitle>
                <CardDescription>
                  {chartData.length > 0 
                    ? `Your performance across your last ${chartData.length} assessments`
                    : 'No completed assessments yet'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">{payload[0].payload.fullTitle}</p>
                                <p className="text-primary font-semibold">{payload[0].value}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="score" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Complete assessments to see your performance chart</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            {/* Course Progress */}
            {courseProgress.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {courseProgress.map((course, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{course.course}</CardTitle>
                      <CardDescription>
                        {course.completed}/{course.total} assessments completed
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Course Progress</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                      
                      {course.averageScore > 0 && (
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span>Average Score</span>
                            <span className="font-medium">{course.averageScore}%</span>
                          </div>
                          <Progress value={course.averageScore} className="h-2" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Courses Yet</h3>
                  <p className="text-muted-foreground">Enroll in courses to start tracking your progress</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="assessments" className="space-y-6">
            {/* Assessment History */}
            {assessmentsList.length > 0 ? (
              <div className="space-y-4">
                {assessmentsList.map((result) => (
                  <Card key={result.id} className={getStatusColor(result.status)}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <h4 className="font-medium">{result.title}</h4>
                            <p className="text-sm text-muted-foreground">{result.courseName}</p>
                            {result.completedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Completed {new Date(result.completedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {result.status === 'completed' && result.resultsReleased && (
                            <>
                              <div className="text-right">
                                <p className="font-medium">{result.score}/{result.maxScore}</p>
                                <p className="text-sm text-muted-foreground">{result.percentage}%</p>
                              </div>
                              <Badge variant={
                                result.percentage >= 80 ? "default" : 
                                result.percentage >= 60 ? "secondary" : 
                                "destructive"
                              }>
                                {result.percentage >= 80 ? "Excellent" : 
                                 result.percentage >= 60 ? "Good" : 
                                 "Needs Improvement"}
                              </Badge>
                            </>
                          )}
                          {result.status === 'pending-release' && (
                            <Badge variant="outline" className="bg-yellow-50">
                              Results Pending
                            </Badge>
                          )}
                          {result.status === 'in-progress' && (
                            <Badge variant="outline" className="bg-blue-50">
                              In Progress
                            </Badge>
                          )}
                          {result.status === 'pending' && (
                            <Badge variant="outline">Not Started</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Assessments Yet</h3>
                  <p className="text-muted-foreground">Complete assessments to see your history here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyProgress;