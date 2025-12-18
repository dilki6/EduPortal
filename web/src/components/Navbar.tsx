import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  BarChart3, 
  Users, 
  FileText, 
  LogOut, 
  GraduationCap,
  Home
} from 'lucide-react';
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
    { path: '/teacher-dashboard', label: 'Dashboard', icon: Home },
    { path: '/course-management', label: 'Courses', icon: BookOpen },
    { path: '/assessment-management', label: 'Assessments', icon: FileText },
    { path: '/review-answers', label: 'Review Answers', icon: Users },
    { path: '/analytics-teacher', label: 'Analytics', icon: BarChart3 },
  ];

  const studentLinks = [
    { path: '/student-dashboard', label: 'Dashboard', icon: Home },
    { path: '/my-courses', label: 'My Courses', icon: BookOpen },
    { path: '/analytics-student', label: 'My Progress', icon: BarChart3 },
  ];

  const links = user.role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <nav className="bg-card border-b border-border shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link to={user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} 
                  className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                EduPortal
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-6">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Welcome, </span>
              <span className="font-medium text-foreground">{user.name}</span>
              <div className="text-xs text-muted-foreground capitalize">
                {user.role}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;