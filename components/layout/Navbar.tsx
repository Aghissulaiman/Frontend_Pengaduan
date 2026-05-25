'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Home, FileText, User, LogOut, Bell, Settings, HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export function UserNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navLinks = [
    { href: '/home', label: 'Beranda', icon: Home },
    { href: '/complaints', label: 'Pengaduanku', icon: FileText },
    { href: '/track', label: 'Lacak Pengaduan', icon: Search },
  ];

  // Ambil inisial nama untuk avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/home" className="flex items-center space-x-2">
            <div className="rounded-lg bg-primary p-1.5">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">
              Lapor<span className="text-primary">Gubernur</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notification Button */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(user?.fullname || user?.username || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden lg:inline-block">
                    {user?.fullname || user?.username}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.fullname || user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil Saya</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Pengaturan</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/help" className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Bantuan</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3">
              {/* User Info Mobile */}
              <div className="flex items-center gap-3 px-3 py-2 bg-accent/50 rounded-lg mb-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user?.fullname || user?.username || 'User')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{user?.fullname || user?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              {/* Nav Links Mobile */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={toggleMenu}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              ))}

              <div className="pt-3 border-t">
                <Link
                  href="/profile"
                  onClick={toggleMenu}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Profil Saya</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={toggleMenu}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Pengaturan</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    toggleMenu();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Import Search yang kurang
import { Search } from 'lucide-react';