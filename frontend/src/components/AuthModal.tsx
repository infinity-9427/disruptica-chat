'use client';

import { useState, useEffect } from 'react';
import { RiEyeLine, RiEyeOffLine, RiCheckLine, RiCloseLine } from '@remixicon/react';
import { AuthMode } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AuthModalProps {
  initialMode?: AuthMode;
  onClose?: () => void;
}

interface ValidationState {
  isValid: boolean;
  message: string;
  type: 'error' | 'warning' | 'success';
}

interface FormValidation {
  email: ValidationState;
  password: ValidationState;
  confirmPassword: ValidationState;
}

export function AuthModal({ initialMode = AuthMode.LOGIN, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false });
  const [validation, setValidation] = useState<FormValidation>({
    email: { isValid: false, message: '', type: 'error' },
    password: { isValid: false, message: '', type: 'error' },
    confirmPassword: { isValid: false, message: '', type: 'error' },
  });

  const { login, register, isLoading } = useAuth();

  const isLogin = mode === AuthMode.LOGIN;
  const title = isLogin ? 'Welcome Back' : 'Create Account';
  const submitText = isLogin ? 'Sign In' : 'Create Account';
  const switchText = isLogin ? "Don't have an account?" : 'Already have an account?';
  const switchAction = isLogin ? 'Sign up' : 'Sign in';

  // Real-time validation
  useEffect(() => {
    const newValidation = { ...validation };

    // Email validation
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        newValidation.email = { isValid: true, message: 'Valid email address', type: 'success' };
      } else {
        newValidation.email = { isValid: false, message: 'Please enter a valid email address', type: 'error' };
      }
    } else if (touched.email) {
      newValidation.email = { isValid: false, message: 'Email is required', type: 'error' };
    }

    // Password validation
    if (password) {
      if (password.length < 8) {
        newValidation.password = { 
          isValid: false, 
          message: `Password must be at least 8 characters (${password.length}/8)`, 
          type: 'error' 
        };
      } else if (password.length < 12) {
        newValidation.password = { 
          isValid: true, 
          message: 'Good password length', 
          type: 'warning' 
        };
      } else {
        newValidation.password = { 
          isValid: true, 
          message: 'Strong password length', 
          type: 'success' 
        };
      }
    } else if (touched.password) {
      newValidation.password = { isValid: false, message: 'Password is required', type: 'error' };
    }

    // Confirm password validation (only for registration)
    if (!isLogin) {
      if (confirmPassword) {
        if (password === confirmPassword) {
          newValidation.confirmPassword = { isValid: true, message: 'Passwords match', type: 'success' };
        } else {
          newValidation.confirmPassword = { isValid: false, message: 'Passwords do not match', type: 'error' };
        }
      } else if (touched.confirmPassword) {
        newValidation.confirmPassword = { isValid: false, message: 'Please confirm your password', type: 'error' };
      }
    }

    setValidation(newValidation);
  }, [email, password, confirmPassword, isLogin, touched, validation]);

  // Check if form is valid for submission
  const canSubmit = () => {
    if (isLogin) {
      return validation.email.isValid && validation.password.isValid && password.length >= 8;
    }
    return validation.email.isValid && 
           validation.password.isValid && 
           validation.confirmPassword.isValid &&
           password.length >= 8;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Mark all fields as touched for validation display
    setTouched({ email: true, password: true, confirmPassword: true });

    if (!canSubmit()) {
      // Show specific error
      if (!validation.email.isValid) {
        toast.error(validation.email.message);
      } else if (!validation.password.isValid) {
        toast.error(validation.password.message);
      } else if (!isLogin && !validation.confirmPassword.isValid) {
        toast.error(validation.confirmPassword.message);
      }
      return;
    }

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password });
      }
      onClose?.();
    } catch {
      // Error handling is done in the context
    }
  }

  function toggleMode() {
    setMode(isLogin ? AuthMode.REGISTER : AuthMode.LOGIN);
    setPassword('');
    setConfirmPassword('');
    setTouched({ email: false, password: false, confirmPassword: false });
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  const getValidationIcon = (field: keyof FormValidation) => {
    const state = validation[field];
    if (!touched[field] || !state.message) return null;
    
    if (state.isValid) {
      return <RiCheckLine className="h-4 w-4 text-green-500" />;
    } else {
      return <RiCloseLine className="h-4 w-4 text-red-500" />;
    }
  };

  const getFieldBorderColor = (field: keyof FormValidation) => {
    const state = validation[field];
    if (!touched[field] || !state.message) {
      return "border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400";
    }
    
    if (state.isValid) {
      if (state.type === 'success') {
        return "border-green-500 focus:border-green-500 focus:ring-green-500";
      } else {
        return "border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500";
      }
    } else {
      return "border-red-500 focus:border-red-500 focus:ring-red-500";
    }
  };

  const getMessageColor = (field: keyof FormValidation) => {
    const state = validation[field];
    if (state.type === 'success') return 'text-green-600 dark:text-green-400';
    if (state.type === 'warning') return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? 'Sign in to access your account' : 'Join us to get started'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                className={cn(
                  "block w-full rounded-lg border px-3 py-2.5 pr-10",
                  "focus:outline-none focus:ring-2 transition-colors",
                  "dark:bg-gray-800 dark:text-white placeholder-gray-500",
                  getFieldBorderColor('email')
                )}
                placeholder="you@company.com"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {getValidationIcon('email')}
              </div>
            </div>
            {touched.email && validation.email.message && (
              <p className={cn("mt-1 text-xs font-medium", getMessageColor('email'))}>
                {validation.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                className={cn(
                  "block w-full rounded-lg border px-3 py-2.5 pr-20",
                  "focus:outline-none focus:ring-2 transition-colors",
                  "dark:bg-gray-800 dark:text-white placeholder-gray-500",
                  getFieldBorderColor('password')
                )}
                placeholder="Enter your password"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                {getValidationIcon('password')}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <RiEyeOffLine className="h-4 w-4" />
                  ) : (
                    <RiEyeLine className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {touched.password && validation.password.message && (
              <p className={cn("cursor-pointer  mt-1 text-xs font-medium", getMessageColor('password'))}>
                {validation.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field (Registration only) */}
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                  className={cn(
                    "block w-full rounded-lg border px-3 py-2.5 pr-20",
                    "focus:outline-none focus:ring-2 transition-colors",
                    "dark:bg-gray-800 dark:text-white placeholder-gray-500",
                    getFieldBorderColor('confirmPassword')
                  )}
                  placeholder="Confirm your password"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                  {getValidationIcon('confirmPassword')}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="cursor-pointer  text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <RiEyeOffLine className="h-4 w-4" />
                    ) : (
                      <RiEyeLine className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {touched.confirmPassword && validation.confirmPassword.message && (
                <p className={cn("cursor-pointer  mt-1 text-xs font-medium", getMessageColor('confirmPassword'))}>
                  {validation.confirmPassword.message}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !canSubmit()}
            className={cn(
              "cursor-pointer  w-full rounded-lg px-4 py-3 text-white font-medium text-sm",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200",
              "dark:focus:ring-offset-gray-900",
              canSubmit() && !isLoading
                ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-lg hover:shadow-xl transform"
                : "bg-gray-400 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              submitText
            )}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {switchText}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="cursor-pointer  font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {switchAction}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}