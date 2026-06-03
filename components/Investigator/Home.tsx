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

import {
  Loader2,
  FileText,
  MapPin,
  Calendar,
  ClipboardList,
  Clock,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
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

interface Stats {
  total: number;
  investigation_assigned: number;
  investigation_done: number;
  completed: number;
}

export default function InvestigatorPage() {
  const router = useRouter();

  const {
    user,
    token,
    isLoading: authLoading,
    isHydrated,
  } = useAuthHydrated();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    investigation_assigned: 0,
    investigation_done: 0,
    completed: 0,
  });
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

      const url = `${process.env.NEXT_PUBLIC_API_URL}/investigator/complaints?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        const complaintsData = data.data?.complaints || [];
        const total = data.data?.total || 0;
        const limit = data.data?.limit || 10;
        
        setComplaints(complaintsData);
        setTotalComplaints(total);
        setTotalPages(Math.ceil(total / limit));
      } else {
        toast.error(data.message || 'Gagal memuat data');
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [token, user, currentPage, statusFilter, searchTerm]);

  const fetchStats = useCallback(async () => {
    if (!token || !user) return;

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/investigator/dashboard/stats`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch (error) {
      console.error(error);
    }
  }, [token, user]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    if (user?.role !== 'investigator') {
      router.replace('/auth/login');
    }
  }, [isHydrated, token, user, router]);

  useEffect(() => {
    if (!isHydrated) return;
    if (token && user?.role === 'investigator') {
      fetchComplaints();
      fetchStats();
    }
  }, [isHydrated, token, user, fetchComplaints, fetchStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isHydrated && token && user?.role === 'investigator') {
        setCurrentPage(1);
        fetchComplaints();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchComplaints, isHydrated, token, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'investigation_assigned':
        return 'bg-blue-100 text-blue-700';
      case 'investigation_done':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      investigation_assigned: 'Menunggu Investigasi',
      investigation_done: 'Investigasi Selesai',
      completed: 'Selesai',
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

  if (!isHydrated || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isLoading && complaints.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">Memuat data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <ClipboardList className="w-7 h-7 text-blue-500" />
                Dashboard Investigator
              </h1>
              <p className="text-gray-500 mt-1">
                Halo, {user?.fullname || user?.username}! Selamat datang di dashboard Investigator.
              </p>
            </div>
            <Link href="/investigator/history">
              <Button variant="outline" size="sm">
                <Clock className="w-4 h-4 mr-2" />
                Riwayat
              </Button>
            </Link>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <FileText className="w-5 h-5 opacity-80" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
              <p className="text-sm opacity-90 mt-1">Total Tugas</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <Clock className="w-5 h-5 opacity-80" />
                <span className="text-2xl font-bold">{stats.investigation_assigned}</span>
              </div>
              <p className="text-sm opacity-90 mt-1">Menunggu Investigasi</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <ClipboardList className="w-5 h-5 opacity-80" />
                <span className="text-2xl font-bold">{stats.investigation_done}</span>
              </div>
              <p className="text-sm opacity-90 mt-1">Investigasi Selesai</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <CheckCircle className="w-5 h-5 opacity-80" />
                <span className="text-2xl font-bold">{stats.completed}</span>
              </div>
              <p className="text-sm opacity-90 mt-1">Selesai</p>
            </CardContent>
          </Card>
        </div>

        {/* FILTERS */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari berdasarkan tracking code atau deskripsi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="w-full sm:w-64">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="investigation_assigned">Menunggu Investigasi</SelectItem>
                    <SelectItem value="investigation_done">Investigasi Selesai</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={fetchComplaints} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* LIST PENGADUAN - KLIK CARD LANGSUNG KE DETAIL */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              Tugas Investigasi
            </h2>

            {complaints.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400">Belum ada tugas investigasi</p>
                {(searchTerm || statusFilter !== 'all') && (
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="mt-2"
                  >
                    Hapus filter
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.map((complaint) => (
                  <Link 
                    key={complaint.id} 
                    href={`/investigator/complaints/${complaint.id}`}
                    className="block"
                  >
                    <div className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                              {getStatusText(complaint.status)}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">#{complaint.tracking_code}</span>
                          </div>

                          <p className="font-medium text-gray-800 text-sm line-clamp-2">
                            {complaint.description}
                          </p>

                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {complaint.location_detail || '-'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(complaint.created_at)}
                            </span>
                          </div>

                          <p className="text-xs text-gray-400 mt-1">
                            Pelapor: {complaint.user_fullname || complaint.user_name}
                          </p>

                          {complaint.photo && (
                            <img 
                              src={complaint.photo} 
                              alt="Bukti" 
                              className="mt-2 w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm text-gray-500">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}