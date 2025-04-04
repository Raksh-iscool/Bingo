/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// components/YouTubeAuth.tsx
"use client"

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/trpc/react';

export default function YouTubeAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const status = searchParams.get('status');
  
  // Get auth URL
  const authUrlQuery = api.youtube.getAuthUrl.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  
  // Save auth token mutation
  const saveTokenMutation = api.youtube.saveAuthToken.useMutation({
    onSuccess: () => {
      setIsAuthenticated(true);
      // Remove code from URL to prevent re-triggering the flow
      router.replace('/youtube/connect');
    },
    onError: (error) => {
      setError(`Authentication failed: ${error.message}`);
    }
  });
  
  // Handle OAuth callback code if present in URL
  useEffect(() => {
    if (code && !isAuthenticated) {
      saveTokenMutation.mutate({ code });
    }
  }, [code, isAuthenticated, saveTokenMutation]);
  
  
  // Handle auth success from query param
  useEffect(() => {
    if (status === 'connected') {
      setIsAuthenticated(true);
    }
  }, [status]);
  
  // Start YouTube auth flow
  const startAuth = () => {
    if (authUrlQuery.data?.url) {
      window.location.href = authUrlQuery.data.url;
    }
  };
  
  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">YouTube Integration</h2>
      
      {error && (
        <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {isAuthenticated || videosQuery.data?.length ? (
        <div>
          <div className="p-4 mb-6 bg-green-100 border border-green-400 text-green-700 rounded">
            Your account is connected to YouTube!
          </div>
          
          <Link 
            href="/youtube/upload"
            className="block w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4 text-center"
          >
            Upload New Video
          </Link>
          
          <Link
            href="/youtube/dashboard"
            className="block w-full py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 text-center"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div>
          <p className="mb-6">
            Connect your account to YouTube to upload and manage videos directly from this application.
          </p>
          
          <button
            onClick={startAuth}
            className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
            disabled={authUrlQuery.isLoading}
          >
            {authUrlQuery.isLoading ? 'Loading...' : 'Connect with YouTube'}
          </button>
        </div>
      )}
    </div>
  );
}