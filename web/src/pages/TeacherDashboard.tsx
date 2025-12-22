import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      
      const [teacherCourses, teacherAssessments] = await Promise.all([
        courseApi.getMyTeachingCourses(),
        assessmentApi.getMyTeachingAssessments()
      ]);

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

      const allEnrollments = await Promise.all(
        teacherCourses.map(course => 
          courseApi.getEnrollments(course.id).catch(() => [])
        )
      );
      const uniqueStudentIds = new Set(
        allEnrollments.flat().map(enrollment => enrollment.studentId)
      );

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Loading dashboard...</div>
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
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Teacher Dashboard</h1>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '12px' }}>Manage courses and assessments</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Courses</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px' }}>{stats.totalCourses}</div>
          </div>
          <div style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Students</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px' }}>{stats.totalStudents}</div>
          </div>
          <div style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Assessments</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px' }}>{stats.totalAssessments}</div>
          </div>
          <div style={{ border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Pending</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px', color: '#d32f2f' }}>{stats.pendingEvaluations}</div>
          </div>
        </div>

        {/* Courses */}
        <div style={{ border: '1px solid #ddd', marginBottom: '20px', padding: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>Your Courses</h2>
            <Link to="/course-management">
              <button style={{ padding: '5px 10px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                Add Course
              </button>
            </Link>
          </div>
          {courses.length > 0 ? (
            <div>
              {courses.slice(0, 3).map((course) => (
                <div key={course.id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{course.name}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      {course.studentCount} students • {course.assessmentCount} assessments
                    </div>
                  </div>
                  <Link to="/course-management">
                    <button style={{ padding: '5px 10px', backgroundColor: '#ddd', border: '1px solid #999', cursor: 'pointer', fontSize: '11px' }}>
                      View
                    </button>
                  </Link>
                </div>
              ))}
              <Link to="/course-management">
                <button style={{ width: '100%', padding: '8px', backgroundColor: '#ddd', border: '1px solid #999', cursor: 'pointer', fontSize: '12px' }}>
                  View All Courses
                </button>
              </Link>
            </div>
          ) : (
            <p style={{ color: '#666', fontSize: '12px' }}>No courses created yet</p>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{ border: '1px solid #ddd', marginBottom: '20px', padding: '15px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Recent Activity</h2>
          {courses.length > 0 || assessments.length > 0 ? (
            assessments.slice(0, 3).map((assessment) => (
              <div key={assessment.id} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f5f5f5', border: '1px solid #eee', fontSize: '12px' }}>
                <div>{assessment.isPublished ? 'Published' : 'Created'}: {assessment.title}</div>
                <div style={{ fontSize: '10px', color: '#666' }}>{new Date(assessment.createdAt).toLocaleDateString()}</div>
              </div>
            ))
          ) : (
            <p style={{ color: '#666', fontSize: '12px' }}>No activity yet</p>
          )}
        </div>

        {/* Quick Links */}
        <div style={{ border: '1px solid #ddd', padding: '15px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <Link to="/course-management">
              <button style={{ width: '100%', padding: '12px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px' }}>
                Manage Courses
              </button>
            </Link>
            <Link to="/assessment-management">
              <button style={{ width: '100%', padding: '12px', backgroundColor: '#FF9800', color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px' }}>
                Create Assessment
              </button>
            </Link>
            <Link to="/review-answers">
              <button style={{ width: '100%', padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px' }}>
                Review Answers
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;