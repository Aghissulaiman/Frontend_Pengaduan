'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
    province_name: string;
    category_name: string;
}

export default function ComplaintDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { token } = useAuth();
    const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // ✅ PINDAHKAN fetchDetail KE SINI (SEBELUM useEffect)
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
        } finally {
            setLoading(false);
        }
    };

    // ✅ SEKARANG fetchDetail SUDAH DIDEKLARASIKAN
    useEffect(() => {
        if (token && params.id) {
            fetchDetail();
        }
    }, [token, params.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 space-y-6">
                        <div className="border-b pb-4">
                            <h1 className="text-xl font-bold text-gray-800">Detail Pengaduan</h1>
                            <p className="text-sm text-gray-500">Kode: {complaint.tracking_code}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Pelapor</p>
                                    <p className="font-medium">{complaint.user_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Provinsi</p>
                                    <p className="font-medium">{complaint.province_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Kategori</p>
                                    <p className="font-medium">{complaint.category_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Tanggal</p>
                                    <p className="font-medium">
                                        {new Date(complaint.created_at).toLocaleDateString('id-ID')}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Lokasi</p>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg mt-1">
                                    {complaint.location_detail}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Deskripsi</p>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg mt-1 whitespace-pre-wrap">
                                    {complaint.description}
                                </p>
                            </div>

                            {complaint.photo && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Bukti Foto</p>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <img
                                            src={complaint.photo}
                                            alt="Bukti pengaduan"
                                            className="max-w-full max-h-96 object-contain mx-auto"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                                    {complaint.status_text || complaint.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}