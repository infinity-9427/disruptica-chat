'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, User, AuthCredentials } from '@/types/auth';
import { AuthService } from '@/lib/auth';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    try {
      if (AuthService.isAuthenticated()) {
        const userData = await AuthService.getUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      AuthService.removeToken();
    } finally {
      setIsLoading(false);
    }
  }

  async function login(credentials: AuthCredentials) {
    console.log('🔐 AuthContext.login called with:', { email: credentials.email });
    setIsLoading(true);
    try {
      console.log('📡 Calling AuthService.login...');
      const response = await AuthService.login(credentials);
      console.log('✅ Login response received:', { hasToken: !!response.access_token });
      
      AuthService.setToken(response.access_token);
      console.log('🍪 Token saved to cookies');
      
      const userData = await AuthService.getUser();
      console.log('👤 User data received:', { email: userData.email });
      
      setUser(userData);
      toast.success('Successfully logged in!', {
        style: {
          background: '#10b981',
          color: 'white',
          border: 'none',
        },
      });
    } catch (error) {
      console.log('❌ Login error:', error);
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message, {
        style: {
          background: '#ef4444',
          color: 'white',
          border: 'none',
        },
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function register(credentials: AuthCredentials) {
    console.log('📝 AuthContext.register called with:', { email: credentials.email });
    setIsLoading(true);
    try {
      console.log('📡 Calling AuthService.register...');
      const response = await AuthService.register(credentials);
      console.log('✅ Register response received:', { hasToken: !!response.access_token });
      
      AuthService.setToken(response.access_token);
      console.log('🍪 Token saved to cookies');
      
      const userData = await AuthService.getUser();
      console.log('👤 User data received:', { email: userData.email });
      
      setUser(userData);
      toast.success('Account created successfully!', {
        style: {
          background: '#10b981',
          color: 'white',
          border: 'none',
        },
      });
    } catch (error) {
      console.log('❌ Registration error:', error);
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message, {
        style: {
          background: '#ef4444',
          color: 'white',
          border: 'none',
        },
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    AuthService.removeToken();
    setUser(null);
    toast.success('Logged out successfully');
    
    // Force navigation to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}