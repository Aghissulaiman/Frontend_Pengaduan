'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Loader2, 
  MapPin, 
  Calendar, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  User,
  Image as ImageIcon,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ComplaintItem {
  id: number;
  tracking_code: string;
  description: string;
  location_detail: string;
  category_name: string;
  status: string;
  status_text: string;
  created_at: string;
  updated_at: string;
  photo?: string;
  user_name: string;
  user_fullname: string;
  rejected_reason?: string;
  investigation_result?: string;
}

export default function ComplaintHistory() {
  const { token, user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const limit = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (token) {
      fetchMyComplaints();
    }
  }, [token, page, debouncedSearch, statusFilter]);

  const fetchMyComplaints = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/complaints/my?page=${page}&limit=${limit}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      
      console.log('📤 Fetching complaints:', url);
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      console.log('📦 Complaints response:', data);
      
      if (data.success) {
        setComplaints(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / limit));
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
      pending_governor: {
        label: 'Menunggu',
        icon: <Clock className="w-3.5 h-3.5" />,
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50 border-yellow-200'
      },
      investigation_assigned: {
        label: 'Investigasi',
        icon: <Search className="w-3.5 h-3.5" />,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50 border-blue-200'
      },
      investigation_done: {
        label: 'Investigasi Selesai',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-50 border-indigo-200'
      },
      governor_processing: {
        label: 'Diproses',
        icon: <Clock className="w-3.5 h-3.5" />,
        color: 'text-purple-700',
        bgColor: 'bg-purple-50 border-purple-200'
      },
      completed: {
        label: 'Selesai',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        color: 'text-green-700',
        bgColor: 'bg-green-50 border-green-200'
      },
      rejected: {
        label: 'Ditolak',
        icon: <XCircle className="w-3.5 h-3.5" />,
        color: 'text-red-700',
        bgColor: 'bg-red-50 border-red-200'
      },
    };
    return configs[status] || {
      label: status,
      icon: <FileText className="w-3.5 h-3.5" />,
      color: 'text-gray-700',
      bgColor: 'bg-gray-50 border-gray-200'
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Hari ini, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Kemarin, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} hari yang lalu`;
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || '?';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Memuat riwayat pengaduan...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Belum Login</h3>
        <p className="text-muted-foreground text-center max-w-sm">
          Silakan login terlebih dahulu untuk melihat riwayat pengaduan Anda
        </p>
        <Link href="/auth/login">
          <Button className="mt-2">Login Sekarang</Button>
        </Link>
      </div>
    );
  }

  if (complaints.length === 0 && !search && statusFilter === 'all') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
          <FileText className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">Belum Ada Pengaduan</h3>
        <p className="text-muted-foreground text-center max-w-sm">
          Anda belum pernah membuat pengaduan. Buat pengaduan pertama Anda sekarang!
        </p>
        <Link href="/complaints/submit">
          <Button className="mt-2">Buat Pengaduan Baru</Button>
        </Link>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Search className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Tidak Ditemukan</h3>
        <p className="text-muted-foreground text-center">
          Tidak ada pengaduan yang sesuai dengan pencarian Anda
        </p>
        <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
          Hapus Filter
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Riwayat Pengaduan</h1>
          <p className="text-muted-foreground">
            Menampilkan {complaints.length} dari {total} pengaduan
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan kode tracking atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending_governor">Menunggu</SelectItem>
              <SelectItem value="investigation_assigned">Investigasi</SelectItem>
              <SelectItem value="investigation_done">Investigasi Selesai</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Daftar Pengaduan */}
        <div className="space-y-4">
          {complaints.map((complaint) => {
            const statusConfig = getStatusConfig(complaint.status);
            return (
              <Link href={`/home/complaints/${complaint.id}`} key={complaint.id}>
                <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 hover:border-l-primary">
                  <CardContent className="p-5">
                    {/* Header Card */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-medium px-2 py-1 rounded-md bg-muted">
                          {complaint.tracking_code}
                        </span>
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                          {statusConfig.icon}
                          <span>{statusConfig.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(complaint.created_at)}</span>
                      </div>
                    </div>

                    {/* Deskripsi */}
                    <p className="text-foreground font-medium mb-3 line-clamp-2">
                      {complaint.description}
                    </p>

                    {/* Informasi Detail */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        <span>{complaint.category_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{complaint.location_detail}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>{complaint.user_fullname || complaint.user_name}</span>
                      </div>
                    </div>

                    {/* Foto (jika ada) */}
                    {complaint.photo && (
                      <div className="mt-3 mb-4">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={complaint.photo} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer Card */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Klik untuk melihat detail</span>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 text-primary">
                        <Eye className="w-4 h-4" />
                        Detail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </Button>
            
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Halaman</span>
              <span className="font-semibold text-foreground">{page}</span>
              <span className="text-muted-foreground">dari</span>
              <span className="font-semibold text-foreground">{totalPages}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="gap-1"
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}