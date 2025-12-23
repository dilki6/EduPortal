import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const { user, register, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !isLoading) {
      const redirectPath = user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = (): boolean => {
    if (!formData.username || !formData.password || !formData.confirmPassword || !formData.name) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return false;
    }

    if (formData.username.length < 3) {
      toast({
        title: "Error",
        description: "Username must be at least 3 characters long",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await register({
      username: formData.username,
      password: formData.password,
      name: formData.name,
      role: activeTab,
    });
    
    if (result.success && result.user) {
      toast({
        title: "Success!",
        description: `Registration successful! Welcome ${result.user.name}. You can now login.`,
      });
      navigate('/login');
    } else {
      toast({
        title: "Registration Failed",
        description: result.error || "An error occurred during registration. Please try again.",
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
        maxWidth: '500px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '40px'
      }}>
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
          <p style={{ fontSize: '14px', color: '#718096', margin: '0' }}>Create your account</p>
        </div>

        {/* Role Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
          {['student', 'teacher'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setActiveTab(role as 'student' | 'teacher')}
              style={{
                padding: '14px 16px',
                backgroundColor: activeTab === role ? '#0066cc' : '#f0f4f8',
                color: activeTab === role ? 'white' : '#2d3748',
                border: `2px solid ${activeTab === role ? '#0066cc' : '#e8eef7'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                if (activeTab !== role) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#e8eef7';
                  (e.currentTarget as HTMLElement).style.borderColor = '#0066cc';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== role) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#f0f4f8';
                  (e.currentTarget as HTMLElement).style.borderColor = '#e8eef7';
                }
              }}
            >
              {role === 'student' ? '👤 Student' : '👨‍🏫 Teacher'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label htmlFor="name" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
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
            <label htmlFor="username" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Choose a username (min. 3 characters)"
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
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Create a password (min. 6 characters)"
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
            <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
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

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              opacity: isLoading ? 0.7 : 1,
              marginTop: '8px'
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 16px rgba(118, 75, 162, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            {isLoading ? 'Creating account...' : `Register as ${activeTab === 'student' ? 'Student' : 'Teacher'}`}
          </button>
        </form>

        {/* Login Link */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#718096' }}>
          <p style={{ margin: '0' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#0066cc', textDecoration: 'none', fontWeight: '600', transition: 'color 0.3s ease' }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#0099ff';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#0066cc';
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
