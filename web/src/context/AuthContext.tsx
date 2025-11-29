import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: Record<string, User> = {
  'teacher1': {
    id: '1',
    username: 'teacher1',
    role: 'teacher',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@university.edu'
  },
  'student1': {
    id: '2',
    username: 'student1',
    role: 'student',
    name: 'Alex Chen',
    email: 'alex.chen@student.edu'
  },
  'student2': {
    id: '3',
    username: 'student2',
    role: 'student',
    name: 'Emily Davis',
    email: 'emily.davis@student.edu'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock authentication - in real app, this would be an API call
    if (mockUsers[username] && password === 'password') {
      const user = mockUsers[username];
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};