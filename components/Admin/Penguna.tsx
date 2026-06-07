// app/admin/users/page.tsx
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Search,
  UserPlus,
  UserCog,
  Shield,
  UserX,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Calendar,
  RefreshCw,
  Eye,
  Edit,
  Building2,
  Users,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  fullname: string;
  email: string;
  role: string;
  province_api_id: number | null;
  province_name?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface Province {
  api_id: number;
  name: string;
  total_users?: number;
}

interface RoleOption {
  value: string;
  label: string;
  icon: JSX.Element;
  color: string;
}

export default function AdminUsersPage() {
  const { token } = useAuth();
  
  // Step selection
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Pagination & filters
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    role: '',
    province_api_id: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const limit = 10;

  // Role options
  const roleOptions: RoleOption[] = [
    { value: 'user', label: 'Warga', icon: <Users className="w-4 h-4" />, color: 'bg-green-100 text-green-700' },
    { value: 'investigator', label: 'Investigator', icon: <Shield className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
    { value: 'governor', label: 'Gubernur', icon: <Building2 className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700' },
    { value: 'admin', label: 'Admin', icon: <UserCog className="w-4 h-4" />, color: 'bg-red-100 text-red-700' },
  ];

  // Fetch provinces with user counts based on selected role
  const fetchProvinces = useCallback(async () => {
    if (!token || !selectedRole) return;
    
    setIsLoadingProvinces(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/admin/provinces-with-users?role=${selectedRole}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setProvinces(data.data || []);
      } else {
        // Fallback: ambil semua provinsi
        const provincesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/provinces`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const provincesData = await provincesRes.json();
        if (provincesData.success) {
          setProvinces(provincesData.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
    } finally {
      setIsLoadingProvinces(false);
    }
  }, [token, selectedRole]);

  // Fetch users when province is selected
  const fetchUsers = useCallback(async () => {
    if (!token || !selectedRole || !selectedProvince) return;
    
    setIsLoadingUsers(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/admin/users?role=${selectedRole}&province_api_id=${selectedProvince.api_id}&page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setUsers(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / limit));
      } else {
        toast.error(data.message || 'Gagal memuat data pengguna');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat data pengguna');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [token, selectedRole, selectedProvince, page, search, limit]);

  // Reset province when role changes
  useEffect(() => {
    setSelectedProvince(null);
    setUsers([]);
    setPage(1);
    if (selectedRole) {
      fetchProvinces();
    }
  }, [selectedRole, fetchProvinces]);

  // Fetch users when province or pagination changes
  useEffect(() => {
    if (selectedRole && selectedProvince) {
      fetchUsers();
    }
  }, [selectedRole, selectedProvince, page, search, fetchUsers]);

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: editForm.role,
          province_api_id: editForm.province_api_id ? parseInt(editForm.province_api_id) : null
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Berhasil mengupdate pengguna');
        setShowEditDialog(false);
        fetchUsers();
        fetchProvinces();
      } else {
        toast.error(data.message || 'Gagal mengupdate');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${user.id}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !user.is_active })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`Pengguna ${!user.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
        fetchUsers();
        fetchProvinces();
      } else {
        toast.error(data.message || 'Gagal mengubah status');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; color: string; icon: JSX.Element }> = {
      admin: { label: 'Admin', color: 'bg-red-100 text-red-700', icon: <Shield className="w-3 h-3" /> },
      governor: { label: 'Gubernur', color: 'bg-purple-100 text-purple-700', icon: <Building2 className="w-3 h-3" /> },
      investigator: { label: 'Investigator', color: 'bg-blue-100 text-blue-700', icon: <Shield className="w-3 h-3" /> },
      user: { label: 'Warga', color: 'bg-green-100 text-green-700', icon: <Users className="w-3 h-3" /> },
    };
    return roleMap[role] || { label: role, color: 'bg-gray-100 text-gray-700', icon: <UserCog className="w-3 h-3" /> };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Render step 1: Pilih Role
  if (!selectedRole) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Kelola Pengguna</h1>
          <p className="text-gray-500 mt-1">Pilih role untuk melihat daftar pengguna</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roleOptions.map((role) => (
            <Card
              key={role.value}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-500 group"
              onClick={() => setSelectedRole(role.value)}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${role.color} flex items-center justify-center group-hover:scale-110 transition`}>
                  {role.icon}
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">{role.label}</h3>
                <p className="text-sm text-gray-500 mt-1">Kelola semua {role.label.toLowerCase()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Render step 2: Pilih Provinsi
  if (!selectedProvince) {
    const selectedRoleData = roleOptions.find(r => r.value === selectedRole);
    
    return (
      <div className="space-y-6">
        {/* Back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedRole('');
              setProvinces([]);
            }}
            className="gap-2"
          >
            ← Kembali ke Pilihan Role
          </Button>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${selectedRoleData?.color}`}>
              {selectedRoleData?.icon}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Kelola {selectedRoleData?.label}
            </h1>
          </div>
          <p className="text-gray-500 mt-1">Pilih provinsi untuk melihat daftar {selectedRoleData?.label?.toLowerCase()}</p>
        </div>

        {isLoadingProvinces ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : provinces.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Tidak ada provinsi dengan {selectedRoleData?.label?.toLowerCase()}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSelectedRole('')}
              >
                Kembali
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {provinces.map((province) => (
              <Card
                key={province.api_id}
                className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-500 group"
                onClick={() => setSelectedProvince(province)}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition">
                    <Building2 className="w-8 h-8 text-blue-600 group-hover:text-white transition" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{province.name}</h3>
                  <p className="text-sm text-gray-500">
                    {province.total_users || 0} {selectedRoleData?.label?.toLowerCase()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render step 3: Daftar Pengguna
  const selectedRoleData = roleOptions.find(r => r.value === selectedRole);
  
  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedProvince(null);
            setUsers([]);
            setPage(1);
          }}
          className="gap-1"
        >
          ← Kembali ke Provinsi
        </Button>
        <span className="text-gray-400">/</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedRole('');
            setSelectedProvince(null);
            setProvinces([]);
            setUsers([]);
          }}
          className="gap-1"
        >
          ← Ganti Role
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${selectedRoleData?.color}`}>
              {selectedRoleData?.icon}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {selectedRoleData?.label} di {selectedProvince.name}
            </h1>
          </div>
          <p className="text-gray-500 mt-1">Total {total} {selectedRoleData?.label?.toLowerCase()} terdaftar</p>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4" />
          Tambah {selectedRoleData?.label}
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari berdasarkan nama atau email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => fetchUsers()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoadingUsers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Tidak ada {selectedRoleData?.label?.toLowerCase()} di provinsi ini</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pengguna</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Terdaftar</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const role = getRoleBadge(user.role);
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-800">{user.fullname || user.username}</p>
                              <p className="text-xs text-gray-500">@{user.username}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`flex items-center gap-1 w-fit ${role.color}`}>
                              {role.icon}
                              {role.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.is_active ? (
                              <Badge className="bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                                <CheckCircle className="w-3 h-3" />
                                Aktif
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" />
                                Nonaktif
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{formatDate(user.created_at)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDetailDialog(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setEditForm({
                                    role: user.role,
                                    province_api_id: user.province_api_id?.toString() || '',
                                  });
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(user)}
                                className={user.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}
                              >
                                {user.is_active ? <UserX className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </Button>
                            </div>
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

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Ubah role dan provinsi untuk {selectedUser?.fullname || selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Warga</SelectItem>
                  <SelectItem value="investigator">Investigator</SelectItem>
                  <SelectItem value="governor">Gubernur</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Provinsi</Label>
              <Select 
                value={editForm.province_api_id} 
                onValueChange={(v) => setEditForm({ ...editForm, province_api_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Provinsi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak ada</SelectItem>
                  {provinces.map((prov) => (
                    <SelectItem key={prov.api_id} value={prov.api_id.toString()}>
                      {prov.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateUser} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Pengguna</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {(selectedUser.fullname || selectedUser.username)?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.fullname || selectedUser.username}</h3>
                  <p className="text-gray-500">@{selectedUser.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <Badge className={getRoleBadge(selectedUser.role).color}>
                    {getRoleBadge(selectedUser.role).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Provinsi</p>
                  <p>{selectedUser.province_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  {selectedUser.is_active ? (
                    <Badge className="bg-green-100 text-green-700">Aktif</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">Nonaktif</Badge>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Tanggal Bergabung</p>
                  <p>{formatDate(selectedUser.created_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}