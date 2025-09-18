'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { AuthMode } from '@/types/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to stream
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/stream');
    }
  }, [isAuthenticated, router]);

  // Show loading while initializing auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Authenticated users will be redirected, but show loading in case of delay
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to app...</p>
        </div>
      </div>
    );
  }

  // Register page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center relative">
      <div className="text-center max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Join AI Chat</h1>
          <p className="text-xl text-gray-600 mb-8">
            Create your account and start conversations with advanced AI
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Get Started Quickly</h3>
            <p className="text-gray-600">Simple registration process. Just email and password to start your AI journey.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Secure & Private</h3>
            <p className="text-gray-600">Your data is protected with enterprise-grade security and encryption.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Instant Access</h3>
            <p className="text-gray-600">Start chatting immediately after registration. No waiting or approval needed.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Free to Use</h3>
            <p className="text-gray-600">Join thousands of users already experiencing the power of AI conversations.</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-500">
          Create your account to unlock the full potential of AI
        </p>
      </div>
      
      <AuthModal initialMode={AuthMode.REGISTER} />
    </div>
  );
}