import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import CourseManagement from "./pages/CourseManagement";
import AssessmentManagement from "./pages/AssessmentManagement";
import ReviewAnswers from "./pages/ReviewAnswers";
import MyCourses from "./pages/MyCourses";
import MyProgress from "./pages/MyProgress";
import AttemptAssessment from "./pages/AttemptAssessment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          user ? (
            <Navigate to={user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
        
        {/* Teacher Routes */}
        <Route path="/teacher-dashboard" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        
        {/* Student Routes */}
        <Route path="/student-dashboard" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />

        {/* Teacher feature routes */}
        <Route path="/course-management" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <CourseManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/assessment-management" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <AssessmentManagement />
          </ProtectedRoute>
        } />

        <Route path="/review-answers" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <ReviewAnswers />
          </ProtectedRoute>
        } />

        <Route path="/analytics-teacher" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Teacher Analytics</h2>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </ProtectedRoute>
        } />

        <Route path="/my-courses" element={
          <ProtectedRoute allowedRoles={['student']}>
            <MyCourses />
          </ProtectedRoute>
        } />

        <Route path="/my-progress" element={
          <ProtectedRoute allowedRoles={['student']}>
            <MyProgress />
          </ProtectedRoute>
        } />

        <Route path="/attempt-assessment/:assessmentId" element={
          <ProtectedRoute allowedRoles={['student']}>
            <AttemptAssessment />
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
