'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { AuthMode } from '@/types/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
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

  // Login page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative">
      <div className="text-center max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">AI Chat</h1>
          <p className="text-xl text-gray-600 mb-8">
            Your intelligent conversation partner powered by advanced AI
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Smart Conversations</h3>
            <p className="text-gray-600">Engage in natural conversations with advanced AI that understands context and provides meaningful responses.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Real-time Streaming</h3>
            <p className="text-gray-600">Experience lightning-fast responses with real-time streaming technology for seamless interactions.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Code Support</h3>
            <p className="text-gray-600">Get help with coding tasks, syntax highlighting, and technical discussions with syntax-aware AI.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Markdown Ready</h3>
            <p className="text-gray-600">Full markdown support for rich formatting, tables, lists, and beautifully rendered content.</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-500">
          Sign in to start your AI-powered conversation experience
        </p>
      </div>
      
      <AuthModal initialMode={AuthMode.LOGIN} />
    </div>
  );
}