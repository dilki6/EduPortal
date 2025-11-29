import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, FileText, BarChart3, Plus, TrendingUp } from 'lucide-react';

const TeacherDashboard: React.FC = () => {
  // Mock data - in real app, this would come from an API
  const stats = {
    totalCourses: 3,
    totalStudents: 45,
    totalAssessments: 12,
    pendingEvaluations: 8
  };

  const recentCourses = [
    { id: 1, name: 'Advanced Mathematics', students: 20, assessments: 5 },
    { id: 2, name: 'Physics Fundamentals', students: 15, assessments: 4 },
    { id: 3, name: 'Chemistry Lab', students: 10, assessments: 3 }
  ];

  const recentActivity = [
    { id: 1, type: 'assessment', message: 'New assessment submitted in Advanced Mathematics', time: '2 hours ago' },
    { id: 2, type: 'student', message: '3 new students enrolled in Physics Fundamentals', time: '4 hours ago' },
    { id: 3, type: 'evaluation', message: '5 assessments pending evaluation', time: '6 hours ago' }
  ];

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
              {recentCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">{course.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {course.students} students • {course.assessments} assessments
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              ))}
              <Link to="/course-management">
                <Button variant="outline" className="w-full">
                  View All Courses
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Stay updated with latest activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === 'assessment' && <FileText className="h-4 w-4 text-primary" />}
                    {activity.type === 'student' && <Users className="h-4 w-4 text-secondary" />}
                    {activity.type === 'evaluation' && <BarChart3 className="h-4 w-4 text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
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