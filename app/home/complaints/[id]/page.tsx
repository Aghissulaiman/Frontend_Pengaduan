// app/home/complaints/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ArrowLeft, ImageIcon, FileText, Calendar, MapPin, User, FolderTree, CheckCircle, XCircle, Clock, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface ComplaintDetail {
    id: number;
    tracking_code: string;
    description: string;
    location_detail: string;
    status: string;
    status_text: string;
    created_at: string;
    photo?: string;
    user_name: string;
    user_fullname: string;
    province_name: string;
    category_name: string;
    rejected_reason?: string;
    assigned_investigator_name?: string;
    investigation_result?: string;
    investigation_evidence?: string;
    updated_at: string;
}

interface ProcessReport {
    id: number;
    process_photos: string | null;
    process_notes: string | null;
    process_date: string;
    status: string;
    submitted_at: string;
    governor_name: string;
}

interface CompletionReport {
    id: number;
    final_photos: string | null;
    completion_date: string;
    work_details: string | null;
    cost: number | null;
    cost_details: string | null;
    status: string;
    submitted_at: string;
    governor_name: string;
}

export default function ComplaintDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { token } = useAuth();
    const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
    const [processReports, setProcessReports] = useState<ProcessReport[]>([]);
    const [completionReports, setCompletionReports] = useState<CompletionReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'detail' | 'process' | 'completion'>('detail');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        investigation: true,
        rejection: true,
    });

    const fetchDetail = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/${params.id}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setComplaint(data.data);
            }
        } catch (error) {
            console.error('Gagal ambil detail:', error);
        }
    };

    const fetchProcessReports = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/${params.id}/process-reports`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setProcessReports(data.data || []);
            }
        } catch (error) {
            console.error('Gagal ambil laporan proses:', error);
        }
    };

    const fetchCompletionReports = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/${params.id}/completion-reports`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setCompletionReports(data.data || []);
            }
        } catch (error) {
            console.error('Gagal ambil laporan akhir:', error);
        }
    };

    useEffect(() => {
        if (token && params.id) {
            Promise.all([
                fetchDetail(),
                fetchProcessReports(),
                fetchCompletionReports()
            ]).finally(() => setLoading(false));
        }
    }, [token, params.id]);

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; color: string; bgColor: string; icon: JSX.Element }> = {
            pending_governor: { label: 'Menunggu Gubernur', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: <Clock className="w-3 h-3" /> },
            investigation_assigned: { label: 'Investigasi', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: <Clock className="w-3 h-3" /> },
            investigation_done: { label: 'Investigasi Selesai', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: <CheckCircle className="w-3 h-3" /> },
            governor_processing: { label: 'Diproses Gubernur', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: <Clock className="w-3 h-3" /> },
            process_report_submitted: { label: 'Laporan Proses', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: <FileText className="w-3 h-3" /> },
            completion_report_submitted: { label: 'Laporan Akhir', color: 'text-pink-700', bgColor: 'bg-pink-100', icon: <FileText className="w-3 h-3" /> },
            completed: { label: 'Selesai', color: 'text-green-700', bgColor: 'bg-green-100', icon: <CheckCircle className="w-3 h-3" /> },
            rejected: { label: 'Ditolak', color: 'text-red-700', bgColor: 'bg-red-100', icon: <XCircle className="w-3 h-3" /> },
        };
        return statusMap[status] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100', icon: <FileText className="w-3 h-3" /> };
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

    const status = complaint ? getStatusBadge(complaint.status) : { label: '', color: '', bgColor: '', icon: <></> };
    const hasProcessReports = processReports.length > 0;
    const hasCompletionReports = completionReports.length > 0;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Pengaduan tidak ditemukan</p>
                <Link href="/home" className="text-blue-500 hover:underline mt-2 inline-block">
                    Kembali ke Beranda
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Tombol Kembali */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Kembali</span>
                </button>

                {/* Card Utama */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header dengan Tracking Code dan Status */}
                    <div className="p-5 border-b bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">Detail Pengaduan</h1>
                                <p className="text-sm text-gray-500 font-mono mt-1">{complaint.tracking_code}</p>
                            </div>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.bgColor} ${status.color} w-fit`}>
                                {status.icon}
                                <span>{status.label}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation - Sticky */}
                    <div className="border-b bg-white sticky top-0 z-10">
                        <div className="flex gap-1 p-2">
                            <button
                                onClick={() => setActiveTab('detail')}
                                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                    activeTab === 'detail'
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                Detail Pengaduan
                            </button>
                            {hasProcessReports && (
                                <button
                                    onClick={() => setActiveTab('process')}
                                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                        activeTab === 'process'
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    Laporan Proses
                                    <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">
                                        {processReports.length}
                                    </span>
                                </button>
                            )}
                            {hasCompletionReports && (
                                <button
                                    onClick={() => setActiveTab('completion')}
                                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                        activeTab === 'completion'
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    Laporan Akhir
                                    <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">
                                        {completionReports.length}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tab Detail Pengaduan */}
                    {activeTab === 'detail' && (
                        <div className="p-5 space-y-5">
                            {/* Grid Informasi 2 Kolom */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Pelapor</p>
                                        <p className="font-medium text-gray-800 truncate">{complaint.user_fullname || complaint.user_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Provinsi</p>
                                        <p className="font-medium text-gray-800 truncate">{complaint.province_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <FolderTree className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Kategori</p>
                                        <p className="font-medium text-gray-800">{complaint.category_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Tanggal Lapor</p>
                                        <p className="font-medium text-gray-800">{formatDate(complaint.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Lokasi */}
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Lokasi</p>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg mt-1 text-sm break-words">{complaint.location_detail}</p>
                                </div>
                            </div>

                            {/* Deskripsi */}
                            <div className="flex items-start gap-3">
                                <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Deskripsi</p>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg mt-1 text-sm whitespace-pre-wrap break-words">{complaint.description}</p>
                                </div>
                            </div>

                            {/* Foto Bukti */}
                            {complaint.photo && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Bukti Foto</p>
                                    <div 
                                        className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition inline-block max-w-full"
                                        onClick={() => {
                                            setSelectedImage(complaint.photo);
                                            setShowImageModal(true);
                                        }}
                                    >
                                        <img src={complaint.photo} alt="Bukti pengaduan" className="max-w-full max-h-80 object-contain" />
                                    </div>
                                </div>
                            )}

                            {/* Hasil Investigasi - Collapsible */}
                            {complaint.investigation_result && (
                                <div className="border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setExpandedSections(prev => ({ ...prev, investigation: !prev.investigation }))}
                                        className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 transition"
                                    >
                                        <span className="font-semibold text-blue-800 text-sm">Hasil Investigasi</span>
                                        {expandedSections.investigation ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
                                    </button>
                                    {expandedSections.investigation && (
                                        <div className="p-4 space-y-3">
                                            <p className="text-gray-700 text-sm">{complaint.investigation_result}</p>
                                            {complaint.investigation_evidence && (
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-2">Bukti Investigasi</p>
                                                    <div 
                                                        className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition inline-block"
                                                        onClick={() => {
                                                            setSelectedImage(complaint.investigation_evidence);
                                                            setShowImageModal(true);
                                                        }}
                                                    >
                                                        <img src={complaint.investigation_evidence} alt="Bukti investigasi" className="max-w-full max-h-64 object-contain" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Alasan Ditolak - Collapsible */}
                            {complaint.rejected_reason && (
                                <div className="border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setExpandedSections(prev => ({ ...prev, rejection: !prev.rejection }))}
                                        className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 transition"
                                    >
                                        <span className="font-semibold text-red-800 text-sm">Alasan Penolakan</span>
                                        {expandedSections.rejection ? <ChevronUp className="w-4 h-4 text-red-600" /> : <ChevronDown className="w-4 h-4 text-red-600" />}
                                    </button>
                                    {expandedSections.rejection && (
                                        <div className="p-4">
                                            <p className="text-gray-700 text-sm">{complaint.rejected_reason}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab Laporan Proses */}
                    {activeTab === 'process' && (
                        <div className="p-5 space-y-5">
                            {processReports.map((report, idx) => {
                                const photos = parsePhotos(report.process_photos);
                                return (
                                    <div key={report.id} className="border rounded-lg overflow-hidden">
                                        <div className="bg-orange-50 p-3 border-b">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-orange-800 text-sm">Laporan Proses #{idx + 1}</p>
                                                    <p className="text-xs text-orange-600">Dari: {report.governor_name}</p>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(report.submitted_at)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            {report.process_notes && (
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Catatan</p>
                                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{report.process_notes}</p>
                                                </div>
                                            )}
                                            {photos.length > 0 && (
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Dokumentasi</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                        {photos.map((photo, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition"
                                                                onClick={() => {
                                                                    setSelectedImage(photo);
                                                                    setShowImageModal(true);
                                                                }}
                                                            >
                                                                <img src={photo} alt={`Proses ${idx + 1}`} className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Tab Laporan Akhir */}
                    {activeTab === 'completion' && (
                        <div className="p-5 space-y-5">
                            {completionReports.map((report, idx) => {
                                const photos = parsePhotos(report.final_photos);
                                return (
                                    <div key={report.id} className="border rounded-lg overflow-hidden">
                                        <div className="bg-green-50 p-3 border-b">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-green-800 text-sm">Laporan Akhir #{idx + 1}</p>
                                                    <p className="text-xs text-green-600">Dari: {report.governor_name}</p>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(report.submitted_at)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            {report.work_details && (
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Detail Pekerjaan</p>
                                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{report.work_details}</p>
                                                </div>
                                            )}
                                            {report.cost && (
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Biaya</p>
                                                    <p className="font-semibold text-gray-800">Rp {report.cost.toLocaleString()}</p>
                                                    {report.cost_details && <p className="text-xs text-gray-500 mt-1">{report.cost_details}</p>}
                                                </div>
                                            )}
                                            {photos.length > 0 && (
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Dokumentasi</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                        {photos.map((photo, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition"
                                                                onClick={() => {
                                                                    setSelectedImage(photo);
                                                                    setShowImageModal(true);
                                                                }}
                                                            >
                                                                <img src={photo} alt={`Hasil ${idx + 1}`} className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Image Modal */}
            {showImageModal && selectedImage && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setShowImageModal(false)}>
                    <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition text-xl">
                        ✕
                    </button>
                    <img src={selectedImage} alt="Full size" className="max-w-[90vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
}