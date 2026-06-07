// app/admin/activity/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Activity as ActivityIcon,
  Filter,
  Calendar,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ActivityLog {
  id: number;
  user_id: number;
  user_name: string;
  user_fullname: string;
  user_role: string;
  action: string;
  action_label: string;
  complaint_id: number | null;
  tracking_code: string | null;
  old_status: string | null;
  new_status: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface ActivityStats {
  total: number;
  today: number;
  this_week: number;
  this_month: number;
  by_action: Array<{ action: string; count: number }>;
  by_user: Array<{ name: string; count: number }>;
}

export default function AdminActivityPage() {
  const { token } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const limit = 20;

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/admin/activities?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (actionFilter !== 'all') url += `&action=${actionFilter}`;
      if (userFilter !== 'all') url += `&user_id=${userFilter}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setActivities(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / limit));
      } else {
        toast.error(data.message || 'Gagal memuat log aktivitas');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Gagal memuat log aktivitas');
    } finally {
      setIsLoading(false);
    }
  }, [token, page, search, actionFilter, userFilter, limit]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/activities/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchActivities();
      fetchStats();
    }
  }, [token, page, search, actionFilter, userFilter, fetchActivities, fetchStats]);

  const getActionBadge = (action: string) => {
    const actionMap: Record<string, { label: string; color: string; icon: JSX.Element }> = {
      'login': { label: 'Login', color: 'bg-green-100 text-green-700', icon: <LogIn className="w-3 h-3" /> },
      'logout': { label: 'Logout', color: 'bg-gray-100 text-gray-700', icon: <LogOut className="w-3 h-3" /> },
      'create_complaint': { label: 'Buat Pengaduan', color: 'bg-blue-100 text-blue-700', icon: <FileText className="w-3 h-3" /> },
      'update_status': { label: 'Update Status', color: 'bg-yellow-100 text-yellow-700', icon: <Edit className="w-3 h-3" /> },
      'assign_investigator': { label: 'Assign Investigator', color: 'bg-purple-100 text-purple-700', icon: <UserPlus className="w-3 h-3" /> },
      'submit_investigation': { label: 'Hasil Investigasi', color: 'bg-indigo-100 text-indigo-700', icon: <CheckCircle className="w-3 h-3" /> },
      'submit_process_report': { label: 'Laporan Proses', color: 'bg-orange-100 text-orange-700', icon: <FileText className="w-3 h-3" /> },
      'submit_completion_report': { label: 'Laporan Akhir', color: 'bg-pink-100 text-pink-700', icon: <CheckCircle className="w-3 h-3" /> },
      'verify_process_report': { label: 'Verifikasi Laporan Proses', color: 'bg-teal-100 text-teal-700', icon: <CheckCircle className="w-3 h-3" /> },
      'verify_completion_report': { label: 'Verifikasi Laporan Akhir', color: 'bg-teal-100 text-teal-700', icon: <CheckCircle className="w-3 h-3" /> },
      'delete': { label: 'Hapus', color: 'bg-red-100 text-red-700', icon: <Trash2 className="w-3 h-3" /> },
      'update_user': { label: 'Update User', color: 'bg-cyan-100 text-cyan-700', icon: <User className="w-3 h-3" /> },
      'toggle_active': { label: 'Aktif/Nonaktif', color: 'bg-amber-100 text-amber-700', icon: <Shield className="w-3 h-3" /> },
    };
    return actionMap[action] || { label: action, color: 'bg-gray-100 text-gray-700', icon: <ActivityIcon className="w-3 h-3" /> };
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; color: string }> = {
      admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
      governor: { label: 'Gubernur', color: 'bg-purple-100 text-purple-700' },
      investigator: { label: 'Investigator', color: 'bg-blue-100 text-blue-700' },
      user: { label: 'Warga', color: 'bg-green-100 text-green-700' },
    };
    return roleMap[role] || { label: role, color: 'bg-gray-100 text-gray-700' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Summary cards
  const summaryCards = [
    {
      title: 'Total Aktivitas',
      value: stats?.total || 0,
      icon: ActivityIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Hari Ini',
      value: stats?.today || 0,
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      title: 'Minggu Ini',
      value: stats?.this_week || 0,
      icon: Calendar,
      color: 'bg-yellow-500',
    },
    {
      title: 'Bulan Ini',
      value: stats?.this_month || 0,
      icon: Calendar,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Log Aktivitas</h1>
        <p className="text-gray-500 mt-1">Riwayat semua aktivitas di sistem</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                </div>
                <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari berdasarkan user, aksi, atau kode tracking..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter Aksi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Aksi</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
            <SelectItem value="create_complaint">Buat Pengaduan</SelectItem>
            <SelectItem value="update_status">Update Status</SelectItem>
            <SelectItem value="assign_investigator">Assign Investigator</SelectItem>
            <SelectItem value="submit_investigation">Hasil Investigasi</SelectItem>
            <SelectItem value="submit_process_report">Laporan Proses</SelectItem>
            <SelectItem value="submit_completion_report">Laporan Akhir</SelectItem>
            <SelectItem value="verify_process_report">Verifikasi Proses</SelectItem>
            <SelectItem value="verify_completion_report">Verifikasi Akhir</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { fetchActivities(); fetchStats(); }} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Activities Table */}
      <Card>
        <CardContent className="p-0">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <ActivityIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Tidak ada log aktivitas</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Pengguna</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Aksi</TableHead>
                      <TableHead>Detail</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => {
                      const action = getActionBadge(activity.action);
                      const role = getRoleBadge(activity.user_role);
                      return (
                        <TableRow key={activity.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {formatDate(activity.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-800">{activity.user_fullname || activity.user_name}</p>
                              <p className="text-xs text-gray-500">@{activity.user_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={role.color}>
                              {role.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`flex items-center gap-1 w-fit ${action.color}`}>
                              {action.icon}
                              {action.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {activity.tracking_code && (
                              <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                                {activity.tracking_code}
                              </span>
                            )}
                            {activity.old_status && activity.new_status && (
                              <div className="text-xs">
                                <span className="text-gray-500">{activity.old_status}</span>
                                <span className="mx-1">→</span>
                                <span className="text-green-600">{activity.new_status}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {activity.ip_address || '-'}
                            </code>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedActivity(activity);
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
              </div>

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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Log Aktivitas</DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Waktu</p>
                  <p className="font-medium">{formatDateTime(selectedActivity.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pengguna</p>
                  <p className="font-medium">{selectedActivity.user_fullname || selectedActivity.user_name}</p>
                  <p className="text-xs text-gray-500">@{selectedActivity.user_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <Badge className={getRoleBadge(selectedActivity.user_role).color}>
                    {getRoleBadge(selectedActivity.user_role).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Aksi</p>
                  <Badge className={getActionBadge(selectedActivity.action).color}>
                    {getActionBadge(selectedActivity.action).label}
                  </Badge>
                </div>
                {selectedActivity.tracking_code && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Kode Tracking</p>
                    <p className="font-mono">{selectedActivity.tracking_code}</p>
                  </div>
                )}
                {selectedActivity.old_status && selectedActivity.new_status && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Perubahan Status</p>
                    <p>
                      <span className="text-gray-500">{selectedActivity.old_status}</span>
                      <span className="mx-2">→</span>
                      <span className="text-green-600 font-medium">{selectedActivity.new_status}</span>
                    </p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">IP Address</p>
                  <code className="text-sm bg-gray-100 p-1 rounded">{selectedActivity.ip_address || '-'}</code>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">User Agent</p>
                  <p className="text-xs text-gray-600 break-all">{selectedActivity.user_agent || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}