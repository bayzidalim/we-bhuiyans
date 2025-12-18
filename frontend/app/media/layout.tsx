'use client';

import AuthGuard from '@/app/components/AuthGuard';

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
