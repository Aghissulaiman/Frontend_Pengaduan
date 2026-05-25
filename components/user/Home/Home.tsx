'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Loader2, 
  Send, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MapPin,
  Calendar,
  ChevronRight,
  X,
  Upload
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { createClientSupabaseClient } from '@/lib/supabaseClient';

interface Category {
  id: number;
  name: string;
}

interface Complaint {
  id: number;
  tracking_code: string;
  description: string;
  location_detail: string;
  status: string;
  status_text: string;
  created_at: string;
  photo?: string;
}

export function HomeContent() {
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    category_id: '',
    location: '',
    description: '',
  });

  // 🔥 CEK DATA USER DARI LOCALSTORAGE
  useEffect(() => {
    const userStorage = localStorage.getItem('user');
    const authStorage = localStorage.getItem('auth-storage');
    
    console.log('========== DEBUG HOME CONTENT ==========');
    console.log('1. localStorage.getItem("user"):', userStorage);
    console.log('2. localStorage.getItem("auth-storage"):', authStorage);
    console.log('3. user dari useAuth():', user);
    console.log('4. user?.province_api_id:', user?.province_api_id);
    console.log('5. token:', token);
    console.log('6. authLoading:', authLoading);
    console.log('=========================================');
  }, [user, token, authLoading]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/categories`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Gagal ambil kategori', error);
    }
  }, []);

  const fetchMyComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/my`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setComplaints(data.data);
      } else {
        setComplaints([]);
      }
    } catch {
      setComplaints([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchCategories();
      fetchMyComplaints();
    }
  }, [token, fetchCategories, fetchMyComplaints]);

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    try {
      const supabase = createClientSupabaseClient();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `complaints/${fileName}`;
      
      const { error } = await supabase.storage
        .from('complaints')
        .upload(filePath, file);
      
      if (error) {
        console.error('Upload error:', error);
        return null;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('complaints')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id || !form.location || !form.description) {
      toast.error('Lengkapi semua field');
      return;
    }

    if (form.description.length < 10) {
      toast.error('Deskripsi minimal 10 karakter');
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl = null;
      if (selectedImage) {
        photoUrl = await uploadImageToSupabase(selectedImage);
        if (!photoUrl) {
          toast.warning('Gambar gagal diupload, tapi pengaduan tetap diproses');
        }
      }

      const provinceId = user?.province_api_id;
      console.log('Province ID saat submit:', provinceId);
      
      if (!provinceId) {
        toast.error('Data provinsi tidak lengkap. Silakan lengkapi profil.');
        setIsSubmitting(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          province_api_id: provinceId,
          location_detail: form.location,
          category_id: parseInt(form.category_id),
          description: form.description,
          photo: photoUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Pengaduan terkirim!');
        setForm({ category_id: '', location: '', description: '' });
        removeImage();
        fetchMyComplaints();
      } else {
        toast.error(data.message || 'Gagal mengirim');
      }
    } catch (error) {
      toast.error('Gagal mengirim');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="w-3.5 h-3.5" />;
    if (status === 'rejected') return <XCircle className="w-3.5 h-3.5" />;
    return <Clock className="w-3.5 h-3.5" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-green-100 text-green-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending_governor: 'Menunggu Gubernur',
      investigation_assigned: 'Investigasi',
      investigation_done: 'Investigasi Selesai',
      governor_processing: 'Diproses',
      process_report_submitted: 'Laporan Dikirim',
      completed: 'Selesai',
      rejected: 'Ditolak',
    };
    return map[status] || status;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // 🔥 CEK APAKAH PROFILE LENGKAP
  const isProfileComplete = user?.province_api_id && user.province_api_id > 0;
  
  console.log('7. isProfileComplete:', isProfileComplete);
  console.log('8. user?.province_api_id > 0:', user?.province_api_id > 0);

  useEffect(() => {
    console.log('9. useEffect redirect check:', { authLoading, token, isProfileComplete });
    if (!authLoading && token && !isProfileComplete) {
      console.log('10. REDIRECT KE /complete-profile karena profile tidak lengkap');
      router.push('/complete-profile');
    }
  }, [authLoading, token, isProfileComplete, router]);

  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="ml-2 text-gray-500">Loading auth...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Silakan login terlebih dahulu</p>
        <Button onClick={() => router.push('/login')} className="mt-4">
          Login
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* DEBUG INFO - HANYA UNTUK TESTING, HAPUS NANTI */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm">
          <h3 className="font-bold text-blue-800 mb-2">🔍 Debug Info:</h3>
          <p className="text-blue-700">User ID: {user?.id || '-'}</p>
          <p className="text-blue-700">Username: {user?.username || '-'}</p>
          <p className="text-blue-700">Province ID: {user?.province_api_id || '-'}</p>
          <p className="text-blue-700">Profile Complete: {isProfileComplete ? '✅ YES' : '❌ NO'}</p>
          <p className="text-blue-700">Token: {token ? `✅ Ada (${token.substring(0, 20)}...)` : '❌ Tidak ada'}</p>
        </div>

        {/* Peringatan Profile Belum Lengkap */}
        {!isProfileComplete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-700 font-medium">Data Provinsi Belum Lengkap!</p>
                  <p className="text-xs text-yellow-600 mt-0.5">Anda perlu melengkapi data provinsi terlebih dahulu.</p>
                </div>
              </div>
              <Button 
                onClick={() => router.push('/complete-profile')} 
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Lengkapi Data
              </Button>
            </div>
          </div>
        )}

        {/* Form Pengaduan - Hanya tampil jika profile lengkap */}
        {isProfileComplete && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-500" />
                Buat Pengaduan Baru
              </h2>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ... form sama seperti sebelumnya ... */}
                <div>
                  <Label className="text-gray-700 text-sm font-medium mb-1.5 block">
                    Kategori Pengaduan
                  </Label>
                  <Select onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger className="h-11 bg-white border-gray-300">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-700 text-sm font-medium mb-1.5 block">
                    Lokasi Kejadian
                  </Label>
                  <Input
                    placeholder="Contoh: Jl. Sudirman No.123, RT 02 RW 03"
                    className="h-11 bg-white border-gray-300"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>

                <div>
                  <Label className="text-gray-700 text-sm font-medium mb-1.5 block">
                    Deskripsi Keluhan
                  </Label>
                  <Textarea
                    placeholder="Jelaskan keluhan Anda secara detail (minimal 10 karakter)..."
                    rows={4}
                    className="bg-white border-gray-300 resize-none"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label className="text-gray-700 text-sm font-medium mb-1.5 block">
                    Bukti Gambar (Opsional)
                  </Label>
                  <div className="mt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    
                    {!imagePreview ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Klik untuk upload gambar</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG (max 5MB)</p>
                      </div>
                    ) : (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Kirim Pengaduan
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Daftar Pengaduan */}
        {isProfileComplete && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Pengaduan Saya
              </h2>
            </div>

            <div className="p-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  <p className="text-gray-400 text-sm mt-2">Memuat...</p>
                </div>
              ) : safeComplaints.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400">Belum ada pengaduan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {safeComplaints.map((c) => (
                    <Link key={c.id} href={`/complaints/${c.id}`}>
                      <div className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm line-clamp-2">
                              {c.description}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
                                {getStatusIcon(c.status)}
                                {getStatusText(c.status)}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(c.created_at)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5 truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {c.location_detail}
                            </p>
                            {c.photo && (
                              <div className="mt-2">
                                <img src={c.photo} alt="Bukti" className="w-16 h-16 object-cover rounded-lg" />
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}