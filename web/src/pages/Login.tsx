import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !isLoading) {
      const redirectPath = user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const loggedInUser = await login(username, password);
    
    if (loggedInUser) {
      toast({
        title: "Welcome back!",
        description: "Login successful",
      });
      const redirectPath = loggedInUser.role === 'teacher' 
        ? '/teacher-dashboard' 
        : '/student-dashboard';
      navigate(redirectPath, { replace: true });
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive"
      });
    }
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
        width: '100%',
        maxWidth: '450px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '40px'
      }}>
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
            <svg width="40" height="40" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
              {/* Circle background */}
              <circle cx="50" cy="50" r="48" fill="none" stroke="#0066cc" strokeWidth="6"/>
              {/* 360 degrees indicator - three arc segments */}
              <path d="M 50 10 A 40 40 0 0 1 90 50" fill="none" stroke="#0066cc" strokeWidth="4" strokeLinecap="round"/>
              <circle cx="50" cy="50" r="8" fill="#0066cc"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#0066cc' }}>Study360</h1>
          <p style={{ fontSize: '14px', color: '#718096', margin: '0' }}>Sign in to your account</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label htmlFor="username" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                (e.target as HTMLElement).style.borderColor = '#0066cc';
                (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(0, 102, 204, 0.1)';
              }}
              onBlur={(e) => {
                (e.target as HTMLElement).style.borderColor = '#e2e8f0';
                (e.target as HTMLElement).style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: '40px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  (e.target as HTMLElement).style.borderColor = '#0066cc';
                }}
                onBlur={(e) => {
                  (e.target as HTMLElement).style.borderColor = '#e2e8f0';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#718096',
                  fontSize: '14px'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '12px 16px',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              opacity: isLoading ? 0.6 : 1,
              marginTop: '8px'
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div style={{
          marginTop: '28px',
          padding: '16px',
          background: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #bae6fd',
          fontSize: '13px',
          color: '#0c4a6e'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', fontSize: '13px' }}>🔓 Demo: teacher1/password123 or student1/password123</p>
        </div>

        {/* Register Link */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#718096' }}>
          <p style={{ margin: '0' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#0066cc', textDecoration: 'none', fontWeight: '600' }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;