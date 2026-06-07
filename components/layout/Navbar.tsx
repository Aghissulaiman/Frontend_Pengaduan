'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin,
  User,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  MessageSquare,
  Home,
  FileText,
  Clock,
  Rss,
  Bell
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

interface UserSidebarProps {
  children?: React.ReactNode;
}

export function UserSidebar({ children }: UserSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

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

  // MENU NAVIGASI UNTUK WARGA
  const navLinks = [
    { href: '/home', label: 'Beranda', icon: Home, badge: null },
    { href: '/home/complaints', label: 'Lapor', icon: FileText, badge: null },
    { href: '/home/feed', label: 'Feed Publik', icon: Rss, badge: 'New' },
    { href: '/home/chat', label: 'Pesan', icon: MessageSquare, badge: null },
    { href: '/home/history', label: 'Riwayat', icon: Clock, badge: null },
  ];

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/home') return pathname === href;
    return pathname.startsWith(href);
  };

  // Profile URL dengan username dari user yang login
  const profileUrl = user?.username ? `/home/profile/${user.username}` : '/profile';

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* TOP NAVBAR */}
      <nav 
        className={`fixed top-0 right-0 z-40 border-b shadow-sm transition-all duration-300 left-0 ${
          collapsed ? 'md:left-20' : 'md:left-64'
        } ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
      >
        <div className="flex items-center justify-between px-6 py-3 h-16">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className={darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>

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

            {/* Notification Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`} />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={`w-96 p-0 ${darkMode ? 'bg-slate-900 border-slate-700' : ''}`}>
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
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pengaduan diproses</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Pengaduan Anda sedang diproses oleh tim</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>2 jam yang lalu</p>
                  </DropdownMenuItem>
                  <DropdownMenuItem className={`flex flex-col items-start gap-1 p-4 cursor-pointer ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`}>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Status pengaduan berubah</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Pengaduan Anda telah selesai diproses</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>1 hari yang lalu</p>
                  </DropdownMenuItem>
                </div>
                <div className={`p-3 border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                  <button className="w-full text-center text-sm text-blue-500 hover:text-blue-600">
                    Lihat semua notifikasi
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Role Badge */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <MapPin className={`h-3.5 w-3.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-xs font-medium ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Warga</span>
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`flex items-center gap-3 px-2 py-1.5 h-auto rounded-lg ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || ''} />
                    <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                      {getInitials(user?.fullname || user?.username || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex lg:flex-col lg:items-start text-left">
                    <span className="text-sm font-semibold">{user?.fullname || user?.username}</span>
                    <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Warga</span>
                  </div>
                  <ChevronDown className="hidden lg:block w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={`w-64 ${darkMode ? 'bg-slate-900 border-slate-700' : ''}`}>
                <DropdownMenuLabel className="p-4">
                  <span className="text-sm font-semibold block">{user?.fullname || user?.username}</span>
                  <span className="text-xs text-gray-400 block">{user?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* 🔥 PROFILE LINK - pake username dinamis */}
                <DropdownMenuItem asChild>
                  <Link href={profileUrl} className="w-full flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="w-full flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Pengaturan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)} className="md:hidden">
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

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed top-0 left-0 h-full transition-all duration-300 z-50 flex flex-col shadow-xl ${darkMode ? 'bg-slate-950 border-r border-slate-800' : 'bg-white border-r border-gray-200'} ${collapsed ? 'w-20' : 'w-64'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* LOGO */}
        <div className={`flex items-center justify-between px-5 py-4 border-b h-16 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
          <Link href="/home" className="flex items-center gap-2.5 mx-auto md:mx-0">
            <div className="rounded-xl bg-blue-500 p-2 text-white">
              <Home className="h-5 w-5" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg">
                Lapor<span className="text-blue-500">Gubernur</span>
              </span>
            )}
          </Link>
        </div>

        {/* User Info Mini (collapsed mode) */}
        {collapsed && (
          <div className={`px-3 py-4 border-b ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={profileUrl}>
                    <Avatar className="w-12 h-12 mx-auto ring-2 ring-blue-500/50 cursor-pointer hover:ring-blue-500 transition">
                      <AvatarFallback className="bg-blue-500 text-white font-bold">
                        {getInitials(user?.fullname || user?.username || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{user?.fullname || user?.username}</p>
                  <p className="text-xs">Lihat Profil</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* MENU NAVIGASI */}
        <nav className="flex-1 py-6 overflow-y-auto px-3">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all ${collapsed ? 'justify-center' : ''} ${
                    active 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : darkMode 
                        ? 'text-slate-300 hover:bg-white/5' 
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1">{link.label}</span>
                      {link.badge && (
                        <Badge className={`${link.badge === 'New' ? 'bg-emerald-500' : 'bg-red-500'} text-white text-[10px] px-1.5`}>
                          {link.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
          
          {/* Profile link ketika collapsed */}
          {collapsed && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={profileUrl} className="flex justify-center">
                      <User className="w-5 h-5 text-gray-500 hover:text-blue-500 transition" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Profil</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </nav>

        {/* FOOTER */}
        {!collapsed && (
          <div className={`p-4 border-t ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>Version 2.0.0</p>
                <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-gray-300'}`}>© 2024 LaporGubernur</p>
              </div>
              <Building2 className={`w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-gray-300'}`} />
            </div>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <div className={`transition-all duration-300 min-h-screen pt-16 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}