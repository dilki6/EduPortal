import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BookOpen, Plus, Users, Edit, Trash2, UserPlus, Loader2, Check, ChevronsUpDown, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { courseApi, Course as ApiCourse, EnrollmentWithDetails, StudentDto } from '@/lib/api';
import { cn } from '@/lib/utils';

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
  const [allStudents, setAllStudents] = useState<StudentDto[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null);

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
      
      console.log(`Fetched ${fetchedCourses.length} courses, now fetching enrollments...`);
      
      // Fetch enrollments for each course
      const coursesWithEnrollments = await Promise.all(
        fetchedCourses.map(async (course) => {
          try {
            console.log(`Fetching enrollments for course: ${course.name} (${course.id})`);
            const enrollments = await courseApi.getEnrollments(course.id);
            console.log(`✓ Course "${course.name}": ${enrollments.length} enrollments`);
            return {
              ...course,
              enrolledStudents: enrollments
            };
          } catch (error) {
            console.error(`✗ Failed to fetch enrollments for course "${course.name}" (${course.id}):`, error);
            toast({
              title: "Warning",
              description: `Could not load enrollments for "${course.name}"`,
              variant: "default"
            });
            return {
              ...course,
              enrolledStudents: []
            };
          }
        })
      );
      
      console.log('All courses with enrollments loaded:', coursesWithEnrollments);
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

  const handleEnrollStudent = async () => {
    if (!selectedStudent || !enrollingCourse) {
      toast({
        title: "Error",
        description: "Please select a student",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsEnrolling(true);
      
      await courseApi.enroll({
        studentId: selectedStudent,
        courseId: enrollingCourse.id
      });

      toast({
        title: "Success",
        description: "Student enrolled successfully"
      });

      setSelectedStudent('');
      setOpenCombobox(false);
      
      // Fetch updated enrollments for this specific course
      const updatedEnrollments = await courseApi.getEnrollments(enrollingCourse.id);
      
      // Update the enrollingCourse state with new enrollments
      setEnrollingCourse({
        ...enrollingCourse,
        enrolledStudents: updatedEnrollments
      });
      
      // Update the courses list
      setCourses(prevCourses => 
        prevCourses.map(c => 
          c.id === enrollingCourse.id 
            ? { ...c, enrolledStudents: updatedEnrollments }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to enroll student:', error);
      toast({
        title: "Error",
        description: "Failed to enroll student. Student may already be enrolled.",
        variant: "destructive"
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleUnenrollStudent = async (enrollmentId: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to unenroll ${studentName}?`)) {
      return;
    }

    if (!enrollingCourse) return;

    try {
      setUnenrollingId(enrollmentId);
      
      // Optimistically update both enrollingCourse and courses list
      const updatedEnrollments = enrollingCourse.enrolledStudents.filter(e => e.id !== enrollmentId);
      
      setEnrollingCourse({
        ...enrollingCourse,
        enrolledStudents: updatedEnrollments
      });
      
      setCourses(prevCourses => 
        prevCourses.map(c => 
          c.id === enrollingCourse.id 
            ? { ...c, enrolledStudents: updatedEnrollments }
            : c
        )
      );
      
      await courseApi.unenroll(enrollmentId);
      
      toast({
        title: "Success",
        description: `${studentName} unenrolled successfully`
      });
    } catch (error) {
      console.error('Failed to unenroll student:', error);
      
      // Restore on error by fetching fresh data
      try {
        const freshEnrollments = await courseApi.getEnrollments(enrollingCourse.id);
        setEnrollingCourse({
          ...enrollingCourse,
          enrolledStudents: freshEnrollments
        });
        setCourses(prevCourses => 
          prevCourses.map(c => 
            c.id === enrollingCourse.id 
              ? { ...c, enrolledStudents: freshEnrollments }
              : c
          )
        );
      } catch (fetchError) {
        console.error('Failed to restore enrollments:', fetchError);
      }
      
      toast({
        title: "Error",
        description: "Failed to unenroll student. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUnenrollingId(null);
    }
  };

  const fetchAllStudents = async () => {
    try {
      setIsLoadingStudents(true);
      const students = await courseApi.getAllStudents();
      setAllStudents(students);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const getAvailableStudents = () => {
    if (!enrollingCourse) return [];
    return allStudents.filter(student => 
      !enrollingCourse.enrolledStudents.some(e => e.studentId === student.id)
    );
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setCourseName(course.name);
    setCourseDescription(course.description);
    setIsEditDialogOpen(true);
  };

  const openEnrollDialog = (course: Course) => {
    setEnrollingCourse(course);
    setSelectedStudent('');
    setOpenCombobox(false);
    setIsEnrollDialogOpen(true);
    // Fetch all students when dialog opens
    fetchAllStudents();
  };

  const closeEnrollDialog = () => {
    setIsEnrollDialogOpen(false);
    setSelectedStudent('');
    setOpenCombobox(false);
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
        <Dialog open={isEnrollDialogOpen} onOpenChange={(open) => !open && closeEnrollDialog()}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Course Enrollments</DialogTitle>
              <DialogDescription>
                Manage students enrolled in {enrollingCourse?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Enroll New Student Section */}
              <div className="space-y-3 pb-4 border-b">
                <h3 className="text-sm font-semibold">Enroll New Student</h3>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCombobox}
                          className="w-full justify-between"
                          disabled={isLoadingStudents}
                        >
                          {selectedStudent
                            ? getAvailableStudents().find((student) => student.id === selectedStudent)?.name
                            : isLoadingStudents 
                              ? "Loading students..." 
                              : "Search and select a student..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Search student by name or email..." />
                          <CommandList>
                            <CommandEmpty>No student found.</CommandEmpty>
                            <CommandGroup>
                              {getAvailableStudents().map((student) => (
                                <CommandItem
                                  key={student.id}
                                  value={`${student.name} ${student.email}`}
                                  onSelect={() => {
                                    setSelectedStudent(student.id);
                                    setOpenCombobox(false);
                                  }}
                                  className="hover:bg-primary/10 cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedStudent === student.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{student.name}</span>
                                    <span className="text-xs text-muted-foreground">{student.email}</span>
                                  </div>
                                </CommandItem>
                              ))}
                              {getAvailableStudents().length === 0 && !isLoadingStudents && (
                                <CommandItem disabled>
                                  All students are already enrolled
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button 
                    onClick={handleEnrollStudent} 
                    disabled={!selectedStudent || isEnrolling || isLoadingStudents}
                  >
                    {isEnrolling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Enroll
                  </Button>
                </div>
              </div>

              {/* Enrolled Students List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">
                  Enrolled Students ({enrollingCourse?.enrolledStudents.length || 0})
                </h3>
                
                {enrollingCourse && enrollingCourse.enrolledStudents.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {enrollingCourse.enrolledStudents.map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-primary/5 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{enrollment.studentName}</p>
                          <p className="text-sm text-muted-foreground truncate">{enrollment.studentEmail}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary">
                            {enrollment.progress}% Complete
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUnenrollStudent(enrollment.id, enrollment.studentName)}
                            disabled={unenrollingId === enrollment.id}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {unenrollingId === enrollment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg bg-muted/50">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No students enrolled yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use the form above to enroll your first student
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeEnrollDialog}>
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