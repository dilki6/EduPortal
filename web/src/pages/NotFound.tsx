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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: '20px' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '72px', fontWeight: 'bold', margin: '0', color: '#000' }}>404</h1>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '10px 0', color: '#000' }}>Page Not Found</h2>
        <p style={{ fontSize: '13px', color: '#666', margin: '10px 0' }}>The page you're looking for doesn't exist.</p>
        <p style={{ fontSize: '11px', color: '#999', margin: '10px 0' }}>Path: {location.pathname}</p>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
          <button 
            onClick={handleGoBack}
            style={{ padding: '8px 15px', backgroundColor: '#ddd', border: '1px solid #999', cursor: 'pointer', fontSize: '12px' }}
          >
            Go Back
          </button>
          <button 
            onClick={handleGoHome}
            style={{ padding: '8px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}
          >
            {user ? 'Go to Dashboard' : 'Go to Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
