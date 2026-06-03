'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Heart, MessageCircle, Send, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface Comment {
  id: number;
  content: string;
  text?: string; // tambahin fallback
  comment?: string; // tambahin fallback
  created_at: string;
  user_name: string;
  user_fullname: string;
  user_avatar?: string;
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  postImage?: string;
  postDescription: string;
  postUserName: string;
  postUserFullname: string;
  postUserAvatar?: string;
}

export function CommentModal({
  isOpen,
  onClose,
  postId,
  postImage,
  postDescription,
  postUserName,
  postUserFullname,
  postUserAvatar,
}: CommentModalProps) {
  const { token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fungsi untuk mendapatkan teks komentar dari berbagai format
  const getCommentContent = (comment: any): string => {
    return comment.content || comment.text || comment.comment || '';
  };

  const fetchComments = async (reset = false) => {
    if (!token) return;
    
    const currentPage = reset ? 1 : page;
    
    setIsLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/feed/comments/${postId}?page=${currentPage}&limit=20`;
      
      console.log('Fetching comments from:', url);
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      console.log('Comments response:', data);
      
      if (data.success) {
        let newComments: Comment[] = [];
        
        // Handle berbagai format response
        if (data.data && Array.isArray(data.data.comments)) {
          newComments = data.data.comments;
        } else if (data.data && Array.isArray(data.data)) {
          newComments = data.data;
        } else if (Array.isArray(data.data)) {
          newComments = data.data;
        } else if (data.comments && Array.isArray(data.comments)) {
          newComments = data.comments;
        } else {
          newComments = [];
        }
        
        // Mapping ke format yang konsisten
        const mappedComments = newComments.map((c: any) => ({
          id: c.id,
          content: getCommentContent(c),
          created_at: c.created_at,
          user_name: c.user_name || c.username || 'user',
          user_fullname: c.user_fullname || c.fullname || c.user_name || 'User',
          user_avatar: c.user_avatar || c.avatar,
        }));
        
        console.log('Mapped comments:', mappedComments);
        
        if (reset) {
          setComments(mappedComments);
          setPage(1);
        } else {
          setComments(prev => [...prev, ...mappedComments]);
        }
        setHasMore(newComments.length === 20);
        if (!reset) setPage(prev => prev + 1);
      } else {
        console.error('Failed to fetch comments:', data.message);
        toast.error(data.message || 'Gagal memuat komentar');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Gagal memuat komentar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !token) return;
    
    setIsSending(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/feed/comment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            post_id: postId, 
            text: newComment,
            content: newComment 
          }),
        }
      );
      const data = await res.json();
      console.log('Send comment response:', data);
      
      if (data.success) {
        toast.success('Komentar terkirim');
        setNewComment('');
        // Refresh comments
        fetchComments(true);
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
        textareaRef.current?.focus();
      } else {
        toast.error(data.message || 'Gagal mengirim komentar');
      }
    } catch (error) {
      console.error('Error sending comment:', error);
      toast.error('Gagal mengirim komentar');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    if (bottom && hasMore && !isLoading && comments.length > 0) {
      fetchComments();
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
      fetchComments(true);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, postId]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'baru saja';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff} detik lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
    return date.toLocaleDateString('id-ID');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all hover:scale-105"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT SIDE - Image */}
        <div className="hidden md:flex md:w-1/2 bg-black/90 items-center justify-center relative">
          {postImage ? (
            <div className="relative w-full h-full">
              <img
                src={postImage}
                alt="Post image"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="text-center text-white p-8">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-12 h-12 opacity-50" />
              </div>
              <p className="text-gray-400">Tidak ada gambar</p>
            </div>
          )}
        </div>

        {/* RIGHT SIDE - Comments */}
        <div className="flex flex-col w-full md:w-1/2 bg-white">
          <div className="flex items-center gap-3 p-4 border-b bg-white sticky top-0 z-10">
            <Avatar className="w-10 h-10 ring-2 ring-gray-100">
              <AvatarImage src={postUserAvatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {postUserFullname?.charAt(0) || postUserName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-gray-900">{postUserFullname || postUserName}</p>
              <p className="text-xs text-gray-400">@{postUserName}</p>
            </div>
          </div>

          <div className="flex gap-3 p-4 border-b bg-gray-50">
            <Avatar className="w-8 h-8">
              <AvatarImage src={postUserAvatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                {postUserFullname?.charAt(0) || postUserName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm text-gray-800">
                <span className="font-semibold text-gray-900 mr-2">{postUserFullname || postUserName}</span>
                {postDescription}
              </p>
            </div>
          </div>

          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-white"
          >
            {isLoading && comments.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm">Belum ada komentar</p>
                <p className="text-xs text-gray-300 mt-1">Jadilah yang pertama berkomentar</p>
              </div>
            ) : (
              <>
                {comments.map((comment, index) => {
                  const commentText = comment.content || comment.text || '';
                  console.log('Rendering comment:', comment.id, commentText);
                  return (
                    <div key={comment.id || index} className="flex gap-3 group">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={comment.user_avatar} />
                        <AvatarFallback className="bg-gray-400 text-white text-xs">
                          {comment.user_fullname?.charAt(0) || comment.user_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-2xl px-3 py-2">
                          <p className="text-sm">
                            <span className="font-semibold text-gray-900 mr-2">
                              {comment.user_fullname || comment.user_name}
                            </span>
                            <span className="text-gray-700 break-words">
                              {commentText || '(Teks tidak tersedia)'}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mt-1 ml-2">
                          <p className="text-[10px] text-gray-400">{formatTime(comment.created_at)}</p>
                          <button className="text-[10px] text-gray-400 hover:text-gray-600 hidden group-hover:inline">
                            Balas
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {isLoading && comments.length > 0 && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  </div>
                )}
                
                {!hasMore && comments.length > 0 && (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-400">~ Semua komentar telah ditampilkan ~</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t bg-white p-4 sticky bottom-0">
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white text-xs">
                  ME
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tulis komentar..."
                  className="min-h-[40px] max-h-[100px] resize-none pr-12 rounded-xl bg-gray-50 border-0 focus:ring-1 focus:ring-blue-500"
                  rows={1}
                />
                <button
                  onClick={handleSendComment}
                  disabled={!newComment.trim() || isSending}
                  className="absolute right-2 bottom-2 text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:text-blue-600 transition-all"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}