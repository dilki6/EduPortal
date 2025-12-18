import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { courseApi, assessmentApi, type Course, type Assessment, type AssessmentAttempt } from '@/lib/api';

const TeacherAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState('all');
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchAssessments(selectedCourse);
      setSelectedAssessment('all');
      setAttempts([]);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedAssessment && selectedAssessment !== 'all') {
      fetchAttempts(selectedAssessment);
    } else {
      setAttempts([]);
    }
  }, [selectedAssessment]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      console.log('Fetching courses for analytics...');
      const data = await courseApi.getMyTeachingCourses();
      console.log('Courses loaded:', data);
      setCourses(data);
    } catch (error: any) {
      console.error('Failed to fetch courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchAssessments = async (courseId: string) => {
    try {
      setLoadingAssessments(true);
      console.log('Fetching assessments for course:', courseId);
      const data = await assessmentApi.getAllByCourse(courseId);
      console.log('Assessments loaded:', data);
      setAssessments(data.filter(a => a.isPublished));
    } catch (error: any) {
      console.error('Failed to fetch assessments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assessments',
        variant: 'destructive',
      });
    } finally {
      setLoadingAssessments(false);
    }
  };

  const fetchAttempts = async (assessmentId: string) => {
    try {
      setLoadingAttempts(true);
      console.log('Fetching attempts for assessment:', assessmentId);
      const data = await assessmentApi.getAssessmentAttempts(assessmentId);
      console.log('Attempts loaded:', data);
      setAttempts(data);
    } catch (error: any) {
      console.error('Failed to fetch attempts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attempts',
        variant: 'destructive',
      });
    } finally {
      setLoadingAttempts(false);
    }
  };

  // Analytics calculations
  const totalAttempts = attempts.length;
  const completedAttempts = attempts.filter(a => a.status === 'Completed').length;
  const inProgressAttempts = attempts.filter(a => a.status === 'InProgress').length;
  
  const averageScore = completedAttempts > 0
    ? attempts.filter(a => a.status === 'Completed').reduce((sum, a) => sum + a.score, 0) / completedAttempts
    : 0;

  const selectedAssessmentData = assessments.find(a => a.id === selectedAssessment);
  const maxPossibleScore = selectedAssessmentData?.totalPoints || 100;
  const averagePercentage = maxPossibleScore > 0 ? (averageScore / maxPossibleScore) * 100 : 0;

  // Score distribution
  const getScoreRange = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'A (90-100%)';
    if (percentage >= 80) return 'B (80-89%)';
    if (percentage >= 70) return 'C (70-79%)';
    if (percentage >= 60) return 'D (60-69%)';
    return 'F (Below 60%)';
  };

  const scoreDistribution = completedAttempts > 0 
    ? attempts
        .filter(a => a.status === 'Completed')
        .reduce((acc, attempt) => {
          const range = getScoreRange(attempt.score, attempt.maxScore);
          acc[range] = (acc[range] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    : {};

  const highestScore = completedAttempts > 0
    ? Math.max(...attempts.filter(a => a.status === 'Completed').map(a => a.score))
    : 0;

  const lowestScore = completedAttempts > 0
    ? Math.min(...attempts.filter(a => a.status === 'Completed').map(a => a.score))
    : 0;

  // Pass/Fail rate (assuming 60% is passing)
  const passingPercentage = 60;
  const passedStudents = attempts.filter(a => 
    a.status === 'Completed' && (a.score / a.maxScore) * 100 >= passingPercentage
  ).length;
  const failedStudents = completedAttempts - passedStudents;
  const passRate = completedAttempts > 0 ? (passedStudents / completedAttempts) * 100 : 0;

  // Course-level analytics
  const courseStats = selectedCourse && selectedAssessment === 'all' ? (() => {
    const courseAssessments = assessments;
    const totalPublished = courseAssessments.filter(a => a.isPublished).length;
    const totalDraft = courseAssessments.filter(a => !a.isPublished).length;
    const totalQuestions = courseAssessments.reduce((sum, a) => sum + (a.questionCount || 0), 0);
    const totalPoints = courseAssessments.reduce((sum, a) => sum + (a.totalPoints || 0), 0);

    return {
      totalAssessments: courseAssessments.length,
      published: totalPublished,
      draft: totalDraft,
      totalQuestions,
      totalPoints,
    };
  })() : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teacher Analytics</h1>
          <p className="text-muted-foreground">Analyze student performance and assessment statistics</p>
        </div>

        {/* Debug Info - Remove in production */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm">
              <strong>Debug:</strong> Courses: {courses.length} | 
              Selected Course: {selectedCourse || 'None'} | 
              Assessments: {assessments.length} | 
              Selected Assessment: {selectedAssessment || 'None'} | 
              Attempts: {attempts.length}
            </p>
          </CardContent>
        </Card>

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
            <label className="text-sm font-medium mb-2 block">Select Assessment (Optional)</label>
            <Select 
              value={selectedAssessment} 
              onValueChange={setSelectedAssessment}
              disabled={!selectedCourse || loadingAssessments}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !selectedCourse ? "Select a course first" : 
                  loadingAssessments ? "Loading assessments..." : 
                  "All assessments or choose one"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assessments</SelectItem>
                {assessments.map((assessment) => (
                  <SelectItem key={assessment.id} value={assessment.id}>
                    {assessment.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Course-Level Analytics */}
        {selectedCourse && selectedAssessment === 'all' && courseStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{courseStats.totalAssessments}</p>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {courseStats.published} Published
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {courseStats.draft} Draft
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{courseStats.totalQuestions}</p>
                  <AlertCircle className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Across all assessments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{courseStats.totalPoints}</p>
                  <Award className="h-8 w-8 text-amber-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Maximum possible points</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Course Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Course Name:</span>
                    <BookOpen className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="text-lg font-bold">
                    {courses.find(c => c.id === selectedCourse)?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {courses.find(c => c.id === selectedCourse)?.description || 'No description'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Assessment-Level Analytics */}
        {selectedAssessment && selectedAssessment !== 'all' && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Attempts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold">{totalAttempts}</p>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {completedAttempts} Completed
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {inProgressAttempts} In Progress
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold">
                      {averagePercentage.toFixed(1)}%
                    </p>
                    <BarChart3 className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {averageScore.toFixed(1)} / {maxPossibleScore} points
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold">{passRate.toFixed(1)}%</p>
                    {passRate >= 70 ? (
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-500" />
                    )}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline" className="text-xs bg-green-50">
                      {passedStudents} Passed
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-red-50">
                      {failedStudents} Failed
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Score Range</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Highest:</span>
                      <span className="font-semibold text-green-600">{highestScore}/{maxPossibleScore}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Lowest:</span>
                      <span className="font-semibold text-red-600">{lowestScore}/{maxPossibleScore}</span>
                    </div>
                  </div>
                  <Award className="h-8 w-8 text-amber-500 mt-2 ml-auto" />
                </CardContent>
              </Card>
            </div>

            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Grade Distribution
                </CardTitle>
                <CardDescription>Breakdown of student performance by grade ranges</CardDescription>
              </CardHeader>
              <CardContent>
                {completedAttempts > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(scoreDistribution).map(([range, count]) => {
                      const percentage = (count / completedAttempts) * 100;
                      const color = 
                        range.startsWith('A') ? 'bg-green-500' :
                        range.startsWith('B') ? 'bg-blue-500' :
                        range.startsWith('C') ? 'bg-yellow-500' :
                        range.startsWith('D') ? 'bg-orange-500' :
                        'bg-red-500';

                      return (
                        <div key={range}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{range}</span>
                            <span className="text-sm text-muted-foreground">
                              {count} student{count !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`${color} h-2 rounded-full transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No completed attempts yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Student Performance List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Student Performance
                </CardTitle>
                <CardDescription>Individual student scores and status</CardDescription>
              </CardHeader>
              <CardContent>
                {totalAttempts > 0 ? (
                  <div className="space-y-2">
                    {attempts.map((attempt) => {
                      const percentage = (attempt.score / attempt.maxScore) * 100;
                      const isPassing = percentage >= passingPercentage;
                      const isCompleted = attempt.status === 'Completed';

                      return (
                        <div 
                          key={attempt.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isCompleted ? (
                              isPassing ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )
                            ) : (
                              <Clock className="h-5 w-5 text-orange-500" />
                            )}
                            <div>
                              <p className="font-medium">{attempt.studentName}</p>
                              <p className="text-xs text-muted-foreground">
                                {attempt.status === 'Completed' 
                                  ? `Completed on ${new Date(attempt.completedAt!).toLocaleDateString()}`
                                  : `Started on ${new Date(attempt.startedAt).toLocaleDateString()}`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {attempt.score} / {attempt.maxScore}
                            </p>
                            {isCompleted && (
                              <Badge 
                                variant={isPassing ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {percentage.toFixed(1)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No student attempts yet
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!selectedCourse && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">Select a Course to View Analytics</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Choose a course from the dropdown above to view comprehensive analytics and insights
                  about your assessments and student performance.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedCourse && assessments.length === 0 && !loadingAssessments && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">No Published Assessments</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  This course doesn't have any published assessments yet. Create and publish assessments
                  to start tracking student performance.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeacherAnalytics;
