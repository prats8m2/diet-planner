'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [hasCheckedSetup, setHasCheckedSetup] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch('/api/users');
        const users = await response.json();
        if (users.length === 0) {
          setNeedsSetup(true);
          router.push('/setup');
          return;
        }
        setHasCheckedSetup(true);
      } catch (error) {
        console.error('Failed to check setup status:', error);
        setHasCheckedSetup(true);
      }
    };

    if (!hasCheckedSetup) {
      checkSetup();
    }
  }, [hasCheckedSetup, router]);

  useEffect(() => {
    if (hasCheckedSetup && !isLoading && !user && !needsSetup) {
      router.push('/login');
    }
  }, [user, isLoading, router, hasCheckedSetup, needsSetup]);

  if (isLoading || !hasCheckedSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/40 dark:from-gray-900 dark:via-emerald-950/20 dark:to-teal-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !needsSetup) {
    return null;
  }

  return <>{children}</>;
}
