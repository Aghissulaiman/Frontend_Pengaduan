// app/admin/reports/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  Download,
  Printer,
  Eye,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { toast } from 'sonner';
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
  Cell,
  AreaChart,
  Area,
} from 'recharts';

interface ReportStats {
  total_complaints: number;
  pending_governor: number;
  investigation_assigned: number;
  investigation_done: number;
  governor_processing: number;
  completed: number;
  rejected: number;
  this_month: number;
  this_week: number;
  avg_completion_days: number;
  by_category: Array<{ name: string; count: number }>;
  by_status: Array<{ name: string; value: number }>;
  by_month: Array<{ month: string; total: number }>;
  by_province: Array<{ name: string; total: number }>;
  by_priority?: Array<{ name: string; count: number }>;
}

interface DateRange {
  start: string;
  end: string;
}

export default function AdminReportsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [exporting, setExporting] = useState(false);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const fetchReportStats = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/admin/reports/stats?period=${period}`;
      if (period === 'custom' && startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        toast.error(data.message || 'Gagal memuat statistik');
        // Set default empty data
        setStats({
          total_complaints: 0,
          pending_governor: 0,
          investigation_assigned: 0,
          investigation_done: 0,
          governor_processing: 0,
          completed: 0,
          rejected: 0,
          this_month: 0,
          this_week: 0,
          avg_completion_days: 0,
          by_category: [],
          by_status: [],
          by_month: [],
          by_province: [],
        });
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Gagal memuat data laporan');
    } finally {
      setIsLoading(false);
    }
  }, [token, period, startDate, endDate]);

  useEffect(() => {
    if (token) {
      fetchReportStats();
    }
  }, [token, period, startDate, endDate, fetchReportStats]);

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/reports/export?format=${format}&period=${period}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `laporan_pengaduan_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        toast.success(`Laporan berhasil diunduh sebagai ${format.toUpperCase()}`);
      } else {
        toast.error('Gagal mengekspor laporan');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Terjadi kesalahan saat mengekspor');
    } finally {
      setExporting(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('id-ID');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Summary cards
  const summaryCards = [
    {
      title: 'Total Pengaduan',
      value: stats?.total_complaints || 0,
      icon: FileText,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Selesai',
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+5%',
    },
    {
      title: 'Proses',
      value: (stats?.pending_governor || 0) + (stats?.investigation_assigned || 0) + (stats?.investigation_done || 0) + (stats?.governor_processing || 0),
      icon: Clock,
      color: 'bg-yellow-500',
      change: '-3%',
    },
    {
      title: 'Ditolak',
      value: stats?.rejected || 0,
      icon: XCircle,
      color: 'bg-red-500',
      change: '+2%',
    },
    {
      title: 'Minggu Ini',
      value: stats?.this_week || 0,
      icon: Calendar,
      color: 'bg-purple-500',
      change: '+8%',
    },
    {
      title: 'Bulan Ini',
      value: stats?.this_month || 0,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      change: '+15%',
    },
    {
      title: 'Rata-rata Selesai',
      value: `${stats?.avg_completion_days || 0} hari`,
      icon: Clock,
      color: 'bg-teal-500',
    },
    {
      title: 'Provinsi Aktif',
      value: stats?.by_province?.length || 0,
      icon: MapPin,
      color: 'bg-orange-500',
    },
  ];

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Laporan & Statistik</h1>
          <p className="text-gray-500 mt-1">Analisis data pengaduan secara lengkap</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Mengekspor...' : 'Export Excel'}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            {exporting ? 'Mengekspor...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Filter Period */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={period === 'week' ? 'default' : 'outline'}
                onClick={() => setPeriod('week')}
                size="sm"
              >
                Minggu Ini
              </Button>
              <Button
                variant={period === 'month' ? 'default' : 'outline'}
                onClick={() => setPeriod('month')}
                size="sm"
              >
                Bulan Ini
              </Button>
              <Button
                variant={period === 'year' ? 'default' : 'outline'}
                onClick={() => setPeriod('year')}
                size="sm"
              >
                Tahun Ini
              </Button>
              <Button
                variant={period === 'all' ? 'default' : 'outline'}
                onClick={() => setPeriod('all')}
                size="sm"
              >
                Semua
              </Button>
              <Button
                variant={period === 'custom' ? 'default' : 'outline'}
                onClick={() => setPeriod('custom')}
                size="sm"
              >
                Custom
              </Button>
            </div>
            {period === 'custom' && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                />
                <span className="text-gray-400">sd</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                />
                <Button size="sm" onClick={fetchReportStats}>
                  Terapkan
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                  {card.change && (
                    <p className="text-xs text-green-600 mt-1">{card.change}</p>
                  )}
                </div>
                <div className={`w-11 h-11 ${card.color} rounded-xl flex items-center justify-center`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <LineChartIcon className="w-4 h-4" />
            Tren
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <PieChartIcon className="w-4 h-4" />
            Kategori
          </TabsTrigger>
          <TabsTrigger value="regions" className="gap-2">
            <MapPin className="w-4 h-4" />
            Regional
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Pie Chart - Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Distribusi Status Pengaduan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.by_status || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(stats?.by_status || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart - Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top 5 Kategori Pengaduan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(stats?.by_category || []).slice(0, 5)}
                    layout="vertical"
                    margin={{ left: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="Jumlah" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LineChartIcon className="w-5 h-5" />
                Tren Pengaduan per Bulan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.by_month || []}>
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
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Area Chart - Cumulative */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Akumulasi Pengaduan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.by_month || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Total"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Statistik per Kategori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Kategori</th>
                      <th className="text-right py-3 px-4 font-semibold">Jumlah</th>
                      <th className="text-right py-3 px-4 font-semibold">Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.by_category || []).map((cat, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            {cat.name}
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">{cat.count}</td>
                        <td className="text-right py-3 px-4">
                          {((cat.count / (stats?.total_complaints || 1)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="py-3 px-4">Total</td>
                      <td className="text-right py-3 px-4">{stats?.total_complaints}</td>
                      <td className="text-right py-3 px-4">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regions Tab */}
        <TabsContent value="regions" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Statistik per Provinsi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Provinsi</th>
                      <th className="text-right py-3 px-4 font-semibold">Jumlah</th>
                      <th className="text-right py-3 px-4 font-semibold">Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.by_province || []).map((prov, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{prov.name}</td>
                        <td className="text-right py-3 px-4">{prov.total}</td>
                        <td className="text-right py-3 px-4">
                          {((prov.total / (stats?.total_complaints || 1)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="py-3 px-4">Total</td>
                      <td className="text-right py-3 px-4">{stats?.total_complaints}</td>
                      <td className="text-right py-3 px-4">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Footer */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-blue-700">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm">
              Data diperbarui secara real-time. Ekspor laporan dalam format Excel atau PDF untuk analisis lebih lanjut.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}