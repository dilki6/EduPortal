import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, FileText, BarChart3, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  // Mock data - in real app, this would come from an API
  const stats = {
    enrolledCourses: 3,
    completedAssessments: 8,
    pendingAssessments: 4,
    averageScore: 85
  };

  const enrolledCourses = [
    { 
      id: 1, 
      name: 'Advanced Mathematics', 
      progress: 75, 
      nextAssessment: 'Calculus Quiz',
      dueDate: 'Tomorrow'
    },
    { 
      id: 2, 
      name: 'Physics Fundamentals', 
      progress: 60, 
      nextAssessment: 'Motion Problems',
      dueDate: '3 days'
    },
    { 
      id: 3, 
      name: 'Chemistry Lab', 
      progress: 90, 
      nextAssessment: 'Organic Chemistry Test',
      dueDate: '1 week'
    }
  ];

  const recentAssessments = [
    { id: 1, course: 'Advanced Mathematics', title: 'Algebra Test', score: 92, status: 'completed' },
    { id: 2, course: 'Physics Fundamentals', title: 'Mechanics Quiz', score: 78, status: 'completed' },
    { id: 3, course: 'Chemistry Lab', title: 'Periodic Table', score: null, status: 'pending' },
    { id: 4, course: 'Advanced Mathematics', title: 'Geometry Assignment', score: null, status: 'overdue' }
  ];

  const upcomingDeadlines = [
    { id: 1, course: 'Advanced Mathematics', title: 'Calculus Quiz', dueDate: 'Tomorrow', priority: 'high' },
    { id: 2, course: 'Physics Fundamentals', title: 'Motion Problems', dueDate: '3 days', priority: 'medium' },
    { id: 3, course: 'Chemistry Lab', title: 'Lab Report', dueDate: '1 week', priority: 'low' }
  ];

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
              {enrolledCourses.map((course) => (
                <div key={course.id} className="space-y-3 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">{course.name}</h4>
                    <span className="text-sm text-muted-foreground">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Next: {course.nextAssessment}</span>
                    <span className="text-accent font-medium">Due: {course.dueDate}</span>
                  </div>
                </div>
              ))}
              <Link to="/my-courses">
                <Button variant="outline" className="w-full">
                  View All Courses
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Assessments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>Your latest assessment results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentAssessments.map((assessment) => (
                <div key={assessment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">{assessment.title}</h4>
                    <p className="text-sm text-muted-foreground">{assessment.course}</p>
                  </div>
                  <div className="text-right">
                    {assessment.status === 'completed' && (
                      <>
                        <div className="text-lg font-bold text-secondary">{assessment.score}%</div>
                        <div className="flex items-center text-xs text-secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </div>
                      </>
                    )}
                    {assessment.status === 'pending' && (
                      <div className="flex items-center text-xs text-accent">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending Review
                      </div>
                    )}
                    {assessment.status === 'overdue' && (
                      <div className="flex items-center text-xs text-destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Overdue
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Stay on track with your assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      deadline.priority === 'high' ? 'bg-destructive' :
                      deadline.priority === 'medium' ? 'bg-accent' : 'bg-secondary'
                    }`} />
                    <div>
                      <h4 className="font-medium text-foreground">{deadline.title}</h4>
                      <p className="text-sm text-muted-foreground">{deadline.course}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">{deadline.dueDate}</div>
                    <div className={`text-xs capitalize ${
                      deadline.priority === 'high' ? 'text-destructive' :
                      deadline.priority === 'medium' ? 'text-accent' : 'text-secondary'
                    }`}>
                      {deadline.priority} priority
                    </div>
                  </div>
                </div>
              ))}
            </div>
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