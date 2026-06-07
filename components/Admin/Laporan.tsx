// components/Admin/Laporan.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  TrendingUp,
  FileText,
  Calendar,
  Download,
  Printer,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
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
  PieChart,
  Pie,
  Cell,
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

  const summaryCards = [
    { title: 'Total Pengaduan', value: stats?.total_complaints || 0, icon: FileText, color: 'bg-blue-500' },
    { title: 'Selesai', value: stats?.completed || 0, icon: CheckCircle, color: 'bg-green-500' },
    { title: 'Proses', value: (stats?.pending_governor || 0) + (stats?.investigation_assigned || 0) + (stats?.investigation_done || 0) + (stats?.governor_processing || 0), icon: Clock, color: 'bg-yellow-500' },
    { title: 'Ditolak', value: stats?.rejected || 0, icon: XCircle, color: 'bg-red-500' },
    { title: 'Minggu Ini', value: stats?.this_week || 0, icon: Calendar, color: 'bg-purple-500' },
    { title: 'Bulan Ini', value: stats?.this_month || 0, icon: TrendingUp, color: 'bg-indigo-500' },
    { title: 'Rata-rata Selesai', value: `${stats?.avg_completion_days || 0} hari`, icon: Clock, color: 'bg-teal-500' },
    { title: 'Provinsi Aktif', value: stats?.by_province?.length || 0, icon: MapPin, color: 'bg-orange-500' },
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
          <Button variant="outline" onClick={() => handleExport('excel')} disabled={exporting} className="gap-2">
            <Download className="w-4 h-4" />
            {exporting ? 'Mengekspor...' : 'Export Excel'}
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')} disabled={exporting} className="gap-2">
            <Printer className="w-4 h-4" />
            {exporting ? 'Mengekspor...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                </div>
                <div className={`w-11 h-11 ${card.color} rounded-xl flex items-center justify-center`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Kategori</TabsTrigger>
          <TabsTrigger value="regions">Regional</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Status Pengaduan</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart width={600} height={400}>
                <Pie
                  data={stats?.by_status || []}
                  cx={300}
                  cy={200}
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={120}
                  dataKey="value"
                >
                  {(stats?.by_status || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistik per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Kategori</th>
                    <th className="text-right py-2">Jumlah</th>
                    <th className="text-right py-2">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.by_category || []).map((cat, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2">{cat.name}</td>
                      <td className="text-right py-2">{cat.count}</td>
                      <td className="text-right py-2">
                        {((cat.count / (stats?.total_complaints || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistik per Provinsi</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Provinsi</th>
                    <th className="text-right py-2">Jumlah</th>
                    <th className="text-right py-2">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.by_province || []).map((prov, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2">{prov.name}</td>
                      <td className="text-right py-2">{prov.total}</td>
                      <td className="text-right py-2">
                        {((prov.total / (stats?.total_complaints || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}