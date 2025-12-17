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

interface RegisterData {
  username: string;
  password: string;
  name: string;
  role: 'student' | 'teacher';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<User | null>;
  register: (data: RegisterData) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// LocalStorage keys
const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  ROLE: 'userRole',
  AUTH_STATUS: 'isAuthenticated',
  LAST_ACTIVITY: 'lastActivity',
};

// Session timeout (24 hours in milliseconds)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if session is still valid (not expired)
  const isSessionValid = (): boolean => {
    const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    // If no lastActivity is stored, assume it's a fresh session (valid)
    if (!lastActivity) {
      console.log('⚠️ No lastActivity found, treating as valid (fresh session)');
      return true;
    }
    
    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    const isValid = timeSinceLastActivity < SESSION_TIMEOUT;
    
    if (!isValid) {
      const hoursInactive = Math.floor(timeSinceLastActivity / (1000 * 60 * 60));
      console.log(`⏰ Session expired: ${hoursInactive} hours inactive`);
    }
    
    return isValid;
  };

  // Update last activity timestamp
  const updateLastActivity = () => {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
  };

  // Clear all auth data from localStorage
  const clearAuthData = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    localStorage.removeItem(STORAGE_KEYS.AUTH_STATUS);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    // Check for stored token and user data
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const storedRole = localStorage.getItem(STORAGE_KEYS.ROLE);
    const authStatus = localStorage.getItem(STORAGE_KEYS.AUTH_STATUS);
    
    console.log('🔍 Checking authentication on mount...');
    console.log('Token:', token ? token.substring(0, 20) + '...' : 'null');
    console.log('Stored user:', storedUser ? 'exists' : 'null');
    console.log('Stored role:', storedRole);
    console.log('Auth status:', authStatus);
    
    const sessionValid = isSessionValid();
    console.log('Session valid:', sessionValid);
    
    // Restore session if we have token, user, and auth status
    // Note: We check session validity but don't strictly require it for immediate restore
    if (token && storedUser && authStatus === 'true') {
      // Immediately restore user from localStorage (optimistic)
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        
        // Update last activity timestamp
        updateLastActivity();
        
        console.log('✅ User restored from localStorage:', parsedUser);
        
        // Check if session is expired
        if (!sessionValid) {
          console.log('⚠️ Session was expired, but restored. Will validate with API...');
        }
      } catch (error) {
        console.error('❌ Failed to parse stored user:', error);
        clearAuthData();
        setIsLoading(false);
        return;
      }
      
      // Validate token in background (don't block UI)
      authApi.getMe()
        .then(apiUser => {
          const validatedUser = convertApiUser(apiUser);
          setUser(validatedUser);
          setIsAuthenticated(true);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(validatedUser));
          localStorage.setItem(STORAGE_KEYS.ROLE, validatedUser.role);
          localStorage.setItem(STORAGE_KEYS.AUTH_STATUS, 'true');
          updateLastActivity();
          console.log('✅ Token validated, user updated:', validatedUser);
        })
        .catch((error) => {
          console.error('⚠️ Token validation failed:', error);
          
          // Only clear auth if it's a 401 (Unauthorized) error
          // Don't clear on network errors or other issues
          if (error?.response?.status === 401 || error?.status === 401) {
            console.error('❌ Token is invalid (401), clearing auth data');
            clearAuthData();
            window.location.href = '/login';
          } else {
            // Network error or other issue - keep the user logged in
            console.log('⚠️ Validation failed but keeping session (network error)');
            console.log('User will remain logged in with cached data');
          }
        });
    } else {
      // No valid credentials or auth status missing
      console.log('ℹ️ No stored credentials found or incomplete auth data');
      if (token) console.log('  - Token exists but other data missing');
      if (storedUser) console.log('  - User exists but other data missing');
      if (authStatus !== 'true') console.log('  - Auth status is not true:', authStatus);
      setIsLoading(false);
    }
  }, []);

  // Track user activity to keep session alive
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      updateLastActivity();
    };

    // Listen for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [isAuthenticated]);

  const login = async (username: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    
    try {
      const response = await authApi.login({ username, password });
      const user = convertApiUser(response.user);
      
      // Store token, user, role, and auth status
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.ROLE, user.role);
      localStorage.setItem(STORAGE_KEYS.AUTH_STATUS, 'true');
      updateLastActivity();
      
      setUser(user);
      setIsAuthenticated(true);
      
      console.log('✅ Login successful, user stored:', user);
      console.log('✅ Token stored in localStorage');
      console.log('✅ Role stored in localStorage:', user.role);
      console.log('✅ Auth status set to: true');
      
      setIsLoading(false);
      return user;
    } catch (error) {
      console.error('❌ Login failed:', error);
      clearAuthData();
      setIsLoading(false);
      return null;
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> => {
    setIsLoading(true);
    
    try {
      const response = await authApi.register({
        username: data.username,
        password: data.password,
        name: data.name,
        role: data.role,
      });
      
      console.log('✅ Registration successful:', response);
      
      setIsLoading(false);
      return { success: true, user: convertApiUser(response) };
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      setIsLoading(false);
      
      // Extract error message from response
      const errorMessage = error?.response?.data?.message || error?.message || 'Registration failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    clearAuthData();
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated,
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