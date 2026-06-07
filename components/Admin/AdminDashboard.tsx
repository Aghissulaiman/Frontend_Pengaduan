// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Calendar,
  Eye,
  UserCheck,
  Building2,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardStats {
  total_warga: number;
  total_investigator: number;
  total_governor: number;
  total_complaints: number;
  need_attention: number;
  need_verification: number;
  completed: number;
  today_complaints: number;
  today_publications: number;
}

interface ChartData {
  monthly_complaints: Array<{ month: string; total: number }>;
  complaints_by_status: Array<{ name: string; value: number }>;
  complaints_by_category: Array<{ name: string; count: number }>;
}

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 Pindahkan fetchDashboardData ke SINI (sebelum useEffect)
 const fetchDashboardData = async () => {
  console.log('🚀 fetchDashboardData START');
  console.log('📌 Token:', token ? `${token.substring(0, 30)}...` : 'TIDAK ADA');
  console.log('📌 User role:', user?.role);
  console.log('📌 API URL:', process.env.NEXT_PUBLIC_API_URL);
  
  setIsLoading(true);
  
  try {
    // Fetch stats dari API
    const statsUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard/stats`;
    console.log('📡 Calling Stats API:', statsUrl);
    
    const statsRes = await fetch(statsUrl, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Stats Response Status:', statsRes.status, statsRes.statusText);
    
    const statsData = await statsRes.json();
    console.log('📦 Stats Response Data:', statsData);
    
    if (statsData.success && statsData.data) {
      console.log('✅ Stats data berhasil:', statsData.data);
      setStats(statsData.data);
    } else {
      console.error('❌ Stats API error:', statsData);
      setStats({
        total_warga: 0,
        total_investigator: 0,
        total_governor: 0,
        total_complaints: 0,
        need_attention: 0,
        need_verification: 0,
        completed: 0,
        today_complaints: 0,
        today_publications: 0,
      });
    }

    // Fetch chart data dari API
    const chartUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard/charts`;
    console.log('📡 Calling Chart API:', chartUrl);
    
    const chartRes = await fetch(chartUrl, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Chart Response Status:', chartRes.status, chartRes.statusText);
    
    const chartDataRes = await chartRes.json();
    console.log('📦 Chart Response Data:', chartDataRes);
    
    if (chartDataRes.success && chartDataRes.data) {
      console.log('✅ Chart data berhasil:', chartDataRes.data);
      setChartData(chartDataRes.data);
    } else {
      console.error('❌ Chart API error:', chartDataRes);
      setChartData({
        monthly_complaints: [],
        complaints_by_status: [],
        complaints_by_category: [],
      });
    }

  } catch (error: any) {
    console.error('❌ Error fetching dashboard data:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    setStats({
      total_warga: 0,
      total_investigator: 0,
      total_governor: 0,
      total_complaints: 0,
      need_attention: 0,
      need_verification: 0,
      completed: 0,
      today_complaints: 0,
      today_publications: 0,
    });
    setChartData({
      monthly_complaints: [],
      complaints_by_status: [],
      complaints_by_category: [],
    });
  } finally {
    console.log('🏁 fetchDashboardData END, setting isLoading false');
    setIsLoading(false);
  }
};

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [token, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const statCards = [
    {
      title: 'Total Warga',
      value: stats?.total_warga || 0,
      icon: Users,
      color: 'bg-blue-500',
      link: '/admin/users?role=user'
    },
    {
      title: 'Total Investigator',
      value: stats?.total_investigator || 0,
      icon: UserCheck,
      color: 'bg-green-500',
      link: '/admin/users?role=investigator'
    },
    {
      title: 'Total Gubernur',
      value: stats?.total_governor || 0,
      icon: Building2,
      color: 'bg-purple-500',
      link: '/admin/users?role=governor'
    },
    {
      title: 'Total Pengaduan',
      value: stats?.total_complaints || 0,
      icon: FileText,
      color: 'bg-indigo-500',
      link: '/admin/complaints'
    },
    {
      title: 'Perlu Perhatian',
      value: stats?.need_attention || 0,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      link: '/admin/complaints?status=pending'
    },
    {
      title: 'Perlu Verifikasi',
      value: stats?.need_verification || 0,
      icon: Clock,
      color: 'bg-orange-500',
      link: '/admin/verifications'
    },
    {
      title: 'Selesai',
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      link: '/admin/complaints?status=completed'
    },
    {
      title: 'Pengaduan Hari Ini',
      value: stats?.today_complaints || 0,
      icon: Calendar,
      color: 'bg-pink-500',
      link: '/admin/complaints?filter=today'
    },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard Admin</h1>
        <p className="text-gray-500 mt-1">Selamat datang, {user?.fullname || user?.username}</p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Link href={stat.link} key={index}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <div className={`w-11 h-11 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts Section */}
      {chartData && chartData.monthly_complaints && chartData.monthly_complaints.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tren Pengaduan per Bulan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.monthly_complaints}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Jumlah Pengaduan"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribusi Status Pengaduan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.complaints_by_status}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => {
                        const pct = percent || 0;
                        return `${name}: ${(pct * 100).toFixed(0)}%`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.complaints_by_status.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Pengaduan per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.complaints_by_category}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Jumlah Pengaduan" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Jika tidak ada data chart, tampilkan pesan */}
      {chartData && (!chartData.monthly_complaints || chartData.monthly_complaints.length === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Belum ada data chart</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/complaints">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                Lihat Semua Pengaduan
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Kelola Pengguna
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Laporan & Statistik
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Sistem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-gray-600">Total pengaduan perlu diverifikasi: <strong>{stats?.need_verification || 0}</strong></p>
            <p className="text-gray-600">Publikasi hari ini: <strong>{stats?.today_publications || 0}</strong></p>
            <p className="text-gray-600">Total pengguna terdaftar: <strong>{(stats?.total_warga || 0) + (stats?.total_investigator || 0) + (stats?.total_governor || 0)}</strong></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tips & Panduan</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
              <li>Verifikasi laporan proses dan laporan akhir dari gubernur</li>
              <li>Publikasikan pengaduan yang sudah selesai</li>
              <li>Pantau dashboard untuk pengaduan yang perlu perhatian</li>
              <li>Kelola user dan role dengan benar</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}