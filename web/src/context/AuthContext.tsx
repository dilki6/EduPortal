import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, UserRole as ApiUserRole, User as ApiUser } from '@/lib/api';

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

// Convert API user to local user format
const convertApiUser = (apiUser: ApiUser): User => ({
  id: apiUser.id,
  username: apiUser.username,
  role: apiUser.role === ApiUserRole.Teacher ? 'teacher' : 'student',
  name: apiUser.name,
  email: apiUser.email,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token and validate session
    const token = localStorage.getItem('token');
    if (token) {
      authApi.getMe()
        .then(apiUser => {
          const user = convertApiUser(apiUser);
          setUser(user);
          localStorage.setItem('user', JSON.stringify(user));
        })
        .catch(() => {
          // Token invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await authApi.login({ username, password });
      const user = convertApiUser(response.user);
      
      // Store token and user
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
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