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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', border: '2px solid #000', padding: '30px', backgroundColor: '#f0f8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '28px', margin: '0', color: '#000' }}>Edu</h1>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Create your account</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('student')}
            style={{ 
              flex: 1, 
              padding: '10px', 
              backgroundColor: activeTab === 'student' ? '#2196F3' : '#ddd',
              color: activeTab === 'student' ? 'white' : 'black',
              border: '1px solid #999',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teacher')}
            style={{ 
              flex: 1, 
              padding: '10px', 
              backgroundColor: activeTab === 'teacher' ? '#2196F3' : '#ddd',
              color: activeTab === 'teacher' ? 'white' : 'black',
              border: '1px solid #999',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Teacher
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label htmlFor="name" style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              style={{ width: '100%', padding: '8px', border: '1px solid #999', fontSize: '12px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="username" style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Choose a username"
              style={{ width: '100%', padding: '8px', border: '1px solid #999', fontSize: '12px', boxSizing: 'border-box' }}
            />
          </div>
          
          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Create a password (min. 6 characters)"
              style={{ width: '100%', padding: '8px', border: '1px solid #999', fontSize: '12px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              style={{ width: '100%', padding: '8px', border: '1px solid #999', fontSize: '12px', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{ padding: '10px', backgroundColor: '#FF9800', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
          >
            {isLoading ? 'Creating account...' : `Register as ${activeTab === 'student' ? 'Student' : 'Teacher'}`}
          </button>
        </form>

        <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '12px' }}>
          <p style={{ margin: '0' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'blue', textDecoration: 'underline' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
