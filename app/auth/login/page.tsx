'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, LogIn, User, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, token, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });

  // Jika sudah login, redirect berdasarkan role
  useEffect(() => {
    if (!authLoading && token && user) {
      if (user.role === 'governor') {
        router.push('/governor');
      } else if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'investigator') {
        router.push('/investigator');
      } else {
        router.push('/home');
      }
    }
  }, [authLoading, token, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('Error', {
        description: 'Username dan password wajib diisi',
      });
      return;
    }

    setIsLoading(true);
    const success = await login(form.username, form.password);
    setIsLoading(false);

    if (success) {
      toast.success('Login berhasil', {
        description: 'Selamat datang kembali!',
      });
      // Redirect akan dihandle oleh useEffect di atas
    } else {
      toast.error('Login gagal', {
        description: 'Username atau password salah',
      });
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-3">
            <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-3 shadow-lg">
              <LogIn className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-slate-800">Login</CardTitle>
          <CardDescription className="text-slate-500">
            Masuk ke akun Anda untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700 font-medium">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="username"
                  placeholder="Masukkan username"
                  className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-200 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Belum punya akun?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
              Daftar di sini
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}