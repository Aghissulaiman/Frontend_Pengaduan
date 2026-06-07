// components/auth-guard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthHydrated } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, user, isHydrated } = useAuthHydrated(); // tambah user

  useEffect(() => {
    if (isHydrated) {
      // Cek login
      if (!token) {
        router.replace('/auth/login');
        return;
      }
      
      // Cek province (khusus role user)
      if (user?.role === 'user' && (!user?.province_api_id || user?.province_api_id === 0)) {
        router.replace('/auth/complete-profile');
        return;
      }
    }
  }, [token, user, isHydrated, router]);

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

  if (!token) return null;
  
  // Cek province untuk role user
  if (user?.role === 'user' && (!user?.province_api_id || user?.province_api_id === 0)) {
    return null;
  }

  return <>{children}</>;
}