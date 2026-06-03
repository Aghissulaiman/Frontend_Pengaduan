'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, User, Save, LogOut } from 'lucide-react';

interface Province {
  id: number;
  name: string;
}

interface Regency {
  id: number;
  name: string;
  type: string;
}

interface District {
  id: number;
  name: string;
}

interface Village {
  id: number;
  name: string;
}

export default function CompleteProfile() {
  const router = useRouter();
  const { user, token, getProfile, isLoading: isAuthLoading, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isLoadingRegencies, setIsLoadingRegencies] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);
  
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  
  const [form, setForm] = useState({
    fullname: '',
    phone: '',
    province_id: '',
    regency_id: '',
    district_id: '',
    village_id: '',
    address_detail: '',
  });

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  // Ambil provinsi
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch('https://ihsaninh.github.io/wilayah-indonesia/provinces.json');
        const data = await res.json();
        setProvinces(data.map((item: { id: number; value: string }) => ({ id: item.id, name: item.value })));
      } catch (error) {
        console.error('Gagal ambil provinsi:', error);
        toast.error('Gagal memuat data provinsi');
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Ambil kabupaten
  useEffect(() => {
    if (!form.province_id) {
      setRegencies([]);
      setForm(prev => ({ ...prev, regency_id: '', district_id: '', village_id: '' }));
      return;
    }
    
    const fetchRegencies = async () => {
      setIsLoadingRegencies(true);
      try {
        const res = await fetch(`https://ihsaninh.github.io/wilayah-indonesia/${form.province_id}/regencies.json`);
        const data = await res.json();
        setRegencies(data.map((item: { id: number; value: string; type: string }) => ({ 
          id: item.id, 
          name: item.value, 
          type: item.type 
        })));
      } catch (error) {
        console.error('Gagal ambil kabupaten:', error);
        toast.error('Gagal memuat data kabupaten');
      } finally {
        setIsLoadingRegencies(false);
      }
    };
    fetchRegencies();
    setForm(prev => ({ ...prev, regency_id: '', district_id: '', village_id: '' }));
  }, [form.province_id]);

  // Ambil kecamatan
  useEffect(() => {
    if (!form.province_id || !form.regency_id) {
      setDistricts([]);
      setForm(prev => ({ ...prev, district_id: '', village_id: '' }));
      return;
    }
    
    const fetchDistricts = async () => {
      setIsLoadingDistricts(true);
      try {
        const res = await fetch(`https://ihsaninh.github.io/wilayah-indonesia/${form.province_id}/${form.regency_id}/district.json`);
        const data = await res.json();
        setDistricts(data.map((item: { id: number; value: string }) => ({ id: item.id, name: item.value })));
      } catch (error) {
        console.error('Gagal ambil kecamatan:', error);
        toast.error('Gagal memuat data kecamatan');
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    fetchDistricts();
    setForm(prev => ({ ...prev, district_id: '', village_id: '' }));
  }, [form.regency_id]);

  // Ambil desa
  useEffect(() => {
    if (!form.province_id || !form.regency_id || !form.district_id) {
      setVillages([]);
      setForm(prev => ({ ...prev, village_id: '' }));
      return;
    }
    
    const fetchVillages = async () => {
      setIsLoadingVillages(true);
      try {
        const res = await fetch(`https://ihsaninh.github.io/wilayah-indonesia/${form.province_id}/${form.regency_id}/${form.district_id}/subdistrict.json`);
        const data = await res.json();
        setVillages(data.map((item: { id: number; value: string }) => ({ id: item.id, name: item.value })));
      } catch (error) {
        console.error('Gagal ambil desa:', error);
        toast.error('Gagal memuat data desa');
      } finally {
        setIsLoadingVillages(false);
      }
    };
    fetchVillages();
    setForm(prev => ({ ...prev, village_id: '' }));
  }, [form.district_id]);

  // Update form dari user data
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullname: user.fullname || '',
        phone: user.phone || '',
        province_id: user.province_id ? user.province_id.toString() : '',
        regency_id: user.regency_id ? user.regency_id.toString() : '',
        district_id: user.district_id ? user.district_id.toString() : '',
        village_id: user.village_id ? user.village_id.toString() : '',
        address_detail: user.full_address || '',
      }));
    }
  }, [user]);

  // Cek auth redirect
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    
    if (!token) {
      router.replace('/auth/login');
    }
  }, [token, router, isAuthLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.fullname) {
      toast.error('Nama lengkap wajib diisi');
      return;
    }
    if (!form.province_id) {
      toast.error('Pilih provinsi');
      return;
    }
    if (!form.regency_id) {
      toast.error('Pilih kabupaten/kota');
      return;
    }
    if (!form.district_id) {
      toast.error('Pilih kecamatan');
      return;
    }
    if (!form.village_id) {
      toast.error('Pilih desa/kelurahan');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullname: form.fullname,
          phone: form.phone || '',
          province_api_id: parseInt(form.province_id),
          regency_api_id: parseInt(form.regency_id),
          district_api_id: parseInt(form.district_id),
          village_api_id: parseInt(form.village_id),
          address_detail: form.address_detail,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.message || `Gagal memperbarui data: HTTP ${response.status}`);
        return;
      }
      
      if (data.success) {
        await getProfile();
        toast.success('Data diri berhasil diperbarui');
        router.push('/home');
      } else {
        toast.error(data.message || 'Gagal memperbarui data diri');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Terjadi kesalahan pada服务器');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat sesi Anda...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Tombol Logout */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="text-center border-b border-gray-100 bg-white">
            <div className="mx-auto bg-blue-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-gray-800">Lengkapi Data Diri</CardTitle>
            <CardDescription className="text-gray-500">
              Isi data diri Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="text-gray-700 font-medium">Nama Lengkap *</Label>
                <Input
                  placeholder="Masukkan nama lengkap"
                  className="mt-1.5 h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  value={form.fullname}
                  onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-gray-700 font-medium">No. Telepon</Label>
                <Input
                  type="tel"
                  placeholder="081234567890"
                  className="mt-1.5 h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-gray-700 font-medium">Provinsi *</Label>
                <Select 
                  value={form.province_id} 
                  onValueChange={(v) => setForm({ ...form, province_id: v })}
                  disabled={isLoadingProvinces}
                >
                  <SelectTrigger className="mt-1.5 h-11 bg-white border-gray-300">
                    <SelectValue placeholder={isLoadingProvinces ? "Memuat provinsi..." : "Pilih provinsi"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {provinces.map((province) => (
                      <SelectItem key={province.id} value={province.id.toString()}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-700 font-medium">Kabupaten / Kota *</Label>
                <Select 
                  value={form.regency_id} 
                  onValueChange={(v) => setForm({ ...form, regency_id: v })}
                  disabled={!form.province_id || isLoadingRegencies}
                >
                  <SelectTrigger className="mt-1.5 h-11 bg-white border-gray-300">
                    <SelectValue placeholder={
                      !form.province_id ? "Pilih provinsi dulu" : 
                      isLoadingRegencies ? "Memuat kabupaten..." : 
                      "Pilih kabupaten/kota"
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {regencies.map((regency) => (
                      <SelectItem key={regency.id} value={regency.id.toString()}>
                        {regency.type === 'kota' ? '🏙️ ' : '🏘️ '}{regency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-700 font-medium">Kecamatan *</Label>
                <Select 
                  value={form.district_id} 
                  onValueChange={(v) => setForm({ ...form, district_id: v })}
                  disabled={!form.regency_id || isLoadingDistricts}
                >
                  <SelectTrigger className="mt-1.5 h-11 bg-white border-gray-300">
                    <SelectValue placeholder={
                      !form.regency_id ? "Pilih kabupaten dulu" : 
                      isLoadingDistricts ? "Memuat kecamatan..." : 
                      "Pilih kecamatan"
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={district.id.toString()}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-700 font-medium">Desa / Kelurahan *</Label>
                <Select 
                  value={form.village_id} 
                  onValueChange={(v) => setForm({ ...form, village_id: v })}
                  disabled={!form.district_id || isLoadingVillages}
                >
                  <SelectTrigger className="mt-1.5 h-11 bg-white border-gray-300">
                    <SelectValue placeholder={
                      !form.district_id ? "Pilih kecamatan dulu" : 
                      isLoadingVillages ? "Memuat desa..." : 
                      "Pilih desa/kelurahan"
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {villages.map((village) => (
                      <SelectItem key={village.id} value={village.id.toString()}>
                        {village.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-700 font-medium">Detail Alamat</Label>
                <textarea
                  placeholder="RT/RW, No Rumah, Patokan (contoh: RT 02 RW 03, No. 123)"
                  className="mt-1.5 w-full min-h-[80px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={form.address_detail}
                  onChange={(e) => setForm({ ...form, address_detail: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">Isi detail alamat seperti RT/RW, nomor rumah, atau patokan</p>
              </div>

              <Button type="submit" className="w-full h-11 mt-6 bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan & Lanjutkan
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}