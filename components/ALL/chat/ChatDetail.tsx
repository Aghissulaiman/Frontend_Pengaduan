'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, CheckCheck, Check, ArrowLeft, Lock, UserPlus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

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

interface Contact {
  id: number;
  username: string;
  fullname: string;
  email: string;
  role: string;
  avatar?: string;
  is_following: boolean;
  is_followed_by: boolean;
}

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  const contactId = parseInt(params.id as string);
  
  // DEFINE canChat DI SINI
  const canChat = contact?.is_following && contact?.is_followed_by;

  // Fetch contact data - dengan timeout
  const fetchContact = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Set timeout 10 detik
    const timeoutId = setTimeout(() => {
      if (isMounted.current) {
        toast.error('Timeout memuat data');
        setIsLoading(false);
      }
    }, 10000);

    try {
      // Coba dari contacts dulu
      const contactsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const contactsData = await contactsRes.json();
      
      if (contactsData.success && contactsData.data && isMounted.current) {
        const found = contactsData.data.find((c: any) => c.id === contactId);
        if (found) {
          setContact(found);
          clearTimeout(timeoutId);
          setIsLoading(false);
          return;
        }
      }
      
      // Coba dari users
      const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/users?search=`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      
      if (usersData.success && usersData.data && isMounted.current) {
        const found = usersData.data.find((u: any) => u.id === contactId);
        if (found) {
          setContact({
            ...found,
            is_following: false,
            is_followed_by: false
          });
        } else {
          toast.error('Kontak tidak ditemukan');
          router.push('/home/chats');
        }
      } else {
        // Buat contact dummy sebagai fallback
        setContact({
          id: contactId,
          username: 'Pengguna',
          fullname: 'Pengguna',
          email: '',
          role: 'user',
          is_following: false,
          is_followed_by: false
        });
      }
    } catch (error) {
      console.error(error);
      // Fallback: buat contact dummy
      if (isMounted.current) {
        setContact({
          id: contactId,
          username: 'Pengguna',
          fullname: 'Pengguna',
          email: '',
          role: 'user',
          is_following: false,
          is_followed_by: false
        });
        toast.error('Gagal memuat data kontak, menggunakan data default');
      }
    } finally {
      clearTimeout(timeoutId);
      if (isMounted.current) setIsLoading(false);
    }
  }, [token, contactId, router]);

  // Get or create conversation
  const getConversation = useCallback(async () => {
    if (!token || !contact) return null;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: contact.id })
      });
      const data = await res.json();

      if (data.success && data.data && isMounted.current) {
        setConversationId(data.data.id);
        return data.data.id;
      }
    } catch (error) {
      console.error('Error getting conversation:', error);
    }
    return null;
  }, [token, contact]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!token || !conversationId || !isMounted.current) return;

    setIsLoadingMessages(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && data.data && isMounted.current) {
        setMessages(data.data.messages || []);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (isMounted.current) setIsLoadingMessages(false);
    }
  }, [token, conversationId]);

  // Send message
  const sendMessage = async () => {
    if (!token || !conversationId || !messageInput.trim() || !canChat) return;

    setIsSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_id: contact?.id,
          message: messageInput
        })
      });

      const data = await res.json();

      if (data.success && data.data && isMounted.current) {
        setMessages(prev => [data.data, ...prev]);
        setMessageInput('');
        setTimeout(() => scrollToBottom(), 100);
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error(data.message || 'Gagal mengirim pesan');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Gagal mengirim pesan');
    } finally {
      setIsSending(false);
    }
  };

  const followUser = async () => {
    if (!token || !contact) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ following_id: contact.id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Permintaan follow dikirim');
        fetchContact();
      } else {
        toast.error(data.message || 'Gagal follow');
      }
    } catch (error) {
      toast.error('Gagal follow');
    }
  };

  // Initialize - fetch contact first
  useEffect(() => {
    fetchContact();
    return () => {
      isMounted.current = false;
    };
  }, [fetchContact]);

  // Get conversation after contact loaded
  useEffect(() => {
    if (contact && canChat && !conversationId) {
      getConversation();
    }
  }, [contact, canChat, conversationId, getConversation]);

  // Fetch messages when conversationId or refreshKey changes
  useEffect(() => {
    if (conversationId && canChat) {
      fetchMessages();
    }
  }, [conversationId, refreshKey, canChat, fetchMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.info('Memuat pesan terbaru...');
  };

  const getInitials = (name: string) => name?.charAt(0).toUpperCase() || 'U';

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="h-screen flex items-center justify-center flex-col">
        <p className="text-gray-400">Kontak tidak ditemukan</p>
        <Button onClick={() => router.push('/home/chats')} className="mt-4">
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.push('/home/chats')} className="md:hidden">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={contact.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
            {getInitials(contact.fullname || contact.username)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{contact.fullname || contact.username}</p>
          <p className="text-xs text-gray-400">{contact.role}</p>
        </div>
        {canChat && (
          <Button size="sm" variant="ghost" onClick={handleRefresh} className="h-8 w-8 p-0">
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Chat Area */}
      {!canChat ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6">
            <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700 mb-2">Tidak Dapat Mengirim Pesan</h3>
            <p className="text-sm text-gray-500 mb-4">
              Anda perlu saling follow dengan {contact.fullname || contact.username} untuk memulai percakapan.
            </p>
            <div className="flex gap-2 justify-center">
              {!contact.is_following && (
                <Button onClick={followUser} className="bg-blue-500 hover:bg-blue-600">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow
                </Button>
              )}
              {!contact.is_followed_by && contact.is_following && (
                <Badge className="bg-yellow-100 text-yellow-700">
                  Menunggu follow back
                </Badge>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col-reverse space-y-3 space-y-reverse">
              {isLoadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Belum ada pesan</p>
                  <p className="text-xs text-gray-400 mt-1">Kirim pesan pertama Anda</p>
                  <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Refresh
                  </Button>
                </div>
              ) : (
                [...messages].reverse().map((msg) => {
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
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          isMyMessage ? 'text-blue-100' : 'text-gray-400'
                        }`}>
                          <span>
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: id })}
                          </span>
                          {isMyMessage && (
                            msg.is_read ? (
                              <CheckCheck className="w-3 h-3" />
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

          <div className="bg-white border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Tulis pesan..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={isSending || !messageInput.trim()}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}