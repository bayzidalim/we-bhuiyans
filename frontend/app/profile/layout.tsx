'use client';

import AuthGuard from '@/app/components/AuthGuard';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
