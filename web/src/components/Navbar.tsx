import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "See you next time!",
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
  ];

  const links = user.role === 'teacher' ? teacherLinks : studentLinks;

  const Study360Logo = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg width="32" height="32" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
        {/* Circle background */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="#0066cc" strokeWidth="6"/>
        {/* 360 degrees indicator - three arc segments */}
        <path d="M 50 10 A 40 40 0 0 1 90 50" fill="none" stroke="#0066cc" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="50" cy="50" r="8" fill="#0066cc"/>
        {/* Center dot representing the 360 concept */}
      </svg>
      <span style={{ fontSize: '20px', fontWeight: '700', color: '#0066cc' }}>
        Study360
      </span>
    </div>
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid #e2e8f0',
      padding: '1rem 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Logo */}
        <Link to={user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Study360Logo />
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                textDecoration: 'none',
                color: isActive(link.path) ? '#0066cc' : '#4a5568',
                fontSize: '14px',
                fontWeight: isActive(link.path) ? '600' : '500',
                padding: '0.5rem 0',
                borderBottom: isActive(link.path) ? '2px solid #0066cc' : '2px solid transparent',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                if (!isActive(link.path)) {
                  (e.target as HTMLElement).style.color = '#0066cc';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive(link.path)) {
                  (e.target as HTMLElement).style.color = '#4a5568';
                }
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.6rem 1rem',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: '#2d3748'
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#f0f4f8';
              (e.currentTarget as HTMLElement).style.borderColor = '#0066cc';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#f8f9fa';
              (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0066cc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span>{user.name}</span>
            <span style={{ fontSize: '12px', color: '#718096' }}>▼</span>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              right: '0',
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              minWidth: '200px',
              zIndex: 1000
            }}>
              <div style={{ padding: '0.5rem 0' }}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#718096' }}>
                  Role: <span style={{ fontWeight: '600', color: '#0066cc' }}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#e53e3e',
                    fontWeight: '500'
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#fff5f5';
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;