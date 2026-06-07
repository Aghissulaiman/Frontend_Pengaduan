'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Heart, Send, Loader2, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface Comment {
  id: number;
  text: string;
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
  onLike?: () => void;
  isLiked?: boolean;
  likesCount?: number;
  onCommentAdded?: () => void;
}

export function DetailPost({
  isOpen,
  onClose,
  postId,
  postImage,
  postDescription,
  postUserName,
  postUserFullname,
  postUserAvatar,
  onLike,
  isLiked = false,
  likesCount = 0,
  onCommentAdded,
}: CommentModalProps) {
  const { token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchComments = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feed/comments/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        let commentsList = [];
        if (data.data?.comments) commentsList = data.data.comments;
        else if (Array.isArray(data.data)) commentsList = data.data;
        else commentsList = [];
        
        setComments(commentsList.map((c: any) => ({
          id: c.id,
          text: c.text || c.content || c.comment || '',
          created_at: c.created_at,
          user_name: c.user_name || c.username,
          user_fullname: c.user_fullname || c.fullname,
          user_avatar: c.user_avatar || c.avatar,
        })));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendComment = async () => {
    if (!newComment.trim() || !token) return;
    setIsSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feed/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ post_id: postId, text: newComment })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Komentar terkirim');
        setNewComment('');
        fetchComments();
        if (onCommentAdded) onCommentAdded();
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      } else {
        toast.error(data.message || 'Gagal mengirim komentar');
      }
    } catch (error) {
      toast.error('Gagal mengirim komentar');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendComment();
    }
  };

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);

  if (!isOpen) return null;

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-xl overflow-hidden flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70">
          <X className="w-5 h-5" />
        </button>

        {/* Left - Image */}
        <div className="hidden md:flex md:w-1/2 bg-black items-center justify-center">
          {postImage ? (
            <img src={postImage} alt="Post" className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="text-center text-white">
              <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p>Tidak ada gambar</p>
            </div>
          )}
        </div>

        {/* Right - Comments */}
        <div className="flex flex-col w-full md:w-1/2 bg-white">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b">
            <Avatar className="w-10 h-10">
              <AvatarImage src={postUserAvatar} />
              <AvatarFallback className="bg-blue-500 text-white">
                {postUserFullname?.charAt(0) || postUserName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{postUserFullname || postUserName}</p>
              <p className="text-xs text-gray-400">@{postUserName}</p>
            </div>
          </div>

          {/* Caption */}
          <div className="flex gap-3 p-4 border-b bg-gray-50">
            <Avatar className="w-8 h-8">
              <AvatarImage src={postUserAvatar} />
              <AvatarFallback className="bg-blue-500 text-white text-xs">
                {postUserFullname?.charAt(0) || postUserName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold mr-2">{postUserFullname || postUserName}</span>
                {postDescription}
              </p>
            </div>
          </div>

          {/* Comments List */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Belum ada komentar</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user_avatar} />
                    <AvatarFallback className="bg-gray-400 text-white text-xs">
                      {comment.user_fullname?.charAt(0) || comment.user_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold mr-2">{comment.user_fullname || comment.user_name}</span>
                      {comment.text}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{formatTime(comment.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="border-t p-3">
            <div className="flex gap-4 mb-3">
              <button onClick={onLike}>
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button>
                <MessageCircle className="w-6 h-6" />
              </button>
            </div>
            <p className="font-semibold text-sm">{likesCount} suka</p>
          </div>

          {/* Add Comment */}
          <div className="flex items-center gap-2 p-3 border-t">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-400 text-white text-xs">ME</AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Tulis komentar..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 text-sm bg-gray-100 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={sendComment}
                disabled={!newComment.trim() || isSending}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}