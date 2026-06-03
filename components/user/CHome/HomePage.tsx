'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Shield,
  Bell,
  ChevronRight,
  MapPin,
  Calendar,
  Eye,
  PlusCircle,
  Search,
  History
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

interface Complaint {
  id: number;
  tracking_code: string;
  description: string;
  location_detail: string;
  status: string;
  created_at: string;
  photo?: string;
}

export default function Home() {
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processed: 0,
    completed: 0,
  });

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/auth/login');
    }
  }, [authLoading, token, router]);

  useEffect(() => {
    if (token) {
      fetchMyComplaints();
    }
  }, [token]);

  const fetchMyComplaints = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/my`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setComplaints(data.data);
        
        const total = data.data.length;
        const pending = data.data.filter((c: Complaint) => 
          c.status === 'pending_governor' || c.status === 'governor_processing'
        ).length;
        const processed = data.data.filter((c: Complaint) => 
          c.status === 'investigation_assigned' || c.status === 'investigation_done'
        ).length;
        const completed = data.data.filter((c: Complaint) => 
          c.status === 'completed'
        ).length;
        
        setStats({ total, pending, processed, completed });
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
      pending_governor: { 
        label: 'Menunggu Gubernur', 
        icon: <Clock className="w-3 h-3" />, 
        color: 'text-yellow-600',
        bg: 'bg-yellow-50'
      },
      investigation_assigned: { 
        label: 'Investigasi', 
        icon: <AlertCircle className="w-3 h-3" />, 
        color: 'text-blue-600',
        bg: 'bg-blue-50'
      },
      investigation_done: { 
        label: 'Investigasi Selesai', 
        icon: <CheckCircle className="w-3 h-3" />, 
        color: 'text-purple-600',
        bg: 'bg-purple-50'
      },
      governor_processing: { 
        label: 'Diproses', 
        icon: <Clock className="w-3 h-3" />, 
        color: 'text-orange-600',
        bg: 'bg-orange-50'
      },
      completed: { 
        label: 'Selesai', 
        icon: <CheckCircle className="w-3 h-3" />, 
        color: 'text-green-600',
        bg: 'bg-green-50'
      },
      rejected: { 
        label: 'Ditolak', 
        icon: <AlertCircle className="w-3 h-3" />, 
        color: 'text-red-600',
        bg: 'bg-red-50'
      },
    };
    return configs[status] || { 
      label: status, 
      icon: <Clock className="w-3 h-3" />, 
      color: 'text-gray-600',
      bg: 'bg-gray-50'
    };
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diff < 60) return `${diff} detik lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (authLoading) {
    return (
      
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full animate-pulse"></div>
            <div className="w-8 h-8 border-4 border-blue-600 rounded-full animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          </div>
          <p className="text-gray-500 mt-4">Memuat dashboard...</p>
        </div>
      
    );
  }

  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  return (

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border border-gray-100 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Total Laporan</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Menunggu</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Diproses</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{stats.processed}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Selesai</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/user/complaints/new">
              <Card className="border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-blue-600">Buat Laporan</h3>
                      <p className="text-xs text-gray-500 mt-1">Laporkan keluhan atau aspirasi</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/user/track">
              <Card className="border border-gray-100 hover:shadow-md hover:border-green-200 transition-all cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Search className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-green-600">Lacak Laporan</h3>
                      <p className="text-xs text-gray-500 mt-1">Pantau status Laporan</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/user/complaints">
              <Card className="border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <History className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-purple-600">Riwayat</h3>
                      <p className="text-xs text-gray-500 mt-1">Lihat semua Laporan</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Complaints */}
          <Card className="border border-gray-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800">
                Laporan Anda
              </CardTitle>
              {safeComplaints.length > 0 && (
                <Link href="/user/complaints">
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    Lihat semua
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-100 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : safeComplaints.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Belum ada Laporan</p>
                  <p className="text-sm text-gray-400 mt-1">Silakan buat Laporan pertama Anda</p>
                  <Link href="/user/complaints/new">
                    <Button variant="link" className="mt-2 text-blue-600">
                      Buat Laporan sekarang
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {safeComplaints.slice(0, 3).map((complaint) => {
                    const status = getStatusConfig(complaint.status);
                    return (
                      <Link key={complaint.id} href={`/complaints/${complaint.id}`}>
                        <div className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge className={`${status.bg} ${status.color} border-0 text-xs`}>
                                  <span className="flex items-center gap-1">
                                    {status.icon}
                                    {status.label}
                                  </span>
                                </Badge>
                                <span className="text-xs text-gray-400 font-mono">
                                  #{complaint.tracking_code}
                                </span>
                              </div>
                              <p className="text-sm text-gray-800 line-clamp-2">
                                {complaint.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {complaint.location_detail}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(complaint.created_at)}
                                </span>
                              </div>
                            </div>
                            <Eye className="w-4 h-4 text-gray-300 shrink-0 hidden sm:block" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-gray-400">
              <Shield className="w-3 h-3" />
              <span>Data Anda aman dan terenkripsi</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>Respons cepat dalam 24 jam</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>Layanan gratis untuk masyarakat</span>
            </div>
          </div>
        </div>
      </div>
    
  );
}