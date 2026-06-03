'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  BookmarkCheck,
  MoreHorizontal,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  Flag,
  CheckCircle,
  Clock as ClockIcon,
  AlertCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

// IMPORT MODAL KOMPONEN BARU
import { CommentModal } from './ComenModal';

interface Post {
  id: number;
  tracking_code: string;
  description: string;
  location_detail: string;
  status: string;
  created_at: string;
  user_name: string;
  user_fullname: string;
  user_avatar?: string;
  photo?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved: boolean;
  work_details?: string;
  process_notes?: string;
}

interface Comment {
  id: number;
  user_name: string;
  user_fullname: string;
  text: string;
  created_at: string;
}

interface PostCardProps {
  post: Post;
  onLike?: (postId: number, isLiked: boolean) => void;
  onSave?: (postId: number, isSaved: boolean) => void;
  onComment?: (postId: number, comment: string) => void;
}

export function PostCard({ post, onLike, onSave, onComment }: PostCardProps) {
  const [liked, setLiked] = useState(post.is_liked);
  const [saved, setSaved] = useState(post.is_saved);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false); // BARU: untuk modal
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  let lastTap = 0;

  const images = post.photo ? [post.photo] : [];

  // HANYA FETCH COMMENTS UNTUK PREVIEW (3 komentar terakhir)
  useEffect(() => {
    fetchCommentsPreview();
  }, []);

  const fetchCommentsPreview = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feed/comments/${post.id}?limit=3`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setComments(data.data.slice(0, 3));
    } catch (error) {}
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    setLikeAnimation(true);
    setTimeout(() => setLikeAnimation(false), 500);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feed/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ post_id: post.id })
      });
      const data = await res.json();
      if (data.success) {
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
        onLike?.(post.id, !liked);
      }
    } catch (error) {}
    finally { setIsLiking(false); }
  };

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    if (lastTap && (now - lastTap) < 300) {
      handleLike();
    }
    lastTap = now;
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feed/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ post_id: post.id })
      });
      const data = await res.json();
      if (data.success) {
        setSaved(!saved);
        onSave?.(post.id, !saved);
        toast.success(saved ? 'Dihapus dari tersimpan' : 'Disimpan');
      }
    } catch (error) {}
    finally { setIsSaving(false); }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feed/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ post_id: post.id, text: comment })
      });
      const data = await res.json();
      if (data.success) {
        setComments([{ id: Date.now(), user_name: 'current_user', user_fullname: 'Anda', text: comment, created_at: new Date().toISOString() }, ...comments.slice(0, 2)]);
        setComment('');
        toast.success('Komentar ditambahkan');
        onComment?.(post.id, comment);
      }
    } catch (error) {}
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/complaints/${post.id}`;
    if (navigator.share) {
      await navigator.share({ title: `Pengaduan ${post.tracking_code}`, text: post.description, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link disalin');
    }
  };

  const formatTime = (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
  const formatLikes = (count: number) => count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count.toString();

  const statusConfig = {
    completed: { label: 'Selesai', color: 'bg-emerald-500', icon: CheckCircle, gradient: 'from-emerald-500 to-teal-500' },
    process_report_verified: { label: 'Proses Selesai', color: 'bg-blue-500', icon: ClockIcon, gradient: 'from-blue-500 to-cyan-500' },
    completion_report_verified: { label: 'Laporan Akhir', color: 'bg-violet-500', icon: CheckCircle, gradient: 'from-violet-500 to-purple-500' },
    investigation_done: { label: 'Investigasi', color: 'bg-amber-500', icon: AlertCircle, gradient: 'from-amber-500 to-orange-500' },
  };
  const status = statusConfig[post.status as keyof typeof statusConfig] || { label: 'Diproses', color: 'bg-gray-500', icon: ClockIcon, gradient: 'from-gray-500 to-gray-600' };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border-0 mb-5 overflow-hidden shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <Link href={`/profile/${post.user_name}`} className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-pulse" style={{ opacity: 0.3 }} />
              <Avatar className="w-10 h-10 ring-2 ring-white shadow-md">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold">
                  {post.user_name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-gray-900">{post.user_fullname || post.user_name}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold text-white bg-gradient-to-r ${status.gradient}`}>
                  <status.icon className="w-2.5 h-2.5" />
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[180px]">{post.location_detail?.substring(0, 35)}</span>
                <span>•</span>
                <Clock className="w-3 h-3" />
                <span>{formatTime(post.created_at)}</span>
              </div>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem onClick={handleShare} className="cursor-pointer gap-2">
                <Share2 className="w-4 h-4" /> Bagikan
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2 text-red-600">
                <Flag className="w-4 h-4" /> Laporkan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Image */}
        {images.length > 0 ? (
          <div 
            ref={imageRef}
            className="relative bg-black/5 cursor-pointer"
            onDoubleClick={handleDoubleTap}
            onClick={() => setShowImageModal(true)} // Tambah buka modal gambar
          >
            <div className="relative aspect-square">
              <img 
                src={images[currentImageIndex]} 
                alt=""
                className="w-full h-full object-cover"
              />
              <AnimatePresence>
                {likeAnimation && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <Heart className="w-20 h-20 fill-white text-white opacity-90" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-lg hover:scale-110 transition">
                  <ChevronLeft className="w-5 h-5 text-gray-800" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev + 1) % images.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-lg hover:scale-110 transition">
                  <ChevronRight className="w-5 h-5 text-gray-800" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, idx) => (
                    <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }} className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-5' : 'bg-white/50 w-1.5'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 aspect-square flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-gray-400 text-sm">Belum ada gambar</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <button onClick={handleLike} className="transform active:scale-90 transition">
                <motion.div animate={liked ? { scale: [1, 1.2, 1] } : {}}>
                  <Heart className={`w-7 h-7 transition ${liked ? 'fill-red-500 text-red-500' : 'text-gray-700 hover:text-red-500'}`} />
                </motion.div>
              </button>
              {/* UBAH: BUKA MODAL KOMENTAR, BUKAN TOGGLE COMMENTS */}
              <button onClick={() => setIsCommentModalOpen(true)} className="transform active:scale-90 transition">
                <MessageCircle className="w-7 h-7 text-gray-700 hover:text-gray-500" />
              </button>
              <button onClick={handleShare} className="transform active:scale-90 transition">
                <Send className="w-7 h-7 text-gray-700 hover:text-gray-500" />
              </button>
            </div>
            <button onClick={handleSave} className="transform active:scale-90 transition">
              {saved ? <BookmarkCheck className="w-7 h-7 text-gray-900 fill-gray-900" /> : <Bookmark className="w-7 h-7 text-gray-700" />}
            </button>
          </div>

          {likesCount > 0 && (
            <p className="mt-2 text-sm font-semibold text-gray-900">{formatLikes(likesCount)} suka</p>
          )}

          <div className="mt-1">
            <p className="text-sm">
              <Link href={`/profile/${post.user_name}`} className="font-bold text-gray-900 mr-2">{post.user_fullname || post.user_name}</Link>
              <span className="text-gray-800">{post.description}</span>
            </p>
            {post.work_details && (
              <p className="text-xs text-gray-500 mt-1">📋 {post.work_details}</p>
            )}
          </div>

          <Link href={`/complaints/${post.id}`} className="text-[11px] text-gray-400 mt-1 inline-block">
            📍 Kode: {post.tracking_code}
          </Link>

          {/* PREVIEW KOMENTAR - hanya tampilkan 2 komentar terakhir */}
          {comments.length > 0 && (
            <div className="mt-2 space-y-1">
              {comments.slice(0, 2).map(c => (
                <div key={c.id} className="text-sm">
                  <span className="font-bold mr-2 text-gray-900">{c.user_fullname || c.user_name}</span>
                  <span className="text-gray-600">{c.text.length > 60 ? c.text.substring(0, 60) + '...' : c.text}</span>
                </div>
              ))}
              {post.comments_count > 2 && (
                <button onClick={() => setIsCommentModalOpen(true)} className="text-xs text-gray-400 mt-1">
                  Lihat {post.comments_count - 2} komentar lainnya
                </button>
              )}
            </div>
          )}

          {/* INPUT KOMENTAR SEDERHANA (tetap ada untuk quick comment) */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t">
            <Avatar className="w-7 h-7">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-[10px]">A</AvatarFallback>
            </Avatar>
            <Textarea 
              placeholder="Tulis komentar..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="flex-1 min-h-0 h-8 text-sm py-1.5 resize-none border-0 focus:ring-0 px-0"
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleCommentSubmit())}
            />
            <Button size="sm" variant="ghost" onClick={handleCommentSubmit} disabled={!comment.trim()} className="text-blue-500 font-bold text-sm px-3">
              Posting
            </Button>
          </div>
        </div>
      </motion.div>

      {/* MODAL KOMENTAR INSTAGRAM-STYLE */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        postId={post.id}
        postImage={images[0]}
        postDescription={post.description}
        postUserName={post.user_name}
        postUserFullname={post.user_fullname || post.user_name}
        postUserAvatar={post.user_avatar}
      />

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/95 border-0">
          <button onClick={() => setShowImageModal(false)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70">
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center justify-center w-full h-[85vh]">
            {images.length > 0 && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img src={images[currentImageIndex]} alt="" className="max-w-full max-h-full object-contain" />
                {images.length > 1 && (
                  <>
                    <button onClick={() => setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length)} className="absolute left-4 bg-black/50 rounded-full p-2 hover:bg-black/70"><ChevronLeft className="w-6 h-6 text-white" /></button>
                    <button onClick={() => setCurrentImageIndex(prev => (prev + 1) % images.length)} className="absolute right-4 bg-black/50 rounded-full p-2 hover:bg-black/70"><ChevronRight className="w-6 h-6 text-white" /></button>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}