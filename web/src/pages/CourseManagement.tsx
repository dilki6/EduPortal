import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, Users, Edit, Trash2, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { courseApi, Course as ApiCourse, EnrollmentWithDetails } from '@/lib/api';

interface Course {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  teacherName?: string;
  enrolledStudents: EnrollmentWithDetails[];
  createdAt: string;
}

const CourseManagement: React.FC = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [enrollingCourse, setEnrollingCourse] = useState<Course | null>(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  // Form states
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const fetchedCourses = await courseApi.getMyTeachingCourses();
      
      // Fetch enrollments for each course
      const coursesWithEnrollments = await Promise.all(
        fetchedCourses.map(async (course) => {
          try {
            const enrollments = await courseApi.getEnrollments(course.id);
            return {
              ...course,
              enrolledStudents: enrollments
            };
          } catch (error) {
            console.error(`Failed to fetch enrollments for course ${course.id}:`, error);
            return {
              ...course,
              enrolledStudents: []
            };
          }
        })
      );
      
      setCourses(coursesWithEnrollments);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!courseName.trim() || !courseDescription.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      await courseApi.create({
        name: courseName,
        description: courseDescription
      });

      toast({
        title: "Success",
        description: "Course created successfully"
      });

      setCourseName('');
      setCourseDescription('');
      setIsCreateDialogOpen(false);
      
      // Refresh courses list
      await fetchCourses();
    } catch (error) {
      console.error('Failed to create course:', error);
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCourse = async () => {
    if (!courseName.trim() || !courseDescription.trim() || !editingCourse) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      await courseApi.update(editingCourse.id, {
        name: courseName,
        description: courseDescription
      });

      toast({
        title: "Success",
        description: "Course updated successfully"
      });

      setCourseName('');
      setCourseDescription('');
      setEditingCourse(null);
      setIsEditDialogOpen(false);
      
      // Refresh courses list
      await fetchCourses();
    } catch (error) {
      console.error('Failed to update course:', error);
      toast({
        title: "Error",
        description: "Failed to update course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${courseName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingCourseId(courseId);
      
      // Optimistically remove from UI
      setCourses(prevCourses => prevCourses.filter(c => c.id !== courseId));
      
      // Make API call
      await courseApi.delete(courseId);
      
      toast({
        title: "Success",
        description: `Course "${courseName}" deleted successfully`
      });
    } catch (error) {
      console.error('Failed to delete course:', error);
      
      // Restore the course list on error
      await fetchCourses();
      
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handleEnrollStudent = () => {
    // This would need a separate API endpoint to enroll a specific student
    // For now, we'll show a message that this feature needs backend implementation
    toast({
      title: "Feature Coming Soon",
      description: "Student enrollment will be available once the backend endpoint is implemented.",
      variant: "default"
    });
    setIsEnrollDialogOpen(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    );
  }

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
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCourse} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Course
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold mb-2">No Courses Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first course
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Course
                </Button>
              </div>
            </div>
          </Card>
        ) : (
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
                      onClick={() => handleDeleteCourse(course.id, course.name)}
                      className="text-destructive hover:text-destructive"
                      disabled={deletingCourseId === course.id}
                    >
                      {deletingCourseId === course.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
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
                      {course.enrolledStudents.slice(0, 3).map((enrollment) => (
                        <Badge key={enrollment.id} variant="outline" className="text-xs">
                          {enrollment.studentName}
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
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Manage Enrollments
                </Button>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

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
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleEditCourse} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Course
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Enroll Student Dialog */}
        <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Course Enrollments</DialogTitle>
              <DialogDescription>
                Students enrolled in {enrollingCourse?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {enrollingCourse && enrollingCourse.enrolledStudents.length > 0 ? (
                <div className="space-y-2">
                  {enrollingCourse.enrolledStudents.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{enrollment.studentName}</p>
                        <p className="text-sm text-muted-foreground">{enrollment.studentEmail}</p>
                      </div>
                      <Badge variant="secondary">
                        {enrollment.progress}% Complete
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No students enrolled yet
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CourseManagement;