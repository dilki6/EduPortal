import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
        title: "Welcome!",
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', border: '2px solid #000', padding: '30px', backgroundColor: '#fffef0' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '28px', margin: '0', color: '#000' }}>Edu</h1>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Sign in to your account</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label htmlFor="username" style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={{ width: '100%', padding: '8px', border: '1px solid #999', fontSize: '12px', boxSizing: 'border-box' }}
            />
          </div>
          
          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{ width: '100%', padding: '8px', border: '1px solid #999', fontSize: '12px', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '10px', border: '1px dotted #999', fontSize: '11px', backgroundColor: '#f5f5f5' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Demo Credentials:</p>
          <p style={{ margin: '3px 0', color: '#333' }}>Teacher: teacher1 / password123</p>
          <p style={{ margin: '3px 0', color: '#333' }}>Student: student1 / password123</p>
        </div>

        <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '12px' }}>
          <p style={{ margin: '0' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'blue', textDecoration: 'underline' }}>
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;