'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  MapPin,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
  ClipboardList,
  Clock,
  FileText,
  CheckCircle,
  Bell,
  Sun,
  Moon,
  Eye,
  Send,
  MessageSquare,
  X,
  Activity,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface InvestigatorSidebarProps {
  children?: React.ReactNode;
}

export function InvestigatorSidebar({ children }: InvestigatorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  // Load dark mode preference
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Navigation links untuk Investigator
  const navLinks = [
    { href: '/investigator', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { href: '/investigator/tasks', label: 'Tugas Investigasi', icon: ClipboardList, badge: '3' },
    { href: '/investigator/history', label: 'Riwayat', icon: Clock, badge: null },
    { href: '/investigator/reports', label: 'Laporan', icon: BarChart3, badge: null },
  ];

  const getProvinceName = () => {
    const provinceMap: Record<number, string> = {
      11: 'Aceh', 12: 'Sumatera Utara', 13: 'Sumatera Barat', 14: 'Riau',
      15: 'Jambi', 16: 'Sumatera Selatan', 17: 'Bengkulu', 18: 'Lampung',
      19: 'Kepulauan Bangka Belitung', 21: 'Kepulauan Riau', 31: 'DKI Jakarta',
      32: 'Jawa Barat', 33: 'Jawa Tengah', 34: 'DI Yogyakarta', 35: 'Jawa Timur',
      36: 'Banten', 51: 'Bali', 52: 'Nusa Tenggara Barat', 53: 'Nusa Tenggara Timur',
      61: 'Kalimantan Barat', 62: 'Kalimantan Tengah', 63: 'Kalimantan Selatan',
      64: 'Kalimantan Timur', 65: 'Kalimantan Utara', 71: 'Sulawesi Utara',
      72: 'Sulawesi Tengah', 73: 'Sulawesi Selatan', 74: 'Sulawesi Tenggara',
      75: 'Gorontalo', 76: 'Sulawesi Barat', 81: 'Maluku', 82: 'Maluku Utara',
      91: 'Papua', 92: 'Papua Barat',
    };
    const provinceId = user?.province_api_id || user?.province_id;
    return provinceMap[provinceId as number] || 'Provinsi';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/investigator') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/investigator/tasks?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const notificationCount = 2;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Navbar */}
      <nav 
        className={`fixed top-0 right-0 left-0 z-40 border-b shadow-sm transition-all duration-300 ${
          collapsed ? 'md:left-20' : 'md:left-64'
        } ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
      >
        <div className="flex items-center justify-between px-6 py-3 h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className={darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
            
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                <Input
                  type="text"
                  placeholder="Cari tugas investigasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 w-96 h-10 rounded-lg text-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-400' : 'bg-gray-50 border-gray-200'
                  }`}
                />
              </div>
            </form>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className={darkMode ? 'text-yellow-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-100'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Province Badge */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <MapPin className={`h-3.5 w-3.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-xs font-medium ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>{getProvinceName()}</span>
            </div>

            {/* Notification */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`} />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96 p-0">
                <div className={`p-4 border-b ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                  <div className="flex justify-between items-center">
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifikasi</h3>
                    <button className="text-xs text-blue-500 hover:text-blue-600">
                      Tandai semua dibaca
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <DropdownMenuItem className={`flex flex-col items-start gap-1 p-4 cursor-pointer ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`}>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tugas baru</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Ada tugas investigasi baru yang ditugaskan kepada Anda</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>5 menit yang lalu</p>
                  </DropdownMenuItem>
                  <DropdownMenuItem className={`flex flex-col items-start gap-1 p-4 cursor-pointer ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`}>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Laporan perlu direvisi</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Laporan investigasi Anda perlu perbaikan</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>1 jam yang lalu</p>
                  </DropdownMenuItem>
                </div>
                <div className={`p-3 border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                  <button className="w-full text-center text-sm text-blue-500 hover:text-blue-600">
                    Lihat semua notifikasi
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`flex items-center gap-3 px-2 py-1.5 h-auto rounded-lg ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || ''} />
                    <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                      {getInitials(user?.fullname || user?.username || 'Inv')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex lg:flex-col lg:items-start text-left">
                    <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user?.fullname || user?.username}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Investigator
                    </span>
                  </div>
                  <ChevronDown className="hidden lg:block w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={`w-64 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : ''}`}>
                <DropdownMenuLabel className="p-4">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold">{user?.fullname || user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <Building2 className="w-3 h-3 text-blue-500" />
                      <p className="text-xs font-medium text-blue-500">{getProvinceName()}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/investigator/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil Saya</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/investigator/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Pengaturan</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/investigator/help" className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Pusat Bantuan</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full transition-all duration-300 z-50 flex flex-col shadow-xl
          ${darkMode ? 'bg-slate-950 border-r border-slate-800' : 'bg-white border-r border-gray-200'}
          ${collapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo Area */}
        <div className={`flex items-center justify-between px-5 py-4 border-b h-16 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
          {!collapsed ? (
            <Link href="/investigator" className="flex items-center gap-2.5">
              <div className="rounded-xl bg-blue-500 p-2 shadow-lg shadow-blue-500/25">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className={`font-bold text-lg tracking-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Lapor<span className="text-blue-500">Gubernur</span>
                </span>
                <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>Investigator Panel</p>
              </div>
            </Link>
          ) : (
            <Link href="/investigator" className="mx-auto">
              <div className="rounded-xl bg-blue-500 p-2.5 shadow-lg shadow-blue-500/25">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
            </Link>
          )}
        </div>

        {/* User Info Mini (collapsed mode) */}
        {collapsed && (
          <div className={`px-3 py-4 border-b ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="w-12 h-12 mx-auto ring-2 ring-blue-500/50">
                    <AvatarFallback className="bg-blue-500 text-white font-bold">
                      {getInitials(user?.fullname || user?.username || 'I')}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{user?.fullname || user?.username}</p>
                  <p className="text-xs">{getProvinceName()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <div className={`space-y-1 ${collapsed ? 'px-3' : 'px-4'}`}>
            {!collapsed && (
              <p className={`px-3 text-[10px] font-semibold uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                Menu Utama
              </p>
            )}
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                    ${collapsed ? 'justify-center' : ''}
                    ${active 
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                      : darkMode 
                        ? 'text-slate-300 hover:bg-white/10 hover:text-white' 
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1">{link.label}</span>
                      {link.badge && (
                        <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5">
                          {link.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Stats Summary (collapsed mode) */}
          {collapsed && (
            <div className="mt-6 px-3 space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white/10 rounded-lg p-2 text-center cursor-pointer">
                      <Clock className="w-5 h-5 text-yellow-400 mx-auto" />
                      <p className="text-xs font-bold mt-1 text-white">0</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">Tugas Menunggu</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white/10 rounded-lg p-2 text-center cursor-pointer">
                      <ClipboardList className="w-5 h-5 text-blue-400 mx-auto" />
                      <p className="text-xs font-bold mt-1 text-white">0</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sedang Diproses</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white/10 rounded-lg p-2 text-center cursor-pointer">
                      <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                      <p className="text-xs font-bold mt-1 text-white">0</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">Selesai</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Stats Card (expanded mode) */}
          {!collapsed && (
            <div className="mt-8 px-4">
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-white/5' : 'bg-blue-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                  <p className={`text-xs font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>Statistik Tugas</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Menunggu</span>
                    <span className="text-sm font-bold text-yellow-500">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Diproses</span>
                    <span className="text-sm font-bold text-blue-500">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Selesai</span>
                    <span className="text-sm font-bold text-green-500">0</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className={`p-4 border-t ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>Version 2.0.0</p>
                <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-gray-300'}`}>© 2024 LaporGubernur</p>
              </div>
              <Eye className={`w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-gray-300'}`} />
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div 
        className={`transition-all duration-300 min-h-screen pt-16 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}
      >
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}