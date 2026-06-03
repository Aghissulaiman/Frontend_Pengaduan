'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { useAuthHydrated } from '@/hooks/use-auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import {
  Loader2,
  ArrowLeft,
  FileText,
  MapPin,
  Calendar,
  User,
  Hash,
  CheckCircle,
  XCircle,
  Users,
  Send,
  AlertCircle,
  X,
  Upload,
  Plus,
  Trash2,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';

import { toast } from 'sonner';
import { createClientSupabaseClient } from '@/lib/supabaseClient';

interface Complaint {
  id: number;
  tracking_code: string;
  description: string;
  location_detail: string;
  status: string;
  status_text: string;
  created_at: string;
  user_name: string;
  user_fullname: string;
  category_name: string;
  photo?: string;
  rejected_reason?: string;
  assigned_investigator_id?: number;
  assigned_investigator_name?: string;
  investigation_result?: string;
}

interface Investigator {
  id: number;
  username: string;
  fullname: string;
  email: string;
}

export default function GovernorComplaint() {
  const router = useRouter();
  const params = useParams();
  const complaintId = params?.id as string;

  const { user, token, isLoading: authLoading, isHydrated } = useAuthHydrated();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [investigators, setInvestigators] = useState<Investigator[]>([]);
  
  // Modal assign
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedInvestigator, setSelectedInvestigator] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Modal tolak
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Modal selesai
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [workDetails, setWorkDetails] = useState('');
  const [completionImages, setCompletionImages] = useState<File[]>([]);
  const [completionPreviews, setCompletionPreviews] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
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
        router.push('/governor');
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengambil data');
      router.push('/governor');
    } finally {
      setIsLoading(false);
    }
  }, [token, complaintId, router]);

  const fetchInvestigators = useCallback(async () => {
    if (!token) return;

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/governor/investigators`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setInvestigators(data.data);
      }
    } catch (error) {
      console.error('Gagal ambil investigator:', error);
    }
  }, [token]);

  const assignInvestigator = useCallback(async () => {
    if (!complaint || !selectedInvestigator) {
      toast.error('Pilih investigator terlebih dahulu');
      return;
    }

    setIsAssigning(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/governor/complaints/${complaint.id}/assign`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          investigator_id: parseInt(selectedInvestigator),
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Investigator berhasil ditugaskan');
        setShowAssignModal(false);
        setSelectedInvestigator('');
        fetchComplaint();
      } else {
        throw new Error(data.message || 'Gagal assign investigator');
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Gagal assign investigator');
    } finally {
      setIsAssigning(false);
    }
  }, [complaint, selectedInvestigator, token, fetchComplaint]);

  const rejectComplaint = useCallback(async () => {
    if (!complaint || !rejectReason) {
      toast.error('Alasan penolakan wajib diisi');
      return;
    }

    setIsRejecting(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/complaints/${complaint.id}/status`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          reject_reason: rejectReason,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Pengaduan ditolak');
        setShowRejectModal(false);
        setRejectReason('');
        fetchComplaint();
      } else {
        throw new Error(data.message || 'Gagal menolak pengaduan');
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Gagal menolak pengaduan');
    } finally {
      setIsRejecting(false);
    }
  }, [complaint, rejectReason, token, fetchComplaint]);

  const acceptComplaint = useCallback(async () => {
    if (!complaint) return;

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/complaints/${complaint.id}/status`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'investigation_assigned',
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Pengaduan diterima');
        fetchComplaint();
      } else {
        throw new Error(data.message || 'Gagal menerima pengaduan');
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Gagal menerima pengaduan');
    }
  }, [complaint, token, fetchComplaint]);

  const uploadImagesToSupabase = async (files: File[]): Promise<string[]> => {
    const supabase = createClientSupabaseClient();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const fileName = `completion/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        
        const { error } = await supabase.storage.from('complaints').upload(fileName, file);
        if (error) continue;
        
        const { data: { publicUrl } } = supabase.storage.from('complaints').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
    return uploadedUrls;
  };

  const handleCompleteImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 5) {
      toast.error('Maksimal 5 gambar');
      return;
    }

    setCompletionImages(prev => [...prev, ...imageFiles]);
    
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompletionPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeCompletionImage = (index: number) => {
    setCompletionImages(prev => prev.filter((_, i) => i !== index));
    setCompletionPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const completeComplaint = useCallback(async () => {
    if (!complaint) return;
    if (!workDetails.trim()) {
      toast.error('Detail pekerjaan wajib diisi');
      return;
    }

    setIsCompleting(true);
    try {
      let imageUrls: string[] = [];
      if (completionImages.length > 0) {
        toast.loading('Mengupload gambar...');
        imageUrls = await uploadImagesToSupabase(completionImages);
        toast.dismiss();
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/governor/complaints/${complaint.id}/completion-report`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          work_details: workDetails,
          final_photos: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
          completion_date: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Laporan penyelesaian berhasil dikirim');
        setShowCompleteModal(false);
        setWorkDetails('');
        setCompletionImages([]);
        setCompletionPreviews([]);
        fetchComplaint();
      } else {
        throw new Error(data.message || 'Gagal mengirim laporan');
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim laporan');
    } finally {
      setIsCompleting(false);
    }
  }, [complaint, token, workDetails, completionImages, fetchComplaint]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    if (user?.role !== 'governor') {
      router.replace('/auth/login');
    }
  }, [isHydrated, token, user, router]);

  useEffect(() => {
    if (isHydrated && token && user?.role === 'governor' && complaintId) {
      fetchComplaint();
      fetchInvestigators();
    }
  }, [isHydrated, token, user, complaintId, fetchComplaint, fetchInvestigators]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border border-destructive/20';
      case 'pending_governor':
        return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
      case 'investigation_assigned':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'investigation_done':
        return 'bg-purple-500/10 text-purple-600 border border-purple-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending_governor: 'Menunggu Gubernur',
      investigation_assigned: 'Investigasi Ditugaskan',
      investigation_done: 'Investigasi Selesai',
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
      });
    } catch {
      return '-';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground font-medium">Pengaduan tidak ditemukan</p>
        <Button onClick={() => router.push('/governor')} variant="outline" className="mt-4 border-border">
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  const canAccept = complaint.status === 'pending_governor';
  const canAssign = complaint.status === 'investigation_assigned' && !complaint.assigned_investigator_id;
  const canComplete = complaint.status === 'investigation_done';

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Tombol Back */}
        <Button 
          variant="ghost" 
          onClick={() => router.push('/governor')} 
          className="mb-6 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>

        {/* Header Panel */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Detail Pengaduan</h1>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusStyle(complaint.status)}`}>
                  {getStatusText(complaint.status)}
                </span>
              </div>
              <p className="text-muted-foreground font-mono text-sm mt-1">ID Pelacakan: #{complaint.tracking_code}</p>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-border bg-muted/20">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Informasi Laporan Masuk
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Grid Atribut Sekunder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-muted rounded-lg shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama Pelapor</p>
                  <p className="font-semibold text-foreground mt-0.5">{complaint.user_fullname || complaint.user_name}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 bg-muted rounded-lg shrink-0">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kategori Pengaduan</p>
                  <p className="font-semibold text-foreground mt-0.5">{complaint.category_name || '-'}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 bg-muted rounded-lg shrink-0">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lokasi Kejadian / Detail</p>
                  <p className="font-medium text-foreground mt-0.5">{complaint.location_detail}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 bg-muted rounded-lg shrink-0">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal Pengaduan</p>
                  <p className="font-medium text-foreground mt-0.5">{formatDate(complaint.created_at)}</p>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Deskripsi Utama */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Deskripsi Laporan Kejadian</label>
              <div className="bg-muted/40 p-4 rounded-xl border border-border/60 text-foreground leading-relaxed text-sm whitespace-pre-line">
                {complaint.description}
              </div>
            </div>

            {/* Bukti Foto Laporan */}
            {complaint.photo && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Lampiran Bukti Gambar</label>
                <div className="relative inline-block group">
                  <img 
                    src={complaint.photo} 
                    alt="Bukti Pengaduan" 
                    className="max-w-full sm:max-w-md h-auto max-h-64 object-cover rounded-xl border border-border shadow-sm transition-all group-hover:brightness-95" 
                  />
                </div>
              </div>
            )}

            {/* Blok Fleksibel Status Lanjutan (Investigator, Hasil, Penolakan) */}
            {complaint.assigned_investigator_id && (
              <div className="flex gap-3 items-start p-4 bg-primary/5 rounded-xl border border-primary/10">
                <Users className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-primary uppercase tracking-wider">Penanggung Jawab Lapangan</p>
                  <p className="font-semibold text-foreground mt-0.5">{complaint.assigned_investigator_name || 'Investigator'}</p>
                </div>
              </div>
            )}

            {complaint.investigation_result && (
              <div className="flex gap-3 items-start p-4 bg-purple-500/5 rounded-xl border border-purple-500/10">
                <FileText className="w-5 h-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">Berita Acara / Hasil Investigasi</p>
                  <p className="text-foreground text-sm mt-1 leading-relaxed">{complaint.investigation_result}</p>
                </div>
              </div>
            )}

            {complaint.rejected_reason && (
              <div className="flex gap-3 items-start p-4 bg-destructive/5 rounded-xl border border-destructive/10">
                <ShieldAlert className="w-5 h-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-destructive uppercase tracking-wider">Alasan Penolakan Laporan</p>
                  <p className="text-destructive font-medium text-sm mt-1 leading-relaxed">{complaint.rejected_reason}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tindakan Panel */}
        {(canAccept || canAssign || canComplete) && (
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              Aksi & Tindakan Gubernur
            </h2>
            <div className="flex flex-wrap gap-3">
              {canAccept && (
                <>
                  <Button onClick={acceptComplaint} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Terima Laporan
                  </Button>
                  <Button variant="destructive" onClick={() => setShowRejectModal(true)} className="font-medium shadow-sm">
                    <XCircle className="w-4 h-4 mr-2" />
                    Tolak Laporan
                  </Button>
                </>
              )}

              {canAssign && (
                <Button onClick={() => setShowAssignModal(true)} className="bg-primary hover:bg-primary/9 text-primary-foreground font-medium shadow-sm">
                  <Users className="w-4 h-4 mr-2" />
                  Tugaskan Investigator
                </Button>
              )}

              {canComplete && (
                <Button onClick={() => setShowCompleteModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm">
                  <FileCheck className="w-4 h-4 mr-2" />
                  Selesaikan Kasus
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Assign */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="bg-card border-border sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Tugaskan Investigator</DialogTitle>
            <DialogDescription className="text-muted-foreground">Pilih personel investigator wilayah untuk menangani berkas pengaduan ini.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <select
              className="w-full p-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              value={selectedInvestigator}
              onChange={(e) => setSelectedInvestigator(e.target.value)}
            >
              <option value="" className="text-muted-foreground">-- Pilih Personel --</option>
              {investigators.map((inv) => (
                <option key={inv.id} value={inv.id}>{inv.fullname || inv.username}</option>
              ))}
            </select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="border-border text-foreground" onClick={() => setShowAssignModal(false)}>Batal</Button>
            <Button onClick={assignInvestigator} disabled={isAssigning || !selectedInvestigator}>
              {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tugaskan Personel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Tolak */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="bg-card border-border sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Tolak Pengaduan</DialogTitle>
            <DialogDescription className="text-muted-foreground">Berikan argumentasi atau penjelasan resmi mengapa laporan penolakan ini dikeluarkan.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Berikan alasan logis penolakan berkas..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="bg-background border-border text-foreground resize-none"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="border-border text-foreground" onClick={() => setShowRejectModal(false)}>Batal</Button>
            <Button variant="destructive" onClick={rejectComplaint} disabled={isRejecting || !rejectReason}>
              {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Keluarkan Penolakan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Selesaikan */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Selesaikan Pengaduan</DialogTitle>
            <DialogDescription className="text-muted-foreground">Isi laporan akhir bukti penanganan infrastruktur/pekerjaan yang telah rampung.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium">Detail Pekerjaan Akhir <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Jelaskan rekonstruksi atau tindakan penyelesaian yang telah tuntas dilakukan di lokasi lapangan..."
                value={workDetails}
                onChange={(e) => setWorkDetails(e.target.value)}
                rows={4}
                className="bg-background border-border text-foreground resize-none mt-1"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground font-medium">Bukti Hasil Penyelesaian (Maks. 5 Gambar)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleCompleteImageSelect}
                className="hidden"
              />
              
              {completionPreviews.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer mt-1 bg-muted/20 hover:bg-muted/40 transition-colors group"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
                  <p className="text-sm font-medium text-foreground">Klik untuk unggah gambar dokumentasi</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Format file JPG, PNG maks. 5 item</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {completionPreviews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border group shadow-sm">
                      <img src={preview} alt="Dokumentasi Akhir" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeCompletionImage(idx)}
                        className="absolute top-1 right-1 bg-destructive hover:bg-destructive/9 text-white rounded-full p-1 opacity-90 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {completionPreviews.length < 5 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer bg-muted/10 hover:bg-muted/30 transition-colors"
                    >
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="border-border text-foreground" onClick={() => setShowCompleteModal(false)}>Batal</Button>
            <Button onClick={completeComplaint} className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isCompleting || !workDetails.trim()}>
              {isCompleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Laporan Selesai'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}