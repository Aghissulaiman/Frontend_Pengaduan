'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useAuthHydrated } from '@/hooks/use-auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  Loader2,
  FileText,
  Download,
  Clock,
  BarChart3,
  PieChart,
  FileBarChart,
  CalendarRange,
  Eye,
  RefreshCw,
  Search,
} from 'lucide-react';

import { toast } from 'sonner';

interface ReportStats {
  total: number;
  pending: number;
  investigation: number;
  completed: number;
  rejected: number;
  thisMonth: number;
  thisWeek: number;
  avgCompletionDays: number;
  byCategory: Array<{ name: string; count: number }>;
  byStatus: Array<{ name: string; count: number }>;
  byMonth: Array<{ month: string; count: number }>;
}

interface ComplaintReport {
  id: number;
  tracking_code: string;
  description: string;
  location_detail: string;
  status: string;
  status_text: string;
  created_at: string;
  completed_at?: string;
  user_name: string;
  category_name: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading, isHydrated } = useAuthHydrated();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [reports, setReports] = useState<ComplaintReport[]>([]);
  const [period, setPeriod] = useState<string>('month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintReport | null>(null);

  const fetchReports = useCallback(async () => {
    if (!token || !user) return;

    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        period: period,
        page: currentPage.toString(),
        limit: '20',
      });
      
      if (period === 'custom' && customStartDate && customEndDate) {
        params.append('start_date', customStartDate);
        params.append('end_date', customEndDate);
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/governor/reports?${params.toString()}`;

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
        setStats(data.data?.stats);
        setReports(data.data?.complaints || []);
        setTotalPages(Math.ceil((data.data?.total || 0) / 20));
      } else {
        toast.error(data.message || 'Gagal memuat data');
      }
    } catch (error) {
      console.error('Gagal ambil laporan:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [token, user, period, customStartDate, customEndDate, currentPage, statusFilter, searchTerm]);

  const exportToExcel = useCallback(async () => {
    if (!token) return;

    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        period: period,
        format: 'excel',
      });
      
      if (period === 'custom' && customStartDate && customEndDate) {
        params.append('start_date', customStartDate);
        params.append('end_date', customEndDate);
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/governor/reports/export?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Gagal export');

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `laporan_pengaduan_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Laporan berhasil diunduh');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal export laporan');
    } finally {
      setIsExporting(false);
    }
  }, [token, period, customStartDate, customEndDate]);

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
      fetchReports();
    }
  }, [isHydrated, token, user, fetchReports]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isHydrated && token && user?.role === 'governor') {
        setCurrentPage(1);
        fetchReports();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm, fetchReports, isHydrated, token, user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Selesai', color: 'bg-green-100 text-green-700' };
      case 'rejected':
        return { label: 'Ditolak', color: 'bg-red-100 text-red-700' };
      case 'pending_governor':
        return { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700' };
      case 'investigation_assigned':
        return { label: 'Investigasi', color: 'bg-blue-100 text-blue-700' };
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

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* HEADER */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FileBarChart className="w-6 h-6 text-blue-500" />
                Laporan Pengaduan
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Statistik dan laporan lengkap pengaduan masyarakat
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={exportToExcel} 
                disabled={isExporting}
                className="gap-2"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export Excel
              </Button>
              <Button 
                variant="outline" 
                onClick={fetchReports} 
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* PERIOD FILTER */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Periode:</span>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Pilih periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="week">Minggu Ini</SelectItem>
                <SelectItem value="month">Bulan Ini</SelectItem>
                <SelectItem value="year">Tahun Ini</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            
            {period === 'custom' && (
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-40"
                  placeholder="Mulai"
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-40"
                  placeholder="Selesai"
                />
                <Button size="sm" onClick={fetchReports}>Terapkan</Button>
              </div>
            )}
          </div>
        </div>

        {/* STATS CARDS */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-3">
                <p className="text-xs opacity-90">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <CardContent className="p-3">
                <p className="text-xs opacity-90">Menunggu</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-blue-400 to-blue-500 text-white">
              <CardContent className="p-3">
                <p className="text-xs opacity-90">Investigasi</p>
                <p className="text-2xl font-bold">{stats.investigation}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-3">
                <p className="text-xs opacity-90">Selesai</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardContent className="p-3">
                <p className="text-xs opacity-90">Ditolak</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-3">
                <p className="text-xs opacity-90">Minggu Ini</p>
                <p className="text-2xl font-bold">{stats.thisWeek}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <CardContent className="p-3">
                <p className="text-xs opacity-90">Bulan Ini</p>
                <p className="text-2xl font-bold">{stats.thisMonth}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CHARTS */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* By Status */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-500" />
                  Status Pengaduan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.byStatus?.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${(item.count / stats.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Category */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-500" />
                  Kategori Terbanyak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.byCategory?.slice(0, 5).map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 truncate">{item.name}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Avg Completion */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Rata-rata Penyelesaian
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{stats.avgCompletionDays || 0}</p>
                  <p className="text-sm text-gray-500">hari per pengaduan</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* DETAIL TABLE */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Detail Pengaduan
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-56 h-9 text-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="pending_governor">Menunggu</SelectItem>
                    <SelectItem value="investigation_assigned">Investigasi</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && reports.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">Tidak ada data</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-left text-gray-500">
                        <th className="pb-3 font-medium">Kode</th>
                        <th className="pb-3 font-medium">Deskripsi</th>
                        <th className="pb-3 font-medium">Kategori</th>
                        <th className="pb-3 font-medium">Pelapor</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Tanggal</th>
                        <th className="pb-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reports.map((item) => {
                        const status = getStatusBadge(item.status);
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="py-3 font-mono text-xs">{item.tracking_code}</td>
                            <td className="py-3 max-w-xs truncate">{item.description}</td>
                            <td className="py-3">{item.category_name}</td>
                            <td className="py-3">{item.user_name}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="py-3 text-xs">{formatDate(item.created_at)}</td>
                            <td className="py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedComplaint(item);
                                  setShowDetailModal(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
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
                    >
                      Selanjutnya
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pengaduan</DialogTitle>
            <DialogDescription>
              {selectedComplaint?.tracking_code}
            </DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Pelapor</p>
                  <p className="font-medium">{selectedComplaint.user_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Kategori</p>
                  <p className="font-medium">{selectedComplaint.category_name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Lokasi</p>
                  <p className="font-medium">{selectedComplaint.location_detail}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Deskripsi</p>
                  <p className="text-gray-700">{selectedComplaint.description}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <Badge className={getStatusBadge(selectedComplaint.status).color}>
                    {getStatusBadge(selectedComplaint.status).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-500">Tanggal</p>
                  <p className="font-medium">{formatDate(selectedComplaint.created_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Tutup
            </Button>
            <Link href={`/governor/complaints/${selectedComplaint?.id}`}>
              <Button>Lihat Detail Lengkap</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}