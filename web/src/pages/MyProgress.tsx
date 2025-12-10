import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Trophy, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AssessmentResult {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
  status: 'completed' | 'pending' | 'overdue';
}

const MyProgress: React.FC = () => {
  const [assessmentResults] = useState<AssessmentResult[]>([
    {
      id: '1',
      courseId: '1',
      courseName: 'Advanced Mathematics',
      title: 'Calculus Basics',
      score: 85,
      maxScore: 100,
      percentage: 85,
      completedAt: '2024-01-20T10:30:00Z',
      status: 'completed'
    },
    {
      id: '2',
      courseId: '1',
      courseName: 'Advanced Mathematics',
      title: 'Linear Algebra',
      score: 92,
      maxScore: 100,
      percentage: 92,
      completedAt: '2024-01-18T14:20:00Z',
      status: 'completed'
    },
    {
      id: '3',
      courseId: '2',
      courseName: 'Physics Fundamentals',
      title: 'Newton\'s Laws',
      score: 78,
      maxScore: 100,
      percentage: 78,
      completedAt: '2024-01-22T09:15:00Z',
      status: 'completed'
    },
    {
      id: '4',
      courseId: '2',
      courseName: 'Physics Fundamentals',
      title: 'Energy and Work',
      score: 0,
      maxScore: 100,
      percentage: 0,
      completedAt: '',
      status: 'pending'
    },
    {
      id: '5',
      courseId: '3',
      courseName: 'Chemistry Lab',
      title: 'Chemical Reactions',
      score: 95,
      maxScore: 100,
      percentage: 95,
      completedAt: '2024-01-19T16:45:00Z',
      status: 'completed'
    }
  ]);

  const getOverallStats = () => {
    const completed = assessmentResults.filter(result => result.status === 'completed');
    const totalScore = completed.reduce((sum, result) => sum + result.score, 0);
    const totalMaxScore = completed.reduce((sum, result) => sum + result.maxScore, 0);
    const averagePercentage = completed.length > 0 ? totalScore / totalMaxScore * 100 : 0;
    
    return {
      totalAssessments: assessmentResults.length,
      completedAssessments: completed.length,
      averageScore: Math.round(averagePercentage),
      pendingAssessments: assessmentResults.filter(result => result.status === 'pending').length
    };
  };

  const getChartData = () => {
    return assessmentResults
      .filter(result => result.status === 'completed')
      .map(result => ({
        name: result.title.substring(0, 15) + '...',
        score: result.percentage,
        course: result.courseName
      }));
  };

  const getCourseProgress = () => {
    const courseMap: { [key: string]: { total: number; completed: number; totalScore: number; maxScore: number } } = {};
    
    assessmentResults.forEach(result => {
      if (!courseMap[result.courseName]) {
        courseMap[result.courseName] = { total: 0, completed: 0, totalScore: 0, maxScore: 0 };
      }
      courseMap[result.courseName].total++;
      if (result.status === 'completed') {
        courseMap[result.courseName].completed++;
        courseMap[result.courseName].totalScore += result.score;
        courseMap[result.courseName].maxScore += result.maxScore;
      }
    });

    return Object.entries(courseMap).map(([courseName, data]) => ({
      course: courseName,
      progress: Math.round((data.completed / data.total) * 100),
      averageScore: data.completed > 0 ? Math.round((data.totalScore / data.maxScore) * 100) : 0,
      completed: data.completed,
      total: data.total
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'overdue':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const stats = getOverallStats();
  const chartData = getChartData();
  const courseProgress = getCourseProgress();

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

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
                  <p className="text-2xl font-bold">{stats.totalAssessments}</p>
                  <p className="text-sm text-muted-foreground">Total Assessments</p>
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
                <CardDescription>Your performance across all assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            {/* Course Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {courseProgress.map((course, index) => (
                <Card key={course.course}>
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
                    
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Average Score</span>
                        <span className="font-medium">{course.averageScore}%</span>
                      </div>
                      <Progress value={course.averageScore} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-6">
            {/* Assessment History */}
            <div className="space-y-4">
              {assessmentResults.map((result) => (
                <Card key={result.id} className={getStatusColor(result.status)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <h4 className="font-medium">{result.title}</h4>
                          <p className="text-sm text-muted-foreground">{result.courseName}</p>
                          {result.completedAt && (
                            <p className="text-xs text-muted-foreground">
                              Completed {new Date(result.completedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {result.status === 'completed' && (
                          <>
                            <div className="text-right">
                              <p className="font-medium">{result.score}/{result.maxScore}</p>
                              <p className="text-sm text-muted-foreground">{result.percentage}%</p>
                            </div>
                            <Badge variant={result.percentage >= 80 ? "default" : result.percentage >= 60 ? "secondary" : "destructive"}>
                              {result.percentage >= 80 ? "Excellent" : result.percentage >= 60 ? "Good" : "Needs Improvement"}
                            </Badge>
                          </>
                        )}
                        {result.status === 'pending' && (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyProgress;