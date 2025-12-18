'use client';

import AuthGuard from '@/app/components/AuthGuard';

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
