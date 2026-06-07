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
    
  } from 'lucide-react';
  import { toast } from 'sonner';
  import { formatDistanceToNow } from 'date-fns';
  import { id } from 'date-fns/locale';

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
    const [messages, setMessages] = useState<Message[]>([]);
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [searchUser, setSearchUser] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [isSending, setIsSending] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Get initials
    const getInitials = (name: string) => {
      return name?.charAt(0).toUpperCase() || 'U';
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
          setMessages(data.data.messages || []);
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
            message: messageInput
          })
        });
        
        const data = await res.json();
        
        if (data.success && data.data) {
          setMessages(prev => [data.data, ...prev]);
          setMessageInput('');
          scrollToBottom();
          
          // Update conversation list
          fetchConversations();
        } else {
          toast.error(data.message || 'Gagal mengirim pesan');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Gagal mengirim pesan');
      } finally {
        setIsSending(false);
      }
    }, [token, selectedConversation, messageInput, user?.id, fetchConversations]);

    // Fetch users for new chat
    const fetchUsers = useCallback(async () => {
      if (!token) return;
      
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/chat/users${searchUser ? `?search=${searchUser}` : ''}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
          setUsers(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }, [token, searchUser]);

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
          setShowNewChat(false);
          fetchConversations();
          fetchMessages(data.data.id);
        }
      } catch (error) {
        console.error('Error starting conversation:', error);
        toast.error('Gagal memulai percakapan');
      }
    };

    // Select conversation
    const selectConversation = (conv: Conversation) => {
      setSelectedConversation(conv);
      fetchMessages(conv.id);
    };

    // Scroll to bottom
    const scrollToBottom = () => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };

    // Polling for new messages
    useEffect(() => {
      if (selectedConversation && token) {
        const interval = setInterval(() => {
          fetchMessages(selectedConversation.id);
          fetchConversations();
        }, 3000);
        
        return () => clearInterval(interval);
      }
    }, [selectedConversation, token, fetchMessages, fetchConversations]);

    // Initial fetch
    useEffect(() => {
      if (token) {
        fetchConversations();
      }
    }, [token, fetchConversations]);

    // Fetch users when search changes
    useEffect(() => {
      if (showNewChat) {
        fetchUsers();
      }
    }, [showNewChat, searchUser, fetchUsers]);

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

    const getOtherParticipant = (conv: Conversation) => {
      if (conv.participant1_id === user?.id) {
        return {
          name: conv.participant2_name,
          avatar: conv.participant2_avatar
        };
      }
      return {
        name: conv.participant1_name,
        avatar: conv.participant1_avatar
      };
    };

    return (
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar - Daftar Chat */}
        <div className="w-80 bg-white border-r flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">Pesan</h1>
              <Button
                size="sm"
                onClick={() => setShowNewChat(!showNewChat)}
                variant={showNewChat ? "secondary" : "default"}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Chat Baru
              </Button>
            </div>
            
            {showNewChat && (
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari pengguna..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="h-64 mt-2">
                  {users.length === 0 ? (
                    <p className="text-center text-gray-400 py-4">Tidak ada pengguna</p>
                  ) : (
                    <div className="space-y-1">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => startConversation(u)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition"
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-blue-500 text-white">
                              {getInitials(u.fullname || u.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-sm">{u.fullname || u.username}</p>
                            <p className="text-xs text-gray-400">{u.role}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Daftar Percakapan */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">Belum ada percakapan</p>
                <Button
                  variant="link"
                  onClick={() => setShowNewChat(true)}
                  className="mt-2"
                >
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
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="bg-white border-b p-4 flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {getInitials(getOtherParticipant(selectedConversation).name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{getOtherParticipant(selectedConversation).name}</p>
                <p className="text-xs text-gray-400">Online</p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {isLoadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400">Belum ada pesan</p>
                    <p className="text-xs text-gray-400">Kirim pesan pertama Anda</p>
                  </div>
                ) : (
                  messages.slice().reverse().map((msg) => {
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
                          <p className="text-sm">{msg.message}</p>
                          <div className={`flex items-center gap-1 mt-1 text-xs ${
                            isMyMessage ? 'text-blue-100' : 'text-gray-400'
                          }`}>
                            <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: id })}</span>
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

            {/* Input */}
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
                />
                <Button onClick={sendMessage} disabled={isSending || !messageInput.trim()}>
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600">Pesan Anda</h2>
              <p className="text-gray-400 mt-2">Pilih percakapan atau mulai chat baru</p>
              <Button
                variant="outline"
                onClick={() => setShowNewChat(true)}
                className="mt-4"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Chat Baru
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }