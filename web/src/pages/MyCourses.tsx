import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Calendar, Clock, Trophy, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: string;
  name: string;
  description: string;
  instructor: string;
  enrolledAt: string;
  progress: number;
  totalAssessments: number;
  completedAssessments: number;
  nextAssessment?: {
    id: string;
    title: string;
    dueDate: string;
  };
}

const MyCourses: React.FC = () => {
  const navigate = useNavigate();
  
  const [courses] = useState<Course[]>([
    {
      id: '1',
      name: 'Advanced Mathematics',
      description: 'Learn advanced mathematical concepts including calculus, linear algebra, and differential equations.',
      instructor: 'Dr. Sarah Johnson',
      enrolledAt: '2024-01-15',
      progress: 75,
      totalAssessments: 8,
      completedAssessments: 6,
      nextAssessment: {
        id: '1',
        title: 'Calculus Basics',
        dueDate: '2024-01-25'
      }
    },
    {
      id: '2',
      name: 'Physics Fundamentals',
      description: 'Explore the fundamental principles of physics including mechanics, thermodynamics, and electromagnetism.',
      instructor: 'Prof. Michael Chen',
      enrolledAt: '2024-01-20',
      progress: 45,
      totalAssessments: 6,
      completedAssessments: 3,
      nextAssessment: {
        id: '2',
        title: 'Newton\'s Laws',
        dueDate: '2024-01-28'
      }
    },
    {
      id: '3',
      name: 'Chemistry Lab',
      description: 'Hands-on laboratory experience with chemical reactions, analysis, and synthesis.',
      instructor: 'Dr. Emily Rodriguez',
      enrolledAt: '2024-01-10',
      progress: 90,
      totalAssessments: 5,
      completedAssessments: 5
    }
  ]);

  const startAssessment = (courseId: string, assessmentId: string) => {
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
          <p className="text-muted-foreground">Track your progress and access course materials</p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="bg-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <CardTitle className="text-xl">{course.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Instructor: {course.instructor}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {course.progress}% Complete
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Course Description */}
                <p className="text-sm text-muted-foreground">{course.description}</p>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Course Progress</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>

                {/* Assessment Progress */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span>{course.completedAssessments}/{course.totalAssessments} Assessments</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Enrolled {new Date(course.enrolledAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Next Assessment */}
                {course.nextAssessment && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">Next Assessment</h4>
                        <p className="text-sm text-muted-foreground">{course.nextAssessment.title}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-primary" />
                          <span className="text-xs text-primary">
                            Due in {getDaysUntilDue(course.nextAssessment.dueDate)} days
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => startAssessment(course.id, course.nextAssessment!.id)}
                        className="flex items-center gap-2"
                      >
                        <Play className="h-4 w-4" />
                        Start
                      </Button>
                    </div>
                  </div>
                )}

                {/* Course Complete */}
                {course.progress === 100 && !course.nextAssessment && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Course Completed!</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {courses.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Courses Enrolled</h3>
              <p className="text-muted-foreground text-center">
                You haven't enrolled in any courses yet. Contact your instructor to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyCourses;