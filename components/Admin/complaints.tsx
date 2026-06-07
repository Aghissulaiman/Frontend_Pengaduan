// app/admin/complaints/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Loader2, 
  Search, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Calendar,
  User,
  FileText,
  Building2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface Complaint {
  id: number;
  tracking_code: string;
  user_name: string;
  user_fullname: string;
  description: string;
  location_detail: string;
  category_name: string;
  status: string;
  status_text: string;
  created_at: string;
  province_name: string;
  regency_name?: string;
  photo?: string;
}

interface Province {
  id: number;
  name: string;
  total_complaints: number;
}

export default function AdminComplaintsPage() {
  const { token } = useAuth();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const limit = 10;

  // Fetch provinces with complaint counts
  useEffect(() => {
    if (token) {
      fetchProvinces();
    }
  }, [token]);

  // Fetch complaints when province or filters change
  useEffect(() => {
    if (token && selectedProvince) {
      fetchComplaints();
    }
  }, [token, selectedProvince, page, statusFilter, search]);

  const fetchProvinces = async () => {
    setIsLoading(true);
    try {
      // Fetch provinces from your API
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/provinces`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        // Get complaint counts per province
        const provincesWithCounts = await Promise.all(
          (data.data || []).map(async (prov: any) => {
            const countRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/admin/complaints/count?province_api_id=${prov.api_id}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const countData = await countRes.json();
            return {
              id: prov.api_id,
              name: prov.name,
              total_complaints: countData.total || 0
            };
          })
        );
        setProvinces(provincesWithCounts.filter(p => p.total_complaints > 0));
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComplaints = async () => {
  if (!selectedProvince) return;
  
  setIsLoadingComplaints(true);
  try {
    // 🔥 PAKAI ENDPOINT /by-province
    let url = `${process.env.NEXT_PUBLIC_API_URL}/admin/complaints/by-province?province_api_id=${selectedProvince.id}&page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (statusFilter !== 'all') url += `&status=${statusFilter}`;
    
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    
    console.log('Complaints response:', data);
    
    if (data.success) {
      setComplaints(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / limit));
    }
  } catch (error) {
    console.error('Error fetching complaints:', error);
  } finally {
    setIsLoadingComplaints(false);
  }
};

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: JSX.Element }> = {
      pending_governor: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> },
      investigation_assigned: { label: 'Investigasi', color: 'bg-blue-100 text-blue-700', icon: <Search className="w-3 h-3" /> },
      investigation_done: { label: 'Investigasi Selesai', color: 'bg-indigo-100 text-indigo-700', icon: <CheckCircle className="w-3 h-3" /> },
      governor_processing: { label: 'Diproses', color: 'bg-purple-100 text-purple-700', icon: <Clock className="w-3 h-3" /> },
      process_report_submitted: { label: 'Laporan Proses', color: 'bg-orange-100 text-orange-700', icon: <FileText className="w-3 h-3" /> },
      completion_report_submitted: { label: 'Laporan Akhir', color: 'bg-pink-100 text-pink-700', icon: <FileText className="w-3 h-3" /> },
      completed: { label: 'Selesai', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
      rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
    };
    const config = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: <FileText className="w-3 h-3" /> };
    return config;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Kelola Pengaduan</h1>
        <p className="text-gray-500 mt-1">Pilih provinsi untuk melihat daftar pengaduan</p>
      </div>

      {/* Provinsi Grid - Kotak-kotak provinsi */}
      {!selectedProvince ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {provinces.map((province) => (
            <Card
              key={province.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-500 group"
              onClick={() => setSelectedProvince(province)}
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition">
                  <Building2 className="w-8 h-8 text-blue-600 group-hover:text-white transition" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{province.name}</h3>
                <p className="text-sm text-gray-500">
                  {province.total_complaints} Pengaduan
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedProvince(null);
              setComplaints([]);
              setPage(1);
            }}
            className="mb-4 gap-2"
          >
            ← Kembali ke Daftar Provinsi
          </Button>

          {/* Province Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">{selectedProvince.name}</h2>
            <p className="text-blue-100">Total {total} pengaduan di provinsi ini</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari berdasarkan kode atau deskripsi..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending_governor">Menunggu</SelectItem>
                <SelectItem value="investigation_assigned">Investigasi</SelectItem>
                <SelectItem value="investigation_done">Investigasi Selesai</SelectItem>
                <SelectItem value="process_report_submitted">Laporan Proses</SelectItem>
                <SelectItem value="completion_report_submitted">Laporan Akhir</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Complaints Table */}
          <Card>
            <CardContent className="p-0">
              {isLoadingComplaints ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Tidak ada pengaduan</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Pelapor</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complaints.map((complaint) => {
                        const status = getStatusBadge(complaint.status);
                        return (
                          <TableRow key={complaint.id}>
                            <TableCell className="font-mono text-xs">
                              {complaint.tracking_code}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{complaint.user_fullname || complaint.user_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="max-w-xs truncate text-sm">{complaint.description}</p>
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                <MapPin className="w-3 h-3" />
                                {complaint.location_detail}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                                {complaint.category_name}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`flex items-center gap-1 w-fit ${status.color}`}>
                                {status.icon}
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(complaint.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedComplaint(complaint);
                                  setShowDetailDialog(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-4 p-4 border-t">
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
                      <span className="text-sm text-gray-600">
                        Halaman {page} dari {totalPages}
                      </span>
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
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pengaduan</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Kode Tracking</p>
                <p className="font-mono font-semibold">{selectedComplaint.tracking_code}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Pelapor</p>
                  <p className="font-medium">{selectedComplaint.user_fullname || selectedComplaint.user_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Kategori</p>
                  <p>{selectedComplaint.category_name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Lokasi</p>
                  <p className="text-sm">{selectedComplaint.location_detail}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Deskripsi</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedComplaint.description}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge className={getStatusBadge(selectedComplaint.status).color}>
                    {getStatusBadge(selectedComplaint.status).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tanggal Lapor</p>
                  <p className="text-sm">{formatDate(selectedComplaint.created_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}