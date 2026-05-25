// components/auth-guard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthHydrated } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, isHydrated } = useAuthHydrated();

  useEffect(() => {
    // Hanya redirect setelah hydration selesai
    if (isHydrated && !token) {
      router.replace('/login');
    }
  }, [token, isHydrated, router]);

  // Tampilkan loading selama hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat sesi Anda...</p>
        </div>
      </div>
    );
  }

  // Setelah hydration, cek token
  if (!token) {
    return null;
  }

  return <>{children}</>;
}