import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [enrollingCourse, setEnrollingCourse] = useState<Course | null>(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCourseId, setDeletetingCourseId] = useState<string | null>(null);
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Loading courses...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Course Management</h1>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '12px' }}>Create and manage your courses</p>

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            style={{ padding: '8px 12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}
          >
            + Create Course
          </button>
        </div>

        {/* Courses List */}
        {courses.length === 0 ? (
          <div style={{ border: '1px solid #ddd', padding: '40px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>No Courses Yet</div>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Get started by creating your first course</p>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              style={{ padding: '8px 12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}
            >
              Create Your First Course
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
            {courses.map((course) => (
              <div key={course.id} style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{course.name}</h3>
                    <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#666' }}>{course.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => openEditDialog(course)}
                      style={{ padding: '4px 8px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id, course.name)}
                      disabled={deletingCourseId === course.id}
                      style={{ padding: '4px 8px', backgroundColor: '#FF6B6B', color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>
                  {course.enrolledStudents.length} students enrolled
                </div>

                {course.enrolledStudents.length > 0 && (
                  <div style={{ marginBottom: '10px', fontSize: '11px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Students:</div>
                    {course.enrolledStudents.slice(0, 2).map((enrollment) => (
                      <div key={enrollment.id} style={{ fontSize: '10px', color: '#666', marginBottom: '3px' }}>
                        • {enrollment.studentName}
                      </div>
                    ))}
                    {course.enrolledStudents.length > 2 && (
                      <div style={{ fontSize: '10px', color: '#999' }}>
                        +{course.enrolledStudents.length - 2} more
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => openEnrollDialog(course)}
                  style={{ width: '100%', padding: '6px', backgroundColor: '#ddd', border: '1px solid #999', cursor: 'pointer', fontSize: '11px' }}
                >
                  Manage Enrollments
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create Course Dialog */}
        {isCreateDialogOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', border: '1px solid #ccc', padding: '20px', maxWidth: '400px', width: '90%' }}>
              <h2 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>Create New Course</h2>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Course Name</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Enter course name"
                  style={{ width: '100%', padding: '6px', border: '1px solid #999', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Course Description</label>
                <textarea
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Enter course description"
                  style={{ width: '100%', padding: '6px', border: '1px solid #999', fontSize: '12px', boxSizing: 'border-box', minHeight: '80px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsCreateDialogOpen(false)}
                  style={{ padding: '6px 12px', backgroundColor: '#ddd', border: '1px solid #999', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCourse}
                  disabled={isSaving}
                  style={{ padding: '6px 12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Course Dialog */}
        {isEditDialogOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', border: '1px solid #ccc', padding: '20px', maxWidth: '400px', width: '90%' }}>
              <h2 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>Edit Course</h2>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Course Name</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Enter course name"
                  style={{ width: '100%', padding: '6px', border: '1px solid #999', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Course Description</label>
                <textarea
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Enter course description"
                  style={{ width: '100%', padding: '6px', border: '1px solid #999', fontSize: '12px', boxSizing: 'border-box', minHeight: '80px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsEditDialogOpen(false)}
                  style={{ padding: '6px 12px', backgroundColor: '#ddd', border: '1px solid #999', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditCourse}
                  disabled={isSaving}
                  style={{ padding: '6px 12px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enroll Student Dialog */}
        {isEnrollDialogOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', border: '1px solid #ccc', padding: '20px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
              <h2 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>Manage Enrollments</h2>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>{enrollingCourse?.name}</p>

              <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold' }}>Enroll New Student</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    disabled={isLoadingStudents}
                    style={{ flex: 1, padding: '6px', border: '1px solid #999', fontSize: '12px', cursor: 'pointer' }}
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
                    style={{ padding: '6px 12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Enroll
                  </button>
                </div>
              </div>

              <div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold' }}>Enrolled Students ({enrollingCourse?.enrolledStudents.length || 0})</h3>
                {enrollingCourse && enrollingCourse.enrolledStudents.length > 0 ? (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {enrollingCourse.enrolledStudents.map((enrollment) => (
                      <div key={enrollment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', border: '1px solid #eee', marginBottom: '5px', backgroundColor: '#f9f9f9' }}>
                        <div style={{ flex: 1, fontSize: '11px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{enrollment.studentName}</div>
                          <div style={{ color: '#666', fontSize: '10px' }}>{enrollment.studentEmail}</div>
                        </div>
                        <button
                          onClick={() => handleUnenrollStudent(enrollment.id, enrollment.studentName)}
                          disabled={unenrollingId === enrollment.id}
                          style={{ padding: '4px 8px', backgroundColor: '#FF6B6B', color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px' }}
                        >
                          Unenroll
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}>
                    <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>No students enrolled yet</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
                <button
                  onClick={() => setIsEnrollDialogOpen(false)}
                  style={{ padding: '6px 12px', backgroundColor: '#ddd', border: '1px solid #999', cursor: 'pointer', fontSize: '12px' }}
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