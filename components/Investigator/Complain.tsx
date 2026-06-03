'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
  ArrowLeft,
  X,
  Upload,
  ImageIcon,
  User,
  Hash,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { createClientSupabaseClient } from '@/lib/supabaseClient';

interface Complaint {
  id: number;
  tracking_code: string;
  description: string;
  location_detail: string;
  status: string;
  status_text: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_fullname: string;
  category_name: string;
  photo?: string;
  rejected_reason?: string;
}

export default function InvestigatorComplaintDetailPage() {
  const router = useRouter();
  const params = useParams();
  const complaintId = params?.id as string;
  
  const { token, user, isLoading: authLoading } = useAuth();
  
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [investigationResult, setInvestigationResult] = useState('');
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [isValid, setIsValid] = useState(true);
  
  // Image upload
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchComplaint = useCallback(async () => {
    if (!token || !complaintId) return;
    
    setIsLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/complaints/${complaintId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setComplaint(data.data);
      } else {
        toast.error(data.message || 'Gagal mengambil data');
        router.push('/investigator');
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengambil data');
      router.push('/investigator');
    } finally {
      setIsLoading(false);
    }
  }, [token, complaintId, router]);

  useEffect(() => {
    if (token && complaintId) {
      fetchComplaint();
    }
  }, [token, complaintId, fetchComplaint]);

  // Upload gambar ke Supabase
  const uploadImagesToSupabase = async (files: File[]): Promise<string[]> => {
    const supabase = createClientSupabaseClient();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const fileName = `investigation/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        
        const { error } = await supabase.storage
          .from('complaints')
          .upload(fileName, file);
        
        if (error) {
          console.error('Upload error:', error);
          toast.error(`Gagal upload gambar: ${error.message}`);
          continue;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('complaints')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
    
    return uploadedUrls;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast.error('Beberapa file bukan gambar');
    }

    if (imageFiles.length > 5) {
      toast.error('Maksimal 5 gambar');
      return;
    }

    const validFiles = imageFiles.filter(file => file.size <= 5 * 1024 * 1024);
    if (validFiles.length !== imageFiles.length) {
      toast.error('Beberapa gambar melebihi 5MB');
    }

    setSelectedImages(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!investigationResult) {
      toast.error('Hasil investigasi wajib diisi');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        toast.loading('Mengupload gambar...');
        imageUrls = await uploadImagesToSupabase(selectedImages);
        toast.dismiss();
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/investigator/complaints/${complaintId}/result`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result: investigationResult,
          notes: investigationNotes,
          evidence: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
          is_valid: isValid,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        router.push('/investigator');
      } else {
        throw new Error(data.message || 'Gagal mengirim hasil');
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim hasil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'investigation_assigned':
        return 'bg-blue-100 text-blue-700';
      case 'investigation_done':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending_governor: 'Menunggu Gubernur',
      investigation_assigned: 'Menunggu Investigasi',
      investigation_done: 'Investigasi Selesai',
      governor_processing: 'Diproses Gubernur',
      process_report_submitted: 'Laporan Proses Dikirim',
      completed: 'Selesai',
      rejected: 'Ditolak',
    };
    return map[status] || status;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-500">Pengaduan tidak ditemukan</p>
        <Button onClick={() => router.push('/investigator')} className="mt-4">
          Kembali
        </Button>
      </div>
    );
  }

  const canInvestigate = complaint.status === 'investigation_assigned';

  if (!canInvestigate) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/investigator')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Tidak Dapat Diproses</h2>
                <p className="text-gray-500">
                  Pengaduan ini sudah dalam status {complaint.status_text}
                </p>
                <Button onClick={() => router.push('/investigator')} className="mt-4">
                  Kembali ke Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Tombol Back */}
        <Button
          variant="ghost"
          onClick={() => router.push('/investigator')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Dashboard
        </Button>

        {/* Detail Pengaduan */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Detail Pengaduan
                </h1>
                <p className="text-sm text-gray-500 font-mono mt-1">
                  #{complaint.tracking_code}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                {getStatusText(complaint.status)}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Pelapor</p>
                  <p className="font-medium">{complaint.user_fullname || complaint.user_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Kategori</p>
                  <p className="font-medium">{complaint.category_name || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Lokasi Kejadian</p>
                  <p className="font-medium">{complaint.location_detail}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Tanggal Pengaduan</p>
                  <p className="font-medium">{formatDate(complaint.created_at)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Deskripsi</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
                </div>
              </div>

              {complaint.photo && (
                <div className="flex items-start gap-3">
                  <ImageIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Bukti Gambar</p>
                    <img 
                      src={complaint.photo} 
                      alt="Bukti pengaduan" 
                      className="w-48 h-48 object-cover rounded-lg border"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Hasil Investigasi */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              Form Hasil Investigasi
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Validasi */}
              <div>
                <Label className="text-gray-700 text-sm font-medium mb-2 block">
                  Status Investigasi
                </Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={isValid ? "default" : "outline"}
                    className={isValid ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => setIsValid(true)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Valid - Laporan Terbukti
                  </Button>
                  <Button
                    type="button"
                    variant={!isValid ? "destructive" : "outline"}
                    onClick={() => setIsValid(false)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Tidak Valid - Laporan Hoax/Tidak Terbukti
                  </Button>
                </div>
              </div>

              {/* Hasil Investigasi */}
              <div>
                <Label htmlFor="result" className="text-gray-700 text-sm font-medium mb-1.5 block">
                  Hasil Investigasi *
                </Label>
                <Textarea
                  id="result"
                  placeholder="Jelaskan hasil investigasi Anda secara detail..."
                  value={investigationResult}
                  onChange={(e) => setInvestigationResult(e.target.value)}
                  rows={5}
                  className="bg-white border-gray-300 resize-none"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Jelaskan temuan di lapangan, bukti-bukti yang ditemukan, dan kesimpulan.
                </p>
              </div>

              {/* Catatan */}
              <div>
                <Label htmlFor="notes" className="text-gray-700 text-sm font-medium mb-1.5 block">
                  Catatan Tambahan (Opsional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Catatan tambahan seperti rekomendasi tindak lanjut..."
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  rows={3}
                  className="bg-white border-gray-300 resize-none"
                />
              </div>

              {/* Upload Bukti Gambar */}
              <div>
                <Label className="text-gray-700 text-sm font-medium mb-1.5 block">
                  Bukti Gambar Investigasi (Opsional, Max 5 gambar)
                </Label>
                <div className="mt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  
                  {imagePreviews.length === 0 ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                    >
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Klik untuk upload gambar bukti</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG (max 5MB per gambar)</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {imagePreviews.length < 5 && (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors h-32"
                        >
                          <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || !investigationResult}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Mengirim Hasil Investigasi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Kirim Hasil Investigasi
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}