'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users,
  UserCog,
  FileText,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
  Activity,
  BarChart3,
  Sun,
  Moon,
  Shield,
  CheckCircle,
  TrendingUp,
  Database,
  PlusCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { Badge } from '@/components/ui/badge';

interface AdminSidebarProps {
  children?: React.ReactNode;
}

export function AdminSidebar({ children }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  
  const [pendingVerifications] = useState(3);
  const [newComplaints] = useState(5);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const closeMobileMenu = () => setIsMobileOpen(false);

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, badge: null, description: 'Ringkasan sistem' },
    { href: '/admin/complaints', label: 'Semua Pengaduan', icon: FileText, badge: newComplaints > 0 ? String(newComplaints) : null, description: 'Kelola semua pengaduan' },
    { href: '/admin/verifications', label: 'Verifikasi Laporan', icon: CheckCircle, badge: pendingVerifications > 0 ? String(pendingVerifications) : null, description: 'Laporan perlu verifikasi', highlight: pendingVerifications > 0 },
    { href: '/admin/users', label: 'Kelola Pengguna', icon: Users, badge: null, description: 'Atur user & role' },
    { href: '/admin/categories', label: 'Kategori Pengaduan', icon: Database, badge: null, description: 'Kelola kategori' },
    { href: '/admin/publications', label: 'Publikasi', icon: PlusCircle, badge: null, description: 'Kelola publikasi' },
    { href: '/admin/reports', label: 'Laporan & Statistik', icon: BarChart3, badge: null, description: 'Analisis data' },
    { href: '/admin/activity', label: 'Log Aktivitas', icon: Activity, badge: null, description: 'Riwayat aktivitas' },
  ];

  const quickActions = [
    { label: 'Verifikasi Laporan', icon: CheckCircle, href: '/admin/verifications', color: 'green' },
    { label: 'Tambah Kategori', icon: PlusCircle, href: '/admin/categories/new', color: 'blue' },
    { label: 'Lihat Statistik', icon: TrendingUp, href: '/admin/reports', color: 'purple' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === href;
    return pathname.startsWith(href);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      closeMobileMenu();
      router.push(`/admin/complaints?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    router.push('/auth/login');
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        {/* Top Navbar */}
        <nav className={`fixed top-0 right-0 z-40 border-b shadow-sm transition-all duration-300 left-0 bg-background border-border ${
          collapsed ? 'md:left-20' : 'md:left-64'
        }`}>
          <div className="flex items-center justify-between px-4 md:px-6 py-3 h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
              
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Cari pengaduan, user, atau kategori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-80 lg:w-96 h-10 rounded-lg text-sm bg-muted/50"
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden lg:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">System: 98%</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">45 online</span>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 md:gap-3 px-2 py-1.5 h-auto rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                        {getInitials(user?.fullname || user?.username || 'Admin')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:flex lg:flex-col lg:items-start text-left">
                      <span className="text-sm font-semibold">{user?.fullname || user?.username || 'Administrator'}</span>
                      <span className="text-xs text-muted-foreground">
                        <Shield className="inline w-3 h-3 mr-1" />
                        Administrator
                      </span>
                    </div>
                    <ChevronDown className="hidden lg:block w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="p-4">
                    <span className="text-sm font-semibold block">{user?.fullname || user?.username || 'Admin'}</span>
                    <span className="text-xs text-muted-foreground block">{user?.email || 'admin@example.com'}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/profile" className="w-full flex items-center" onClick={closeMobileMenu}>
                      <UserCog className="mr-2 h-4 w-4" />
                      Profil Admin
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings" className="w-full flex items-center" onClick={closeMobileMenu}>
                      <Settings className="mr-2 h-4 w-4" />
                      Pengaturan Sistem
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)} className="md:hidden">
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </nav>

        {/* Mobile overlay */}
        {isMobileOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMobileMenu} />
        )}

        {/* Sidebar Navigation */}
        <aside className={`fixed top-0 left-0 h-full transition-all duration-300 z-50 flex flex-col shadow-xl bg-background border-r border-border ${
          collapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-4 border-b h-16 border-border">
            <Link href="/admin" className="flex items-center gap-2.5 mx-auto md:mx-0" onClick={closeMobileMenu}>
              {/* 🔥 Ganti pink/red dengan primary (biru) */}
              <div className="rounded-xl bg-primary p-2 text-primary-foreground shadow-lg">
                <Shield className="h-5 w-5" />
              </div>
              {!collapsed && (
                <span className="font-bold text-lg">
                  Admin<span className="text-primary">Panel</span>
                </span>
              )}
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-6 overflow-y-auto px-3 space-y-4">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Tooltip key={link.href} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        href={link.href}
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                          collapsed ? 'justify-center' : ''
                        } ${
                          active 
                            ? 'bg-primary text-primary-foreground shadow-md' 
                            : 'text-muted-foreground hover:bg-accent hover:text-primary'
                        } ${link.highlight && !active ? 'bg-yellow-500/10 border border-yellow-500/30' : ''}`}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="text-sm font-medium flex-1">{link.label}</span>
                            {link.badge && (
                              <Badge className={`${active ? 'bg-white/20' : 'bg-primary'} text-white text-[10px] px-1.5`}>
                                {link.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="flex flex-col">
                        <p className="font-medium">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{link.description}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>

            {/* System Info - Bottom */}
            {!collapsed && (
              <div className="pt-4 mt-auto border-t border-border">
                <div className="px-3 py-2">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>© 2024 Admin Panel</p>
                    <p>Versi 2.0.0</p>
                  </div>
                </div>
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <div className={`transition-all duration-300 min-h-screen pt-16 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <main className="p-4 md:p-6">{children}</main>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background border-t border-border shadow-lg">
          <div className="flex items-center justify-around px-4 py-2">
            {navLinks.slice(0, 4).map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px]">{link.label.split(' ')[0]}</span>
                  {link.badge && (
                    <Badge className="absolute -top-1 right-1/4 bg-primary text-white text-[8px] px-1 min-w-4 h-4">
                      {link.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}