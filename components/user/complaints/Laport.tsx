'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Upload,
  Image as ImageIcon,
  User,
  Building2
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

export function LaportPage() {
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
      const fileName = `${Date.now()}.jpg`;
      
      const { error } = await supabase.storage
        .from('complaints')
        .upload(fileName, file);
      
      if (error) {
        console.error('Upload error:', error);
        toast.error(error.message);
        return null;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('complaints')
        .getPublicUrl(fileName);
      
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
      
      if (!provinceId) {
        toast.error('Data provinsi tidak lengkap. Silakan lengkapi profil.');
        setIsSubmitting(false);
        return;
      }

      const requestBody = {
        province_api_id: provinceId,
        location_detail: form.location,
        category_id: parseInt(form.category_id),
        description: form.description,
        photo: photoUrl,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
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
      console.error(error);
      toast.error('Gagal mengirim: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
      pending_governor: { 
        label: 'Menunggu Gubernur', 
        icon: <Clock className="w-3 h-3" />, 
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200' 
      },
      investigation_assigned: { 
        label: 'Investigasi', 
        icon: <AlertCircle className="w-3 h-3" />, 
        color: 'bg-blue-100 text-blue-700 border-blue-200' 
      },
      investigation_done: { 
        label: 'Investigasi Selesai', 
        icon: <CheckCircle className="w-3 h-3" />, 
        color: 'bg-purple-100 text-purple-700 border-purple-200' 
      },
      governor_processing: { 
        label: 'Diproses', 
        icon: <Clock className="w-3 h-3" />, 
        color: 'bg-orange-100 text-orange-700 border-orange-200' 
      },
      process_report_submitted: { 
        label: 'Laporan Dikirim', 
        icon: <FileText className="w-3 h-3" />, 
        color: 'bg-cyan-100 text-cyan-700 border-cyan-200' 
      },
      completed: { 
        label: 'Selesai', 
        icon: <CheckCircle className="w-3 h-3" />, 
        color: 'bg-green-100 text-green-700 border-green-200' 
      },
      rejected: { 
        label: 'Ditolak', 
        icon: <XCircle className="w-3 h-3" />, 
        color: 'bg-red-100 text-red-700 border-red-200' 
      },
    };
    return configs[status] || { 
      label: status, 
      icon: <Clock className="w-3 h-3" />, 
      color: 'bg-gray-100 text-gray-700 border-gray-200' 
    };
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isProfileComplete = user?.province_api_id && user.province_api_id > 0;

  useEffect(() => {
    if (!authLoading && token && !isProfileComplete) {
      router.push('/complete-profile');
    }
  }, [authLoading, token, isProfileComplete, router]);

  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-primary" />
        </div>
        <p className="text-muted-foreground mb-4">Silakan login terlebih dahulu</p>
        <Button onClick={() => router.push('/auth/login')} className="btn-primary">
          Login Sekarang
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Buat Pengaduan</h1>
          <p className="text-muted-foreground mt-1">
            Sampaikan keluhan atau aspirasi Anda kepada pemerintah provinsi
          </p>
        </div>

        {/* Peringatan Profile Belum Lengkap */}
        {!isProfileComplete && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-700">Data Provinsi Belum Lengkap!</p>
                    <p className="text-xs text-yellow-600 mt-0.5">Anda perlu melengkapi data provinsi terlebih dahulu.</p>
                  </div>
                </div>
                <Button 
                  onClick={() => router.push('/complete-profile')} 
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Lengkapi Data
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Pengaduan */}
        {isProfileComplete && (
          <Card className="mb-8 border-border">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                <CardTitle className="text-foreground">Form Pengaduan Baru</CardTitle>
              </div>
              <CardDescription>
                Isi form di bawah dengan data yang lengkap dan jelas
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Kategori */}
                <div>
                  <Label className="text-foreground text-sm font-medium mb-2 block">
                    Kategori Pengaduan <span className="text-destructive">*</span>
                  </Label>
                  <Select onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger className="h-11 bg-background border-border">
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

                {/* Lokasi */}
                <div>
                  <Label className="text-foreground text-sm font-medium mb-2 block">
                    Lokasi Kejadian <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Contoh: Jl. Sudirman No.123, RT 02 RW 03, Kelurahan..."
                    className="h-11 bg-background border-border focus:ring-primary"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>

                {/* Deskripsi */}
                <div>
                  <Label className="text-foreground text-sm font-medium mb-2 block">
                    Deskripsi Keluhan <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    placeholder="Jelaskan keluhan Anda secara detail (minimal 10 karakter)..."
                    rows={5}
                    className="bg-background border-border resize-none focus:ring-primary"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.description.length}/1000 karakter
                  </p>
                </div>

                {/* Upload Gambar */}
                <div>
                  <Label className="text-foreground text-sm font-medium mb-2 block">
                    Bukti Gambar <span className="text-muted-foreground text-xs font-normal">(Opsional)</span>
                  </Label>
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
                      className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-all duration-200 bg-secondary/30"
                    >
                      <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-foreground font-medium">Klik untuk upload gambar</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG (max 5MB)</p>
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-xl border border-border shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1 rounded-full hover:bg-destructive/90 transition-colors shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-11 btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim Pengaduan...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Kirim Pengaduan
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Daftar Pengaduan Saya */}
        {isProfileComplete && (
          <Card className="border-border">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle className="text-foreground">Riwayat Pengaduan Saya</CardTitle>
              </div>
              <CardDescription>
                {safeComplaints.length} pengaduan yang telah Anda laporkan
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground text-sm mt-2">Memuat data...</p>
                </div>
              ) : safeComplaints.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Belum ada pengaduan</p>
                  <p className="text-xs text-muted-foreground mt-1">Silakan buat pengaduan pertama Anda</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {safeComplaints.map((complaint) => {
                    const statusConfig = getStatusConfig(complaint.status);
                    return (
                      <Link key={complaint.id} href={`/complaints/${complaint.id}`}>
                        <div className="p-5 hover:bg-secondary/30 transition-all duration-200 cursor-pointer">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Header with tracking code */}
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant="outline" className="font-mono text-xs bg-secondary">
                                  #{complaint.tracking_code}
                                </Badge>
                                <Badge className={`${statusConfig.color} border`}>
                                  <span className="flex items-center gap-1">
                                    {statusConfig.icon}
                                    {statusConfig.label}
                                  </span>
                                </Badge>
                              </div>

                              {/* Description */}
                              <p className="text-foreground text-sm line-clamp-2 font-medium">
                                {complaint.description}
                              </p>

                              {/* Location & Date */}
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {complaint.location_detail}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(complaint.created_at)}
                                </span>
                              </div>

                              {/* Photo Preview */}
                              {complaint.photo && (
                                <div className="mt-3">
                                  <img 
                                    src={complaint.photo} 
                                    alt="Bukti" 
                                    className="w-16 h-16 object-cover rounded-lg border border-border"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Arrow Icon */}
                            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-2" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Pengaduan Anda akan segera diproses oleh pemerintah provinsi
          </p>
        </div>
      </div>
    </div>
  );
}