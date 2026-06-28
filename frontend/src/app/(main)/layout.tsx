'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const ready = useAuthStore((s) => s.ready);
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      console.log('No token — redirecting to /login');
      router.replace('/login');
    }
  }, [ready, token, router]);

  if (!ready || !token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {children}
    </div>
  );
}
