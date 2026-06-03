'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useAuthHydrated } from '@/hooks/use-auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import {
  Loader2,
  Bell,
  FileText,
  MapPin,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  Eye,
  UserCheck,
  UserX,
} from 'lucide-react';

import { toast } from 'sonner';

interface Complaint {
  id: number;
  tracking_code: string;
  description: string;
  location_detail: string;
  status: string;
  status_text: string;
  created_at: string;
  user_name: string;
  user_fullname?: string;
  photo?: string;
}

export default function GovernorPage() {
  const router = useRouter();

  const {
    user,
    token,
    isLoading: authLoading,
    isHydrated,
  } = useAuthHydrated();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComplaints, setTotalComplaints] = useState(0);

  const fetchComplaints = useCallback(async () => {
    if (!token || !user) return;

    setIsLoading(true);

    try {
      const provinceApiId = user.province_api_id || user.province_id;
      
      if (!provinceApiId) {
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/governor/complaints?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Gagal mengambil data');
      }

      if (data.success) {
        const complaintsData = data.data?.complaints || [];
        const total = data.data?.total || 0;
        const page = data.data?.page || 1;
        const limit = data.data?.limit || 10;
        
        setComplaints(complaintsData);
        setTotalComplaints(total);
        setTotalPages(Math.ceil(total / limit));
        setCurrentPage(page);
      } else {
        toast.error(data.message || 'Gagal memuat data');
        setComplaints([]);
      }
    } catch (error) {
      console.error('Gagal ambil pengaduan:', error);
      toast.error('Gagal memuat data');
      setComplaints([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, user, currentPage, statusFilter, searchTerm]);

  const updateStatus = useCallback(async (complaintId: number, status: string, rejectReason?: string) => {
    if (!token) return;

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/complaints/${complaintId}/status`;
      
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reject_reason: rejectReason,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Pengaduan ${status === 'investigation_assigned' ? 'diterima' : 'ditolak'}`);
        fetchComplaints();
      } else {
        throw new Error(data.message || 'Gagal mengupdate status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal mengupdate status');
    }
  }, [token, fetchComplaints]);

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
    if (!isHydrated) return;
    if (token && user?.role === 'governor') {
      fetchComplaints();
    }
  }, [isHydrated, token, user, fetchComplaints]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isHydrated && token && user?.role === 'governor') {
        setCurrentPage(1);
        fetchComplaints();
      }
    }, 400);
    
    return () => clearTimeout(timer);
  }, [searchTerm, fetchComplaints, isHydrated, token, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'pending_governor':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'investigation_assigned':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'investigation_done':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default:
        return 'bg-muted text-muted-foreground border-transparent';
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending_governor: 'Menunggu Gubernur',
      investigation_assigned: 'Investigasi Ditugaskan',
      investigation_done: 'Investigasi Selesai',
      governor_processing: 'Diproses Gubernur',
      process_report_submitted: 'Laporan Proses Dikirim',
      process_report_verified: 'Laporan Diverifikasi',
      completion_report_submitted: 'Laporan Akhir Dikirim',
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
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const complaintsArray = Array.isArray(complaints) ? complaints : [];

  if (!isHydrated || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* HEADER DILINK KE VARIABEL WARNA MODERN */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard Gubernur
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Selamat bekerja kembali, <span className="font-semibold text-foreground/95">{user?.fullname || user?.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 px-3 py-1 rounded-md text-xs font-medium">
              <MapPin className="w-3.5 h-3.5 mr-1.5 opacity-80" />
              {user?.province_api_id || user?.province_id || 'Provinsi'}
            </Badge>
            <Badge variant="outline" className="bg-muted text-muted-foreground border-border px-3 py-1 rounded-md text-xs font-medium">
              <FileText className="w-3.5 h-3.5 mr-1.5 opacity-80" />
              {totalComplaints} Pengaduan
            </Badge>
          </div>
        </div>

        {/* CONTROLS FILTERS */}
        <div className="bg-card rounded-xl border border-border shadow-xs mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                placeholder="Cari kode berkas atau deskripsi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background border-border text-sm rounded-lg shadow-none focus-visible:ring-primary"
              />
            </div>
            <div className="w-full sm:w-56">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background border-border text-sm rounded-lg shadow-none">
                  <div className="flex items-center gap-2 text-muted-foreground/80">
                    <Filter className="w-3.5 h-3.5" />
                    <SelectValue placeholder="Filter status" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending_governor">Menunggu Gubernur</SelectItem>
                  <SelectItem value="investigation_assigned">Investigasi Ditugaskan</SelectItem>
                  <SelectItem value="investigation_done">Investigasi Selesai</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCurrentPage(1);
                  fetchComplaints();
                }}
                className="text-muted-foreground hover:text-foreground text-sm font-medium h-9 px-3"
              >
                Reset
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={fetchComplaints} 
                disabled={isLoading}
                className="border-border bg-background h-9 w-9 shadow-none rounded-lg"
              >
                <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* DOKUMEN LIST UTAMA */}
        <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border/60 bg-muted/20">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Arsip Pengaduan Masuk
            </h2>
          </div>

          {isLoading && complaintsArray.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-20 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
              <span className="text-xs font-medium">Sinkronisasi data wilayah...</span>
            </div>
          ) : complaintsArray.length === 0 ? (
            <div className="text-center py-20 px-4">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3 stroke-[1.5]" />
              <p className="text-sm font-medium text-muted-foreground">Belum ada dokumen pengaduan</p>
              {(searchTerm || statusFilter !== 'all') && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="mt-1 text-xs text-primary"
                >
                  Bersihkan kriteria filter
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/60">
                {complaintsArray.map((complaint) => (
                  <div key={complaint.id} className="p-5 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold tracking-wide uppercase ${getStatusColor(complaint.status)}`}>
                          {getStatusText(complaint.status)}
                        </span>
                        <span className="text-xs font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          #{complaint.tracking_code}
                        </span>
                      </div>

                      <p className="text-foreground font-medium text-sm leading-relaxed line-clamp-2">
                        {complaint.description}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground/90 flex-wrap pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 opacity-60 shrink-0" />
                          <span className="truncate max-w-[180px]">{complaint.location_detail || 'Lokasi Umum'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 opacity-60 shrink-0" />
                          <span>{formatDate(complaint.created_at)}</span>
                        </span>
                        <span className="text-muted-foreground/70">
                          Pelapor: <span className="font-semibold text-foreground/80">{complaint.user_fullname || complaint.user_name || 'Masyarakat'}</span>
                        </span>
                      </div>

                      {complaint.photo && (
                        <div className="pt-1">
                          <img 
                            src={complaint.photo} 
                            alt="Bukti Lapangan" 
                            className="w-14 h-14 object-cover rounded-lg border border-border bg-muted"
                          />
                        </div>
                      )}
                    </div>

                    {/* ACTION PANEL */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Link href={`/governor/complaints/${complaint.id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs border-border bg-background shadow-none font-medium text-muted-foreground hover:text-foreground">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Tinjau
                        </Button>
                      </Link>

                      {complaint.status === 'pending_governor' && (
                        <>
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary-light font-medium shadow-none px-3"
                            onClick={() => updateStatus(complaint.id, 'investigation_assigned')}
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1" />
                            Terima
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 text-xs font-medium shadow-none px-3"
                            onClick={() => {
                              const reason = prompt('Masukkan alasan penolakan berkas:');
                              if (reason) updateStatus(complaint.id, 'rejected', reason);
                            }}
                          >
                            <UserX className="w-3.5 h-3.5 mr-1" />
                            Tolak
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-border/60 bg-muted/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-muted-foreground text-xs h-8"
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-xs font-medium text-muted-foreground">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="text-muted-foreground text-xs h-8"
                  >
                    Selanjutnya
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}