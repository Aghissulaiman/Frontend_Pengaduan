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
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
  Inbox,
  Activity,
  BarChart3,
  Sun,
  Moon,
  MessageSquare,
  Send,
  X,
  MessageCircle,
  Rss, // Icon baru untuk Feed
  Heart,
  MessageCircleMore,
  Share2,
  Plus
} from 'lucide-react';
import { Button } from '../ui/button';
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

interface GovernorSidebarProps {
  children?: React.ReactNode;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isAdmin: boolean;
}

// --- INTERFACE BARU UNTUK FITUR FEED ---
interface FeedPost {
  id: string;
  author: string;
  role: string;
  avatarUrl?: string;
  content: string;
  imageUrl?: string;
  likes: number;
  commentsCount: number;
  timeAgo: string;
  hasLiked: boolean;
}

export function GovernorSidebar({ children }: GovernorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Layout States
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  // Widget Active State (Mengatur apakah menampilkan panel Chat atau Feed di pojok)
  const [activeWidget, setActiveWidget] = useState<'none' | 'chat' | 'feed'>('none');

  // --- FITUR CHAT STATES ---
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { id: '1', senderId: 'user1', senderName: 'Budi Santoso', text: 'Selamat siang Pak, laporan saya mengenai jalan rusak di daerah Ringroad belum ditanggapi.', timestamp: '10:30', isAdmin: false },
    { id: '2', senderId: 'gov', senderName: 'Gubernur', text: 'Halo Budi, tim dinas PU sedang menuju ke lokasi untuk survei awal.', timestamp: '10:32', isAdmin: true }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(1);

  // --- FITUR FEED STATES (Mock Data Real-time Feed) ---
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([
    {
      id: 'post-1',
      author: 'Rian Hidayat',
      role: 'Warga Kel. Sukamaju',
      content: 'Apresiasi penuh untuk Pemprov! Taman kota sekarang bersih banget dan lampu jalannya sudah diperbaiki semua. Mantap Pak Gub! 🌲✨',
      likes: 42,
      commentsCount: 5,
      timeAgo: '12 menit yang lalu',
      hasLiked: false
    },
    {
      id: 'post-2',
      author: 'Siti Aminah',
      role: 'Pelaku UMKM',
      content: 'Mohon info kelanjutan bantuan modal usaha UMKM daerah Jatinegara dong teman-teman atau pihak dinas terkait. Terima kasih.',
      likes: 18,
      commentsCount: 12,
      timeAgo: '1 jam yang lalu',
      hasLiked: false
    }
  ]);
  const [newPostContent, setNewPostContent] = useState('');

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

  // --- MENU NAVIGASI UPDATE (Ditambahkan Menu Feed) ---
  const navLinks = [
    { href: '/governor', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { href: '/governor/feed', label: 'Feed Publik', icon: Rss, badge: 'New' }, // Tambahan Menu Feed
    { href: '/governor/complaints', label: 'Pengaduan', icon: Inbox, badge: '12' },
    { href: '/governor/chats', label: 'Pesan / Chat', icon: MessageSquare, badge: unreadChatCount > 0 ? String(unreadChatCount) : null },
    { href: '/governor/investigations', label: 'Investigasi', icon: Activity, badge: '3' },
    { href: '/governor/reports', label: 'Laporan', icon: BarChart3, badge: null },
  ];

  // --- FITUR LOGIKA KIRIM CHAT ---
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'gov',
      senderName: user?.fullname || 'Gubernur',
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAdmin: true
    };

    setChatMessages([...chatMessages, newMessage]);
    setInputMessage('');

    setTimeout(() => {
      const autoReply: Message = {
        id: (Date.now() + 1).toString(),
        senderId: 'user1',
        senderName: 'Budi Santoso',
        text: 'Baik Pak, terima kasih atas respons cepatnya! 🙏',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAdmin: false
      };
      setChatMessages(prev => [...prev, autoReply]);
      if (activeWidget !== 'chat') setUnreadChatCount(prev => prev + 1);
    }, 2000);
  };

  // --- FITUR LOGIKA FEED INTERAKTIF ---
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      author: user?.fullname || 'Gubernur',
      role: 'Gubernur (Official)',
      content: newPostContent,
      likes: 0,
      commentsCount: 0,
      timeAgo: 'Baru saja',
      hasLiked: false
    };

    setFeedPosts([newPost, ...feedPosts]);
    setNewPostContent('');
  };

  const handleLikePost = (postId: string) => {
    setFeedPosts(feedPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.hasLiked ? post.likes - 1 : post.likes + 1,
          hasLiked: !post.hasLiked
        };
      }
      return post;
    }));
  };

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
    if (href === '/governor') return pathname === href;
    return pathname.startsWith(href);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/governor/complaints?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Navbar */}
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
              className={darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
            
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                <Input
                  type="text"
                  placeholder="Cari keluhan atau aspirasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 w-96 h-10 rounded-lg text-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-400' : 'bg-gray-50 border-gray-200'
                  }`}
                />
              </div>
            </form>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className={darkMode ? 'text-yellow-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-100'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <MapPin className={`h-3.5 w-3.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-xs font-medium ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>{getProvinceName()}</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`flex items-center gap-3 px-2 py-1.5 h-auto rounded-lg ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || ''} />
                    <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                      {getInitials(user?.fullname || user?.username || 'Gov')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex lg:flex-col lg:items-start text-left">
                    <span className="text-sm font-semibold">{user?.fullname || user?.username}</span>
                    <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Gubernur</span>
                  </div>
                  <ChevronDown className="hidden lg:block w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={`w-64 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : ''}`}>
                <DropdownMenuLabel className="p-4">
                  <span className="text-sm font-semibold block">{user?.fullname || user?.username}</span>
                  <span className="text-xs text-gray-400 block">{user?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className={darkMode ? 'bg-slate-700' : ''} />
                <DropdownMenuItem asChild><Link href="/governor/profile" className="w-full flex items-center"><User className="mr-2 h-4 w-4" />Profil</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/governor/settings" className="w-full flex items-center"><Settings className="mr-2 h-4 w-4" />Pengaturan</Link></DropdownMenuItem>
                <DropdownMenuSeparator className={darkMode ? 'bg-slate-700' : ''} />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500"><LogOut className="mr-2 h-4 w-4" />Keluar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)} className="md:hidden">
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {isMobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />}

      {/* Sidebar Navigation */}
      <aside className={`fixed top-0 left-0 h-full transition-all duration-300 z-50 flex flex-col shadow-xl ${darkMode ? 'bg-slate-950 border-r border-slate-800' : 'bg-white border-r border-gray-200'} ${collapsed ? 'w-20' : 'w-64'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b h-16 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
          <Link href="/governor" className="flex items-center gap-2.5 mx-auto md:mx-0">
            <div className="rounded-xl bg-blue-500 p-2 text-white"><Building2 className="h-5 w-5" /></div>
            {!collapsed && <span className="font-bold text-lg">Lapor<span className="text-blue-500">Gubernur</span></span>}
          </Link>
        </div>

        <nav className="flex-1 py-6 overflow-y-auto px-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all ${collapsed ? 'justify-center' : ''} ${
                  active ? 'bg-blue-500 text-white shadow-md' : darkMode ? 'text-slate-300 hover:bg-white/5' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
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
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 min-h-screen pt-16 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <main className="p-6">{children}</main>
      </div>

      {/* --- FLOATING MULTI-WIDGET CONTROLLER (CHAT & FEED) --- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        
        {/* Panel Tampilan Widget Aktif */}
        {activeWidget === 'chat' && (
          <div className={`w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}`}>
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-sm font-semibold">Ruang Percakapan Warga</h4>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveWidget('none')} className="text-white hover:bg-white/10 h-8 w-8"><X className="w-4 h-4" /></Button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-950/40">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-gray-400 mb-1 px-1">{msg.senderName}</span>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.isAdmin ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700'}`}>
                    <p>{msg.text}</p>
                    <span className="text-[9px] block text-right mt-1 opacity-70">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="p-3 border-t flex items-center gap-2 border-slate-100 dark:border-slate-700">
              <Input type="text" placeholder="Tulis tanggapan..." value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} className="flex-1" />
              <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700 text-white"><Send className="w-4 h-4" /></Button>
            </form>
          </div>
        )}

        {activeWidget === 'feed' && (
          <div className={`w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}`}>
            <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rss className="w-4 h-4" />
                <h4 className="text-sm font-semibold">Feed Aspirasi Regional</h4>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveWidget('none')} className="text-white hover:bg-white/10 h-8 w-8"><X className="w-4 h-4" /></Button>
            </div>
            
            {/* Area Konten Utama Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-950/20">
              {/* Form Cepat Buat Post Baru oleh Gubernur */}
              <form onSubmit={handleCreatePost} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 space-y-2">
                <textarea
                  placeholder="Bagikan info atau maklumat daerah hari ini..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full text-xs p-2 rounded-md bg-slate-50 dark:bg-slate-900 border-none outline-none resize-none h-14"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 gap-1">
                    <Plus className="w-3 h-3" /> Siarkan
                  </Button>
                </div>
              </form>

              {/* Loop Pemetaan Postingan Warga */}
              {feedPosts.map((post) => (
                <div key={post.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                        {getInitials(post.author)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h5 className="text-xs font-bold">{post.author}</h5>
                      <p className="text-[10px] text-gray-400">{post.role} • {post.timeAgo}</p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">{post.content}</p>
                  
                  {/* Tombol Interaksi Sosial (Like/Comment) */}
                  <div className="flex items-center gap-4 pt-1 border-t border-slate-100 dark:border-slate-700 text-gray-400">
                    <button 
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1 text-[11px] transition-colors ${post.hasLiked ? 'text-red-500 font-medium' : 'hover:text-red-500'}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${post.hasLiked ? 'fill-current' : ''}`} />
                      {post.likes}
                    </button>
                    <button className="flex items-center gap-1 text-[11px] hover:text-blue-500">
                      <MessageCircleMore className="w-3.5 h-3.5" />
                      {post.commentsCount}
                    </button>
                    <button className="flex items-center gap-1 text-[11px] hover:text-gray-600 ml-auto">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tombol Pemicu Floating (Aksi Toggling) */}
        <div className="flex gap-2">
          {/* Tombol Trigger Feed */}
          <Button 
            onClick={() => setActiveWidget(activeWidget === 'feed' ? 'none' : 'feed')}
            className={`h-12 px-4 rounded-full shadow-xl flex items-center gap-2 transition-all ${
              activeWidget === 'feed' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-white hover:bg-slate-100'
            }`}
          >
            <Rss className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium">Feed Warga</span>
          </Button>

          {/* Tombol Trigger Chat */}
          <Button 
            onClick={() => {
              setActiveWidget(activeWidget === 'chat' ? 'none' : 'chat');
              setUnreadChatCount(0);
            }}
            className={`h-12 w-12 rounded-full shadow-xl flex items-center justify-center relative transition-all ${
              activeWidget === 'chat' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-white hover:bg-slate-100'
            }`}
          >
            <MessageCircle className="w-5 h-5 text-blue-500" />
            {unreadChatCount > 0 && activeWidget !== 'chat' && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                {unreadChatCount}
              </span>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}