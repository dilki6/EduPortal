import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { courseApi, Course as ApiCourse, EnrollmentWithDetails, StudentDto } from '@/lib/api';

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
  const location = useLocation();
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

  // Handle edit course from location state
  useEffect(() => {
    if (location.state && (location.state as any).editCourseId && courses.length > 0) {
      const courseToEdit = courses.find(c => c.id === (location.state as any).editCourseId);
      if (courseToEdit) {
        setEditingCourse(courseToEdit);
        setCourseName(courseToEdit.name);
        setCourseDescription(courseToEdit.description);
        setIsEditDialogOpen(true);
        // Clear the state after using it
        window.history.replaceState({}, document.title);
      }
    }
  }, [courses, location]);

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Loading courses...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', padding: '24px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 4px 0', color: '#0f172a' }}>Courses</h1>
          <p style={{ color: '#718096', margin: '0', fontSize: '13px' }}>Create and manage your courses</p>
        </div>

        {/* Create Button */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            style={{
              padding: '8px 14px',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            + New Course
          </button>
        </div>

        {/* Courses List */}
        {courses.length === 0 ? (
          <div style={{ padding: '20px 0', color: '#718096', fontSize: '13px', textAlign: 'center' }}>
            No courses yet. Create one to get started.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {courses.map((course) => (
              <div key={course.id} style={{ padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{course.name}</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#718096' }}>{course.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openEditDialog(course)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#0066cc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id, course.name)}
                      disabled={deletingCourseId === course.id}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#e53e3e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600',
                        opacity: deletingCourseId === course.id ? 0.6 : 1
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#718096' }}>
                  {course.enrolledStudents.length} students
                </div>
                <button
                  onClick={() => openEnrollDialog(course)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '600',
                    marginTop: '6px'
                  }}
                >
                  Manage
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        {(isCreateDialogOpen || isEditDialogOpen) && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                {isEditDialogOpen ? 'Edit Course' : 'Create New Course'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>Name</label>
                  <input
                    type="text"
                    placeholder="Course name"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    style={{
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>Description</label>
                  <textarea
                    placeholder="Course description"
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    style={{
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      minHeight: '80px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={isEditDialogOpen ? handleEditCourse : handleCreateCourse}
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    opacity: isSaving ? 0.6 : 1
                  }}
                >
                  {isSaving ? 'Saving...' : isEditDialogOpen ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setIsEditDialogOpen(false);
                    setEditingCourse(null);
                    setCourseName('');
                    setCourseDescription('');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    color: '#0f172a',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enroll Student Dialog */}
        {isEnrollDialogOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              border: '1px solid #e2e8f0',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                Manage Enrollments
              </h2>
              <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#718096' }}>
                {enrollingCourse?.name}
              </p>

              <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Enroll New Student</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    disabled={isLoadingStudents}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    <option value="">Select a student...</option>
                    {getAvailableStudents().map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.email})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleEnrollStudent}
                    disabled={!selectedStudent || isEnrolling}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#0066cc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      opacity: !selectedStudent || isEnrolling ? 0.6 : 1
                    }}
                  >
                    Enroll
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                  Enrolled Students ({enrollingCourse?.enrolledStudents.length || 0})
                </h3>
                {enrollingCourse && enrollingCourse.enrolledStudents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                    {enrollingCourse.enrolledStudents.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px',
                          borderBottom: '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ flex: 1, fontSize: '12px' }}>
                          <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>{enrollment.studentName}</div>
                          <div style={{ color: '#718096', fontSize: '11px' }}>{enrollment.studentEmail}</div>
                        </div>
                        <button
                          onClick={() => handleUnenrollStudent(enrollment.id, enrollment.studentName)}
                          disabled={unenrollingId === enrollment.id}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#e53e3e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600',
                            opacity: unenrollingId === enrollment.id ? 0.6 : 1
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '12px',
                    color: '#718096',
                    fontSize: '12px',
                    textAlign: 'center'
                  }}>
                    No students enrolled yet
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setIsEnrollDialogOpen(false)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    color: '#0f172a',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;