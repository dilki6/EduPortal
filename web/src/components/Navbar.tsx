import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  const teacherLinks = [
    { path: '/teacher-dashboard', label: 'Dashboard' },
    { path: '/course-management', label: 'Courses' },
    { path: '/assessment-management', label: 'Assessments' },
    { path: '/review-answers', label: 'Review Answers' },
  ];

  const studentLinks = [
    { path: '/student-dashboard', label: 'Dashboard' },
    { path: '/my-courses', label: 'My Courses' },
    { path: '/my-progress', label: 'My Progress' },
  ];

  const links = user.role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', backgroundColor: '#f0f0f0', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to={user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} style={{ textDecoration: 'none', color: 'black' }}>
            <h1 style={{ margin: '0', fontSize: '20px' }}>Edu</h1>
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{ textDecoration: 'none', color: 'blue', fontSize: '14px' }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', marginBottom: '5px' }}>
            <span>Welcome, {user.name}</span>
            <div style={{ fontSize: '10px', color: 'gray' }}>({user.role})</div>
          </div>
          <button 
            onClick={handleLogout}
            style={{ padding: '5px 10px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;