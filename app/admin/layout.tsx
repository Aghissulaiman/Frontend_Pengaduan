// app/admin/layout.tsx
'use client';

import { AdminSidebar } from "@/components/layout/NavbarAdmin";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, token } = useAuth();
  const router = useRouter();

  console.log('🔍 AdminLayout - user:', user?.role, 'isLoading:', isLoading);

  useEffect(() => {
    if (!isLoading) {
      if (!token || user?.role !== 'admin') {
        console.log('🚫 Bukan admin, redirect ke login');
        router.push('/auth/login');
      } else {
        console.log('✅ Admin authenticated');
      }
    }
  }, [isLoading, token, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token || user?.role !== 'admin') {
    return null;
  }

  return <AdminSidebar>{children}</AdminSidebar>;
}