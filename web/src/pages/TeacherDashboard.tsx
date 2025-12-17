import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, FileText, BarChart3, Plus, TrendingUp, Loader2 } from 'lucide-react';
import { courseApi, assessmentApi } from '@/lib/api';
import type { Course, Assessment, EnrollmentWithDetails, AssessmentAttempt } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CourseWithDetails extends Course {
  studentCount: number;
  assessmentCount: number;
}

const TeacherDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseWithDetails[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pendingEvaluations, setPendingEvaluations] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch courses and assessments
      const [teacherCourses, teacherAssessments] = await Promise.all([
        courseApi.getMyTeachingCourses(),
        assessmentApi.getMyTeachingAssessments()
      ]);

      // Fetch enrollments and attempts for each course
      const coursesWithDetails = await Promise.all(
        teacherCourses.map(async (course) => {
          try {
            const enrollments = await courseApi.getEnrollments(course.id);
            const courseAssessments = teacherAssessments.filter(a => a.courseId === course.id);
            
            return {
              ...course,
              studentCount: enrollments.length,
              assessmentCount: courseAssessments.length
            };
          } catch (error) {
            console.error(`Failed to fetch details for course ${course.id}:`, error);
            return {
              ...course,
              studentCount: 0,
              assessmentCount: 0
            };
          }
        })
      );

      // Calculate total students (unique across all courses)
      const allEnrollments = await Promise.all(
        teacherCourses.map(course => 
          courseApi.getEnrollments(course.id).catch(() => [])
        )
      );
      const uniqueStudentIds = new Set(
        allEnrollments.flat().map(enrollment => enrollment.studentId)
      );

      // Calculate pending evaluations (attempts that are completed but not released)
      let pending = 0;
      for (const assessment of teacherAssessments) {
        try {
          const attempts = await assessmentApi.getAssessmentAttempts(assessment.id);
          const completedUnreleased = attempts.filter(
            attempt => attempt.status === 'Completed' && !assessment.resultsReleased
          );
          pending += completedUnreleased.length;
        } catch (error) {
          console.error(`Failed to fetch attempts for assessment ${assessment.id}:`, error);
        }
      }

      setCourses(coursesWithDetails);
      setAssessments(teacherAssessments);
      setTotalStudents(uniqueStudentIds.size);
      setPendingEvaluations(pending);
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
    totalCourses: courses.length,
    totalStudents: totalStudents,
    totalAssessments: assessments.length,
    pendingEvaluations: pendingEvaluations
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses, assessments, and track student progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">Active courses</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assessments</CardTitle>
              <FileText className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.totalAssessments}</div>
              <p className="text-xs text-muted-foreground">Created assessments</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <TrendingUp className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.pendingEvaluations}</div>
              <p className="text-xs text-muted-foreground">Evaluations needed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Courses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Courses</CardTitle>
                <CardDescription>Manage and monitor your active courses</CardDescription>
              </div>
              <Link to="/course-management">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {courses.length > 0 ? (
                <>
                  {courses.slice(0, 3).map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">{course.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {course.studentCount} student{course.studentCount !== 1 ? 's' : ''} • {course.assessmentCount} assessment{course.assessmentCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Link to="/course-management">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                  <Link to="/course-management">
                    <Button variant="outline" className="w-full">
                      View All Courses
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">No courses created yet</p>
                  <Link to="/course-management">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Course
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest courses and assessments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {courses.length > 0 || assessments.length > 0 ? (
                <>
                  {/* Show recent assessments */}
                  {assessments.slice(0, 2).map((assessment) => (
                    <div key={`assessment-${assessment.id}`} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {assessment.isPublished ? 'Published' : 'Created'} assessment: {assessment.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(assessment.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show recent courses */}
                  {courses.slice(0, 2).map((course) => (
                    <div key={`course-${course.id}`} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        <BookOpen className="h-4 w-4 text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {course.studentCount > 0 
                            ? `${course.studentCount} student${course.studentCount !== 1 ? 's' : ''} enrolled in ${course.name}`
                            : `Course created: ${course.name}`
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(course.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Show pending evaluations if any */}
                  {pendingEvaluations > 0 && (
                    <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        <BarChart3 className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {pendingEvaluations} assessment{pendingEvaluations !== 1 ? 's' : ''} pending evaluation
                        </p>
                        <p className="text-xs text-muted-foreground">Needs attention</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No activity yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Create courses and assessments to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/course-management">
                <Button variant="card" className="h-20 flex-col space-y-2 w-full">
                  <BookOpen className="h-6 w-6" />
                  <span>Manage Courses</span>
                </Button>
              </Link>
              <Link to="/assessment-management">
                <Button variant="card" className="h-20 flex-col space-y-2 w-full">
                  <FileText className="h-6 w-6" />
                  <span>Create Assessment</span>
                </Button>
              </Link>
              <Link to="/review-answers">
                <Button variant="card" className="h-20 flex-col space-y-2 w-full">
                  <Users className="h-6 w-6" />
                  <span>Review Answers</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;