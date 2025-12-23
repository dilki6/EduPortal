import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleGoHome = () => {
    if (user) {
      const dashboardPath = user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard';
      navigate(dashboardPath, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px',
        background: 'white',
        borderRadius: '16px',
        padding: '48px 32px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '16px' }}>😕</div>
        <h1 style={{ fontSize: '48px', fontWeight: '700', margin: '0 0 12px 0', color: '#0f172a' }}>404</h1>
        <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 12px 0', color: '#2d3748' }}>Page Not Found</h2>
        <p style={{ fontSize: '16px', color: '#718096', margin: '0 0 8px 0' }}>The page you're looking for doesn't exist or has been moved.</p>
        <p style={{ fontSize: '13px', color: '#a0aec0', margin: '0 0 24px 0' }}>Path: {location.pathname}</p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={handleGoBack}
            style={{
              padding: '12px 24px',
              backgroundColor: 'white',
              color: '#0066cc',
              border: '2px solid #0066cc',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#f0f9ff';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'white';
            }}
          >
            ← Go Back
          </button>
          <button 
            onClick={handleGoHome}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {user ? 'Go to Dashboard' : 'Go to Login'} →
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
