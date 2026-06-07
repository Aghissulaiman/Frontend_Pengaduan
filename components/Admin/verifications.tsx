// app/admin/verifications/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  User,
  FileText,
  Building2,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface CompletionReport {
  id: number;
  complaint_id: number;
  governor_id: number;
  governor_name: string;
  final_photos: string | null;
  completion_date: string;
  cost: number | null;
  cost_details: string | null;
  work_details: string | null;
  status: string;
  admin_notes: string | null;
  submitted_at: string;
  complaint: {
    tracking_code: string;
    description: string;
    location_detail: string;
    user_name: string;
    user_fullname: string;
    province_name: string;
  };
}

export default function AdminVerificationsPage() {
  const { token } = useAuth();
  const [completionReports, setCompletionReports] = useState<CompletionReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<CompletionReport | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  
  const limit = 10;

  const fetchCompletionReports = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/admin/completion-reports?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.success) {
        setCompletionReports(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / limit));
      } else {
        toast.error(data.message || 'Gagal memuat laporan');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Gagal memuat laporan');
    } finally {
      setIsLoading(false);
    }
  }, [token, page, search, limit]);

  useEffect(() => {
    if (token) {
      fetchCompletionReports();
    }
  }, [token, page, search, fetchCompletionReports]);

  const handleVerify = async (action: 'verified' | 'rejected') => {
    if (!selectedReport) return;
    
    setIsVerifying(true);
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/admin/completion-reports/${selectedReport.id}/verify`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: action,
          admin_note: adminNote || null
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Laporan berhasil ${action === 'verified' ? 'diverifikasi' : 'ditolak'}`);
        setShowDetailDialog(false);
        setAdminNote('');
        fetchCompletionReports();
      } else {
        toast.error(data.message || 'Gagal memverifikasi');
      }
    } catch (error) {
      console.error('Error verifying:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Menunggu Verifikasi', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> };
      case 'verified':
        return { label: 'Terverifikasi', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> };
      case 'rejected':
        return { label: 'Ditolak', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700', icon: <FileText className="w-3 h-3" /> };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parsePhotos = (photos: string | null): string[] => {
    if (!photos) return [];
    try {
      return JSON.parse(photos);
    } catch {
      return photos ? [photos] : [];
    }
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Verifikasi Laporan Akhir</h1>
        <p className="text-gray-500 mt-1">Verifikasi laporan akhir dari gubernur</p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari berdasarkan kode tracking..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Reports List */}
      {completionReports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Tidak ada laporan yang perlu diverifikasi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {completionReports.map((report) => {
            const status = getStatusBadge(report.status);
            const photos = parsePhotos(report.final_photos);
            
            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {report.complaint.tracking_code}
                        </span>
                        <Badge className={status.color}>
                          {status.icon}
                          <span className="ml-1">{status.label}</span>
                        </Badge>
                      </div>
                      
                      {/* Detail */}
                      <p className="text-gray-800 mb-2 line-clamp-2">
                        {report.complaint.description}
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-500 mt-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{report.complaint.province_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Gubernur: {report.governor_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Dikirim: {formatDate(report.submitted_at)}</span>
                        </div>
                        {report.work_details && (
                          <div className="flex items-center gap-2 col-span-2">
                            <FileText className="w-4 h-4" />
                            <span className="truncate">{report.work_details}</span>
                          </div>
                        )}
                      </div>

                      {/* Photo Preview */}
                      {photos.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {photos.slice(0, 3).map((photo, idx) => (
                            <div
                              key={idx}
                              className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition"
                              onClick={() => {
                                setSelectedImage(photo);
                                setShowImageModal(true);
                              }}
                            >
                              <img src={photo} alt={`Final ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {photos.length > 3 && (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                              +{photos.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setShowDetailDialog(true);
                        }}
                        className="gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Detail
                      </Button>
                      {report.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 gap-1"
                            onClick={() => {
                              setSelectedReport(report);
                              setAdminNote('');
                              handleVerify('verified');
                            }}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Verifikasi
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            onClick={() => {
                              setSelectedReport(report);
                              setShowDetailDialog(true);
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                            Tolak
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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

      {/* Detail & Verification Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Laporan Akhir</DialogTitle>
            <DialogDescription>
              Kode Tracking: {selectedReport?.complaint?.tracking_code}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              {/* Informasi Pengaduan */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Informasi Pengaduan</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Pelapor</p>
                    <p className="font-medium">{selectedReport.complaint.user_fullname || selectedReport.complaint.user_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Provinsi</p>
                    <p>{selectedReport.complaint.province_name}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Lokasi</p>
                    <p>{selectedReport.complaint.location_detail}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Deskripsi</p>
                    <p className="text-sm">{selectedReport.complaint.description}</p>
                  </div>
                </div>
              </div>

              {/* Informasi Laporan Gubernur */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-3">Laporan Akhir</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Gubernur: {selectedReport.governor_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Dikirim: {formatDate(selectedReport.submitted_at)}</span>
                  </div>
                  
                  {selectedReport.work_details && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Detail Pekerjaan</p>
                      <p className="bg-white p-2 rounded">{selectedReport.work_details}</p>
                    </div>
                  )}
                  
                  {selectedReport.cost && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Biaya</p>
                      <p className="font-medium">Rp {selectedReport.cost.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Foto-foto */}
              {(() => {
                const photos = parsePhotos(selectedReport.final_photos);
                if (photos.length > 0) {
                  return (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Dokumentasi Foto</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {photos.map((photo, idx) => (
                          <div
                            key={idx}
                            className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition"
                            onClick={() => {
                              setSelectedImage(photo);
                              setShowImageModal(true);
                            }}
                          >
                            <img src={photo} alt={`Dokumentasi ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Verification Section */}
              {selectedReport.status === 'pending' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Verifikasi Laporan</h3>
                  <Textarea
                    placeholder="Catatan admin (opsional)"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    className="mb-3"
                  />
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleVerify('verified')}
                      disabled={isVerifying}
                    >
                      {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Setujui & Verifikasi
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleVerify('rejected')}
                      disabled={isVerifying}
                    >
                      {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Tolak
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/95 border-0">
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center justify-center w-full h-[85vh]">
            {selectedImage && (
              <img src={selectedImage} alt="Full size" className="max-w-full max-h-full object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}