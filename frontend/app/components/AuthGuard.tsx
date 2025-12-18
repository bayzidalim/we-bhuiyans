'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Unauthenticated -> Redirect to /login
      // Maybe we want to persist the attempted URL? For now, simple redirect.
      // But user requested "Redirect unauthenticated users to /" (for members) 
      // "Member routes: Redirect unauthenticated users to /"
      // Wait, standard practice is /login, but user requirement "Redirect unauthenticated users to /" (step 0, point 4)
      router.push('/'); 
      return;
    }

    if (requireAdmin) {
      // Check admin role
      if (profile?.role !== 'admin' && !profile?.is_admin) {
        // "Non-admin users attempting admin routes must be redirected to /"
        router.push('/');
        return;
      }
    }
  }, [user, profile, loading, requireAdmin, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If not loading and we haven't redirected, we're likely good.
  // But render checks:
  if (!user) return null; // Will redirect in effect
  if (requireAdmin && (profile?.role !== 'admin' && !profile?.is_admin)) return null; // Will redirect in effect

  return <>{children}</>;
}
