'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, UserPlus, Mail, Lock, User, Phone } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    fullname: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi
    if (!form.username || !form.password || !form.email || !form.fullname) {
      toast.error('Error', {
        description: 'Username, password, email, dan nama lengkap wajib diisi',
      });
      return;
    }

    if (form.password.length < 6) {
      toast.error('Error', {
        description: 'Password minimal 6 karakter',
      });
      return;
    }

    setIsLoading(true);
    const success = await register({
      username: form.username,
      password: form.password,
      email: form.email,
      fullname: form.fullname,
      phone: form.phone,
      // province_id akan diisi nanti setelah register
    });
    setIsLoading(false);

    if (success) {
      toast.success('Registrasi berhasil', {
        description: 'Silahkan login dengan akun Anda',
      });
      router.push('/complete-profile');
    } else {
      toast.error('Registrasi gagal', {
        description: 'Username atau email sudah terdaftar',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-lg bg-primary p-2">
              <UserPlus className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Daftar Akun</CardTitle>
          <CardDescription>
            Buat akun baru untuk melaporkan pengaduan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Masukkan username"
                  className="pl-9"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email"
                  className="pl-9"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullname">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullname"
                  placeholder="Masukkan nama lengkap"
                  className="pl-9"
                  value={form.fullname}
                  onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">No. HP (Opsional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Masukkan nomor telepon"
                  className="pl-9"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  className="pl-9"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Daftar
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Sudah punya akun?{' '}
            <Link href="/complete-profile" className="text-primary hover:underline">
              Login di sini
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}