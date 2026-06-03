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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import {
  Loader2,
  Search,
  Filter,
  Eye,
  UserCheck,
  UserX,
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  Building2,
  User,
  Phone,
  Mail,
  XCircle
} from 'lucide-react';

import { toast } from 'sonner';

interface Investigation {
  id: number;
  complaint_id: number;
  tracking_code: string;
  description: string;
  location_detail: string;
  status: string;
  created_at: string;
  user_name: string;
  user_fullname?: string;
  investigator_name?: string;
  investigator_id?: number;
  assigned_at?: string;
  completed_at?: string;
  notes?: string;
}

export default function InvestigationsPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading, isHydrated } = useAuthHydrated();
  
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch investigations
  const fetchInvestigations = useCallback(async () => {
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

      // Endpoint untuk mendapatkan investigasi
      const url = `${process.env.NEXT_PUBLIC_API_URL}/governor/investigations?${params.toString()}`;

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
        const investigationsData = data.data?.investigations || [];
        const total = data.data?.total || 0;
        const limit = data.data?.limit || 10;
        
        setInvestigations(investigationsData);
        setTotalPages(Math.ceil(total / limit));
      } else {
        toast.error(data.message || 'Gagal memuat data');
        setInvestigations([]);
      }
    } catch (error) {
      console.error('Gagal ambil investigasi:', error);
      toast.error('Gagal memuat data');
      setInvestigations([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, user, currentPage, statusFilter, searchTerm]);

  // Assign investigator
  const assignInvestigator = useCallback(async (investigationId: number, investigatorId: number) => {
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/governor/investigations/${investigationId}/assign`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ investigator_id: investigatorId }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Investigasi berhasil ditugaskan');
        fetchInvestigations();
      } else {
        throw new Error(data.message || 'Gagal menugaskan investigator');
      }
    } catch (error) {
      console.error('Failed to assign investigator:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menugaskan investigator');
    }
  }, [token, fetchInvestigations]);

  // Verify investigation
  const verifyInvestigation = useCallback(async (investigationId: number, isApproved: boolean, notes?: string) => {
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/governor/investigations/${investigationId}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: isApproved ? 'approved' : 'rejected',
          notes 
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Investigasi ${isApproved ? 'disetujui' : 'ditolak'}`);
        fetchInvestigations();
      } else {
        throw new Error(data.message || 'Gagal memverifikasi investigasi');
      }
    } catch (error) {
      console.error('Failed to verify investigation:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal memverifikasi investigasi');
    }
  }, [token, fetchInvestigations]);

  // Auth check
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

  // Fetch data
  useEffect(() => {
    if (!isHydrated) return;
    if (token && user?.role === 'governor') {
      fetchInvestigations();
    }
  }, [isHydrated, token, user, fetchInvestigations]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isHydrated && token && user?.role === 'governor') {
        setCurrentPage(1);
        fetchInvestigations();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm, fetchInvestigations, isHydrated, token, user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_assignment':
        return { label: 'Menunggu Penugasan', color: 'bg-yellow-100 text-yellow-700' };
      case 'in_progress':
        return { label: 'Sedang Berjalan', color: 'bg-blue-100 text-blue-700' };
      case 'completed':
        return { label: 'Selesai', color: 'bg-green-100 text-green-700' };
      case 'rejected':
        return { label: 'Ditolak', color: 'bg-red-100 text-red-700' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  if (!isHydrated || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const filteredInvestigations = investigations.filter(inv => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return inv.status === 'pending_assignment';
    if (activeTab === 'progress') return inv.status === 'in_progress';
    if (activeTab === 'completed') return inv.status === 'completed';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Manajemen Investigasi
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola dan pantau progress investigasi pengaduan
          </p>
        </div>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Semua
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Menunggu Penugasan
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Sedang Berjalan
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Selesai
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* FILTERS */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari tracking code atau deskripsi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>
            <div className="w-full sm:w-56">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending_assignment">Menunggu Penugasan</SelectItem>
                  <SelectItem value="in_progress">Sedang Berjalan</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCurrentPage(1);
                fetchInvestigations();
              }}
              className="text-gray-500"
            >
              Reset
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={fetchInvestigations} 
              disabled={isLoading}
              className="border-gray-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* LIST INVESTIGATIONS */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Daftar Investigasi
            </h2>
          </div>

          {isLoading && filteredInvestigations.length === 0 ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-400">Memuat...</span>
            </div>
          ) : filteredInvestigations.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">Belum ada data investigasi</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {filteredInvestigations.map((investigation) => {
                  const statusBadge = getStatusBadge(investigation.status);
                  return (
                    <div key={investigation.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        {/* LEFT CONTENT */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                              {statusBadge.label}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                              {investigation.tracking_code}
                            </span>
                          </div>

                          <p className="text-gray-800 text-sm font-medium line-clamp-2">
                            {investigation.description}
                          </p>

                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {investigation.location_detail || '-'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(investigation.created_at)}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="flex items-center gap-1 text-gray-500">
                              <User className="w-3 h-3" />
                              Pelapor: {investigation.user_fullname || investigation.user_name}
                            </span>
                            {investigation.investigator_name && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <Users className="w-3 h-3" />
                                Investigator: {investigation.investigator_name}
                              </span>
                            )}
                          </div>

                          {investigation.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                              <MessageSquare className="w-3 h-3 inline mr-1" />
                              {investigation.notes}
                            </div>
                          )}
                        </div>

                        {/* RIGHT ACTIONS */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Link href={`/governor/investigations/${investigation.id}`}>
                            <Button variant="outline" size="sm" className="gap-1 border-gray-200">
                              <Eye className="w-3 h-3" />
                              Detail
                            </Button>
                          </Link>

                          {investigation.status === 'pending_assignment' && (
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white gap-1"
                              onClick={() => {
                                const investigatorId = prompt('Masukkan ID Investigator:');
                                if (investigatorId) {
                                  assignInvestigator(investigation.id, parseInt(investigatorId));
                                }
                              }}
                            >
                              <UserCheck className="w-3 h-3" />
                              Tugaskan
                            </Button>
                          )}

                          {investigation.status === 'in_progress' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white gap-1"
                                onClick={() => verifyInvestigation(investigation.id, true)}
                              >
                                <CheckCircle className="w-3 h-3" />
                                Setujui
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="gap-1"
                                onClick={() => {
                                  const notes = prompt('Alasan penolakan:');
                                  if (notes) {
                                    verifyInvestigation(investigation.id, false, notes);
                                  }
                                }}
                              >
                                <XCircle className="w-3 h-3" />
                                Tolak
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-gray-500"
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-sm text-gray-400">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="text-gray-500"
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