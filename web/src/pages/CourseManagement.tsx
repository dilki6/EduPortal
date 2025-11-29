import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, Users, Edit, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  name: string;
  description: string;
  enrolledStudents: string[];
  createdAt: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

const CourseManagement: React.FC = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([
    {
      id: '1',
      name: 'Advanced Mathematics',
      description: 'Advanced calculus and linear algebra concepts',
      enrolledStudents: ['2', '3'],
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Physics Fundamentals',
      description: 'Basic principles of physics and mechanics',
      enrolledStudents: ['3'],
      createdAt: '2024-01-20'
    }
  ]);

  const [students] = useState<Student[]>([
    { id: '2', name: 'Alex Chen', email: 'alex.chen@student.edu' },
    { id: '3', name: 'Emily Davis', email: 'emily.davis@student.edu' },
    { id: '4', name: 'John Smith', email: 'john.smith@student.edu' },
    { id: '5', name: 'Sarah Wilson', email: 'sarah.wilson@student.edu' }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [enrollingCourse, setEnrollingCourse] = useState<Course | null>(null);
  const [selectedStudent, setSelectedStudent] = useState('');

  // Form states
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');

  const handleCreateCourse = () => {
    if (!courseName.trim() || !courseDescription.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const newCourse: Course = {
      id: Date.now().toString(),
      name: courseName,
      description: courseDescription,
      enrolledStudents: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    setCourses([...courses, newCourse]);
    setCourseName('');
    setCourseDescription('');
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Course created successfully"
    });
  };

  const handleEditCourse = () => {
    if (!courseName.trim() || !courseDescription.trim() || !editingCourse) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setCourses(courses.map(course => 
      course.id === editingCourse.id 
        ? { ...course, name: courseName, description: courseDescription }
        : course
    ));

    setCourseName('');
    setCourseDescription('');
    setEditingCourse(null);
    setIsEditDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Course updated successfully"
    });
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourses(courses.filter(course => course.id !== courseId));
    toast({
      title: "Success",
      description: "Course deleted successfully"
    });
  };

  const handleEnrollStudent = () => {
    if (!selectedStudent || !enrollingCourse) {
      toast({
        title: "Error",
        description: "Please select a student",
        variant: "destructive"
      });
      return;
    }

    setCourses(courses.map(course => 
      course.id === enrollingCourse.id 
        ? { ...course, enrolledStudents: [...course.enrolledStudents, selectedStudent] }
        : course
    ));

    setSelectedStudent('');
    setEnrollingCourse(null);
    setIsEnrollDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Student enrolled successfully"
    });
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setCourseName(course.name);
    setCourseDescription(course.description);
    setIsEditDialogOpen(true);
  };

  const openEnrollDialog = (course: Course) => {
    setEnrollingCourse(course);
    setIsEnrollDialogOpen(true);
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown Student';
  };

  const getAvailableStudents = (course: Course) => {
    return students.filter(student => !course.enrolledStudents.includes(student.id));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Course Management</h1>
            <p className="text-muted-foreground">Create and manage your courses</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Add a new course to your curriculum
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="course-name">Course Name</Label>
                  <Input
                    id="course-name"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="Enter course name"
                  />
                </div>
                <div>
                  <Label htmlFor="course-description">Course Description</Label>
                  <Textarea
                    id="course-description"
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    placeholder="Enter course description"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCourse}>Create Course</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(course)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-xl">{course.name}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {course.enrolledStudents.length} students
                    </span>
                  </div>
                  <Badge variant="secondary">
                    Created {new Date(course.createdAt).toLocaleDateString()}
                  </Badge>
                </div>

                {course.enrolledStudents.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Enrolled Students:</p>
                    <div className="space-y-1">
                      {course.enrolledStudents.slice(0, 3).map((studentId) => (
                        <Badge key={studentId} variant="outline" className="text-xs">
                          {getStudentName(studentId)}
                        </Badge>
                      ))}
                      {course.enrolledStudents.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{course.enrolledStudents.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => openEnrollDialog(course)}
                  disabled={getAvailableStudents(course).length === 0}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enroll Student
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Course Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>
                Update course information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-course-name">Course Name</Label>
                <Input
                  id="edit-course-name"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Enter course name"
                />
              </div>
              <div>
                <Label htmlFor="edit-course-description">Course Description</Label>
                <Textarea
                  id="edit-course-description"
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Enter course description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditCourse}>Update Course</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Enroll Student Dialog */}
        <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enroll Student</DialogTitle>
              <DialogDescription>
                Add a student to {enrollingCourse?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="student-select">Select Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student to enroll" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollingCourse && getAvailableStudents(enrollingCourse).map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEnrollStudent}>Enroll Student</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CourseManagement;