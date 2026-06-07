'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Send,
  Search,
  MessageCircle,
  CheckCheck,
  Check,
  ArrowLeft,
  UserPlus,
  RefreshCw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Conversation {
  id: number;
  participant1_id: number;
  participant2_id: number;
  participant1_name: string;
  participant2_name: string;
  participant1_avatar?: string;
  participant2_avatar?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  receiver_id: number;
  receiver_name: string;
  message: string;
  type: string;
  file_url?: string;
  is_read: boolean;
  created_at: string;
}

interface ChatUser {
  id: number;
  username: string;
  fullname: string;
  email: string;
  role: string;
  avatar?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => name?.charAt(0).toUpperCase() || 'U';

  // Get other participant info
  const getOtherParticipant = (conv: Conversation) => {
    if (conv.participant1_id === user?.id) {
      return {
        name: conv.participant2_name,
        id: conv.participant2_id,
        avatar: conv.participant2_avatar
      };
    }
    return {
      name: conv.participant1_name,
      id: conv.participant1_id,
      avatar: conv.participant1_avatar
    };
  };

  const otherParticipant = selectedConversation ? getOtherParticipant(selectedConversation) : null;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        setConversations(data.data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Check follow status for selected user
  const checkFollowStatus = useCallback(async (userId: number) => {
    if (!token) return false;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/follow/status?user_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        const isFollow = data.data.is_following === true;
        setIsFollowing(isFollow);
        return isFollow;
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
    return false;
  }, [token]);

  // Fetch messages
  const fetchMessages = useCallback(async (conversationId: number) => {
    if (!token) return;
    
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        // Urutkan messages dari lama ke baru (agar yang terbaru di bawah)
        const sortedMessages = [...(data.data.messages || [])].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sortedMessages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [token]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!token || !selectedConversation || !messageInput.trim()) return;
    
    const messageToSend = messageInput.trim();
    setMessageInput('');
    
    setIsSending(true);
    try {
      const receiverId = selectedConversation.participant1_id === user?.id 
        ? selectedConversation.participant2_id 
        : selectedConversation.participant1_id;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_id: receiverId,
          message: messageToSend
        })
      });
      
      const data = await res.json();
      
      if (data.success && data.data) {
        setMessages(prev => [...prev, data.data]);
        scrollToBottom();
        fetchConversations();
      } else {
        toast.error(data.message || 'Gagal mengirim pesan');
        setMessageInput(messageToSend);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Gagal mengirim pesan');
      setMessageInput(messageToSend);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [token, selectedConversation, messageInput, user?.id, fetchConversations]);

  // Follow user
  const handleFollow = useCallback(async (userId: number) => {
    if (!token) return;
    
    setIsLoadingFollow(true);
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
      
      if (data.success || data.message === 'sudah follow') {
        toast.success('Berhasil terhubung! Sekarang Anda bisa chat.');
        setIsFollowing(true);
        await fetchConversations();
        await checkFollowStatus(userId);
      } else {
        toast.error(data.message || 'Gagal follow');
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Gagal follow');
    } finally {
      setIsLoadingFollow(false);
    }
  }, [token, fetchConversations, checkFollowStatus]);

  // Search users
  const searchUsers = useCallback(async () => {
    if (!searchUser.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/users?search=${encodeURIComponent(searchUser)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        const filtered = (data.data || []).filter((u: ChatUser) => u.id !== user?.id);
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal mencari pengguna');
    } finally {
      setIsSearching(false);
    }
  }, [searchUser, token, user?.id]);

  // Start new conversation
  const startConversation = async (otherUser: ChatUser) => {
    if (!token) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: otherUser.id })
      });
      
      const data = await res.json();
      
      if (data.success && data.data) {
        setSelectedConversation(data.data);
        setIsModalOpen(false);
        setSearchUser('');
        setSearchResults([]);
        await fetchConversations();
        await fetchMessages(data.data.id);
        await checkFollowStatus(otherUser.id);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Gagal memulai percakapan');
    }
  };

  // Select conversation
  const selectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    const otherId = conv.participant1_id === user?.id ? conv.participant2_id : conv.participant1_id;
    await checkFollowStatus(otherId);
    await fetchMessages(conv.id);
  };

  const handleRefresh = () => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      fetchConversations();
      const otherId = selectedConversation.participant1_id === user?.id 
        ? selectedConversation.participant2_id 
        : selectedConversation.participant1_id;
      checkFollowStatus(otherId);
    }
    toast.info('Memuat ulang...');
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && isFollowing && !isSending && messageInput.trim()) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Initial fetch
  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token, fetchConversations]);

  // Refresh follow status when selected conversation changes
  useEffect(() => {
    if (selectedConversation && otherParticipant) {
      checkFollowStatus(otherParticipant.id);
    }
  }, [selectedConversation, otherParticipant?.id]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedConversation) return;
    
    const interval = setInterval(() => {
      fetchMessages(selectedConversation.id);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [selectedConversation, fetchMessages]);

  // Search debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      if (isModalOpen && searchUser) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchUser, isModalOpen, searchUsers]);

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Silakan login terlebih dahulu</p>
          <Button onClick={() => router.push('/auth/login')}>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Daftar Chat */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Pesan</h1>
            <Button size="sm" onClick={() => setIsModalOpen(true)} className="rounded-full w-8 h-8 p-0">
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">Belum ada percakapan</p>
              <Button variant="link" onClick={() => setIsModalOpen(true)} className="mt-2">
                Mulai chat baru
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => {
                const other = getOtherParticipant(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition ${
                      selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {getInitials(other.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{other.name}</p>
                        {conv.last_message_at && (
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: id })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.last_message || 'Mulai percakapan'}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <Badge className="bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {selectedConversation && otherParticipant ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b p-4 flex items-center gap-3">
            <button onClick={() => setSelectedConversation(null)} className="md:hidden">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {getInitials(otherParticipant.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{otherParticipant.name}</p>
              <p className="text-xs">
                {isLoadingFollow ? (
                  <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                ) : isFollowing ? (
                  <span className="text-green-600">✓ Terhubung</span>
                ) : (
                  <span className="text-gray-400">Follow untuk memulai chat</span>
                )}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={handleRefresh} className="h-8 w-8 p-0" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col space-y-3">
              {isLoadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">Belum ada pesan</p>
                  <p className="text-xs text-gray-400">
                    {isFollowing ? 'Kirim pesan pertama Anda' : 'Follow dulu untuk mengirim pesan'}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMyMessage = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isMyMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border text-gray-800'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                          isMyMessage ? 'text-blue-100' : 'text-gray-400'
                        }`}>
                          <span>
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: id })}
                          </span>
                          {isMyMessage && (
                            msg.is_read ? (
                              <CheckCheck className="w-3 h-3 text-blue-300" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="bg-white border-t p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder={isFollowing ? "Tulis pesan..." : "Follow dulu untuk mengirim pesan"}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!isFollowing || isSending}
                className={!isFollowing ? "bg-gray-100" : ""}
              />
              {!isFollowing ? (
                <Button 
                  onClick={() => otherParticipant && handleFollow(otherParticipant.id)}
                  disabled={isLoadingFollow}
                  className="bg-blue-500 hover:bg-blue-600 gap-2"
                >
                  {isLoadingFollow ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {isLoadingFollow ? 'Memproses...' : 'Follow'}
                </Button>
              ) : (
                <Button 
                  onClick={sendMessage} 
                  disabled={isSending || !messageInput.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600">Pesan Anda</h2>
            <p className="text-gray-400 mt-2">Pilih percakapan atau mulai chat baru</p>
            <Button variant="outline" onClick={() => setIsModalOpen(true)} className="mt-4">
              <UserPlus className="w-4 h-4 mr-2" /> Chat Baru
            </Button>
          </div>
        </div>
      )}

      {/* Modal Tambah Chat Baru */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-0 gap-0 bg-white">
          <DialogHeader className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">Chat Baru</DialogTitle>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchUser('');
                  setSearchResults([]);
                }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <DialogDescription className="text-sm text-gray-400">
              Cari pengguna melalui username, nama, atau email
            </DialogDescription>
          </DialogHeader>

          <div className="p-5">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari username, nama, atau email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="pl-11 h-11 rounded-xl bg-gray-100 border-0 text-sm"
                autoFocus
              />
            </div>

            {isSearching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => startConversation(result)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm">
                        {getInitials(result.fullname || result.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {result.fullname || result.username}
                      </p>
                      <p className="text-xs text-gray-400 truncate">@{result.username}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="shrink-0">
                      Chat
                    </Button>
                  </div>
                ))}
              </div>
            ) : searchUser && !isSearching ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm">Tidak ditemukan</p>
                <p className="text-xs text-gray-300 mt-1">Coba kata kunci lain</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserPlus className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm">Cari pengguna</p>
                <p className="text-xs text-gray-300 mt-1">
                  Masukkan username, nama, atau email
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}