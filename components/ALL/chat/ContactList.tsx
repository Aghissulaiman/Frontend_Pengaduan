'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Search,
  MessageCircle,
  UserPlus,
  Users,
  Plus,
  X,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Contact {
  id: number;
  username: string;
  fullname: string;
  email: string;
  role: string;
  avatar?: string;
  is_following: boolean;
  is_followed_by: boolean;
  last_message?: string;
  unread_count: number;
}

interface FollowRequest {
  id: number;
  follower_id: number;
  follower_name: string;
  follower_username: string;
  follower_avatar?: string;
}

export default function ContactsPage() {
  const router = useRouter();
  const { token, user: currentUser } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  
  const initialFetchDone = useRef(false);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // FETCH DATA - SATU FUNCTION SAJA
  const fetchAllData = async () => {
    if (!token) return;
    
    try {
      // Fetch contacts
      const contactsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/contacts?search=${search}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const contactsData = await contactsRes.json();
      if (contactsData.success) {
        setContacts(contactsData.data || []);
      }
      
      // Fetch follow requests
      const requestsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/follow/requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const requestsData = await requestsRes.json();
      if (requestsData.success) {
        setFollowRequests(requestsData.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // INITIAL FETCH - HANYA SEKALI
  useEffect(() => {
    if (token && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchAllData();
    }
  }, [token]);

  // FETCH KETIKA SEARCH BERUBAH - DENGAN DEBOUNCE
  useEffect(() => {
    if (!token || !initialFetchDone.current) return;
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    searchTimeout.current = setTimeout(() => {
      setIsLoading(true);
      fetchAllData();
    }, 500);
    
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search, token]);

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/users?search=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        const filtered = (data.data || []).filter((u: Contact) => u.id !== currentUser?.id);
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const followUser = async (userId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ following_id: userId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Permintaan follow dikirim');
        fetchAllData();
        searchUsers();
      } else {
        toast.error(data.message || 'Gagal follow');
      }
    } catch (error) {
      toast.error('Gagal follow');
    }
  };

  const acceptFollow = async (followerId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/follow/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ follower_id: followerId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Follow diterima');
        fetchAllData();
      } else {
        toast.error(data.message || 'Gagal menerima follow');
      }
    } catch (error) {
      toast.error('Gagal menerima follow');
    }
  };

  const rejectFollow = async (followerId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/follow/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ follower_id: followerId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Follow ditolak');
        fetchAllData();
      } else {
        toast.error(data.message || 'Gagal menolak follow');
      }
    } catch (error) {
      toast.error('Gagal menolak follow');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchUsers();
      else setSearchResults([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getInitials = (name: string) => name?.charAt(0).toUpperCase() || 'U';

  if (!token) return null;

  const relatedContacts = contacts.filter((c) => c.is_following || c.is_followed_by);
  const mutualContacts = relatedContacts.filter((c) => c.is_following && c.is_followed_by);
  const onlyMeFollow = relatedContacts.filter((c) => c.is_following && !c.is_followed_by);
  const onlyFollowMe = relatedContacts.filter((c) => !c.is_following && c.is_followed_by);

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-white px-5 pt-6 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
          <p className="text-sm text-gray-400 mt-1">Teman yang saling follow</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white p-0">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="px-5 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Cari kontak..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-2xl bg-gray-100 border-0 text-base"
          />
        </div>
      </div>

      {followRequests.length > 0 && (
        <div className="px-5 mb-4">
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
              <UserPlus className="w-3 h-3" />
              Permintaan Follow ({followRequests.length})
            </p>
            {followRequests.map((req) => (
              <div key={req.follower_id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-amber-200 text-amber-700 text-xs">
                      {getInitials(req.follower_name || req.follower_username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{req.follower_name || req.follower_username}</p>
                    <p className="text-xs text-gray-400">@{req.follower_username}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => acceptFollow(req.follower_id)} className="bg-green-500 hover:bg-green-600 text-white h-7 px-3 text-xs">
                    Terima
                  </Button>
                  <Button size="sm" onClick={() => rejectFollow(req.follower_id)} variant="outline" className="h-7 px-3 text-xs">
                    Tolak
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-2 pb-20">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : relatedContacts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">Belum ada kontak</p>
            <p className="text-sm text-gray-300 mt-1">Follow pengguna lain untuk memulai chat</p>
          </div>
        ) : (
          <>
            {mutualContacts.length > 0 && (
              <div className="mb-6">
                <div className="px-3 mb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kontak ({mutualContacts.length})</p>
                </div>
                {mutualContacts.map((contact) => (
                  <div key={contact.id} onClick={() => router.push(`/chat/${contact.id}`)} className="flex items-center gap-3 px-3 py-3 mx-2 rounded-2xl active:bg-gray-50 cursor-pointer transition-colors">
                    <Avatar className="w-14 h-14 shrink-0">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-base">
                        {getInitials(contact.fullname || contact.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-base">{contact.fullname || contact.username}</p>
                        {contact.unread_count > 0 && (
                          <div className="bg-blue-500 text-white text-xs font-medium rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                            {contact.unread_count}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{contact.role}</p>
                      <Badge className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 mt-1">Saling follow</Badge>
                    </div>
                    <MessageCircle className="w-5 h-5 text-gray-300" />
                  </div>
                ))}
              </div>
            )}

            {onlyMeFollow.length > 0 && (
              <div className="mb-6">
                <div className="px-3 mb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Diikuti ({onlyMeFollow.length})</p>
                </div>
                {onlyMeFollow.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3 px-3 py-3 mx-2 rounded-2xl">
                    <Avatar className="w-14 h-14 shrink-0">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback className="bg-gray-300 text-gray-500 text-base">
                        {getInitials(contact.fullname || contact.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-base">{contact.fullname || contact.username}</p>
                      <p className="text-sm text-gray-400">{contact.role}</p>
                      <Badge className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 mt-1">Menunggu follow back</Badge>
                    </div>
                    <Button onClick={() => router.push(`/chat/${contact.id}`)} className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-8 text-xs">
                      <MessageCircle className="w-3 h-3 mr-1" /> Chat
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {onlyFollowMe.length > 0 && (
              <div className="mb-6">
                <div className="px-3 mb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pengikut ({onlyFollowMe.length})</p>
                </div>
                {onlyFollowMe.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3 px-3 py-3 mx-2 rounded-2xl">
                    <Avatar className="w-14 h-14 shrink-0">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback className="bg-gray-300 text-gray-500 text-base">
                        {getInitials(contact.fullname || contact.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-base">{contact.fullname || contact.username}</p>
                      <p className="text-sm text-gray-400">{contact.role}</p>
                      <Badge className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 mt-1">Mengikuti Anda</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => followUser(contact.id)} className="bg-green-500 hover:bg-green-600 text-white rounded-full px-4 h-8 text-xs">
                        <UserPlus className="w-3 h-3 mr-1" /> Follow Back
                      </Button>
                      <Button onClick={() => router.push(`/home/chat/${contact.id}`)} variant="outline" className="rounded-full px-4 h-8 text-xs">
                        <MessageCircle className="w-3 h-3 mr-1" /> Chat
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-0 gap-0 bg-white">
          <DialogHeader className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">Tambah Kontak</DialogTitle>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <DialogDescription className="text-sm text-gray-400">Cari pengguna melalui username, nama, atau email</DialogDescription>
          </DialogHeader>
          <div className="p-5">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari username, nama, atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 rounded-xl bg-gray-100 border-0 text-sm"
                autoFocus
              />
            </div>
            {isSearching ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarImage src={result.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm">
                          {getInitials(result.fullname || result.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{result.fullname || result.username}</p>
                        <p className="text-xs text-gray-400 truncate">@{result.username}</p>
                        <p className="text-xs text-gray-400 truncate">{result.email}</p>
                      </div>
                    </div>
                    {result.is_following ? (
                      <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs">
                        <UserCheck className="w-3 h-3" /><span>Following</span>
                      </div>
                    ) : result.is_followed_by ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">Followed You</span>
                        <Button onClick={() => followUser(result.id)} className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-8 text-xs">Follow Back</Button>
                      </div>
                    ) : (
                      <Button onClick={() => followUser(result.id)} className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-8 text-xs">
                        <UserPlus className="w-3 h-3 mr-1" /> Follow
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : searchQuery && !isSearching ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><Search className="w-5 h-5 text-gray-400" /></div>
                <p className="text-gray-400 text-sm">Tidak ditemukan</p>
                <p className="text-xs text-gray-300 mt-1">Coba kata kunci lain</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><Users className="w-5 h-5 text-gray-400" /></div>
                <p className="text-gray-400 text-sm">Cari pengguna</p>
                <p className="text-xs text-gray-300 mt-1">Masukkan username, nama, atau email</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}