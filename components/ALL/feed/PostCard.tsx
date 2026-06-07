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
  Image as ImageIcon
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
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
  investigation_result?: string;
  investigation_evidence?: string;
  completion_photo?: string;
  process_photo?: string;
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
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  let lastTap = 0;

  // Kumpulkan semua gambar dari berbagai sumber
  const getAllImages = (): string[] => {
    const images: string[] = [];
    
    if (post.photo && post.photo !== '') images.push(post.photo);
    
    if (post.investigation_evidence && post.investigation_evidence !== '') {
      try {
        const evidence = JSON.parse(post.investigation_evidence);
        if (Array.isArray(evidence)) images.push(...evidence);
        else if (typeof evidence === 'string') images.push(evidence);
      } catch {
        if (post.investigation_evidence) images.push(post.investigation_evidence);
      }
    }
    
    if (post.process_photo && post.process_photo !== '') {
      try {
        const process = JSON.parse(post.process_photo);
        if (Array.isArray(process)) images.push(...process);
        else if (typeof process === 'string') images.push(process);
      } catch {
        if (post.process_photo) images.push(post.process_photo);
      }
    }
    
    if (post.completion_photo && post.completion_photo !== '') {
      try {
        const completion = JSON.parse(post.completion_photo);
        if (Array.isArray(completion)) images.push(...completion);
        else if (typeof completion === 'string') images.push(completion);
      } catch {
        if (post.completion_photo) images.push(post.completion_photo);
      }
    }
    
    return [...new Set(images.filter(img => img && img !== ''))];
  };

  const images = getAllImages();

  useEffect(() => {
    fetchCommentsPreview();
  }, []);

  // Load image dimensions
  useEffect(() => {
    if (images.length > 0 && imageRef.current) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = images[currentImageIndex];
    }
  }, [images, currentImageIndex]);

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

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending_governor: { label: 'Menunggu', color: 'bg-yellow-500', icon: ClockIcon },
    investigation_assigned: { label: 'Investigasi', color: 'bg-blue-500', icon: AlertCircle },
    investigation_done: { label: 'Investigasi Selesai', color: 'bg-purple-500', icon: CheckCircle },
    governor_processing: { label: 'Diproses', color: 'bg-orange-500', icon: ClockIcon },
    process_report_submitted: { label: 'Laporan Dikirim', color: 'bg-cyan-500', icon: ClockIcon },
    process_report_verified: { label: 'Proses Selesai', color: 'bg-blue-500', icon: CheckCircle },
    completion_report_submitted: { label: 'Laporan Akhir', color: 'bg-indigo-500', icon: ClockIcon },
    completion_report_verified: { label: 'Laporan Akhir', color: 'bg-purple-500', icon: CheckCircle },
    completed: { label: 'Selesai', color: 'bg-green-500', icon: CheckCircle },
    rejected: { label: 'Ditolak', color: 'bg-red-500', icon: X },
  };
  const status = statusConfig[post.status] || { label: post.status, color: 'bg-gray-500', icon: ClockIcon };

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Calculate image container style based on aspect ratio
  const getImageContainerStyle = () => {
    if (imageDimensions.width === 0 || imageDimensions.height === 0) {
      return { aspectRatio: '1/1' };
    }
    const aspectRatio = imageDimensions.width / imageDimensions.height;
    if (aspectRatio > 1.5) {
      return { aspectRatio: '16/9' }; // Landscape
    } else if (aspectRatio < 0.67) {
      return { aspectRatio: '4/5' }; // Portrait
    }
    return { aspectRatio: '1/1' }; // Square
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden shadow-sm hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <Link href={`/profile/${post.user_name}`} className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                {post.user_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-semibold text-gray-900 truncate">{post.user_fullname || post.user_name}</p>
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium text-white ${status.color} flex-shrink-0`}>
                  {status.icon && <status.icon className="w-2 h-2" />}
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{post.location_detail?.substring(0, 40)}</span>
                <span>•</span>
                <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="whitespace-nowrap">{formatTime(post.created_at)}</span>
              </div>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full flex-shrink-0">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleShare} className="text-xs gap-2">
                <Share2 className="w-3 h-3" /> Bagikan
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2 text-red-600">
                <Flag className="w-3 h-3" /> Laporkan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Image Slider - Responsive sizing */}
        {images.length > 0 ? (
          <div 
            className="relative bg-black w-full overflow-hidden"
            style={getImageContainerStyle()}
            onDoubleClick={handleDoubleTap}
          >
            <div 
              className="relative w-full h-full cursor-pointer"
              onClick={() => setShowImageModal(true)}
            >
              <img 
                ref={imageRef}
                src={images[currentImageIndex]} 
                alt="Post"
                className="w-full h-full object-contain bg-black"
                loading="lazy"
              />
              <AnimatePresence>
                {likeAnimation && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <Heart className="w-16 h-16 fill-white text-white opacity-90" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {images.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1.5 hover:bg-black/70 transition shadow-md"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1.5 hover:bg-black/70 transition shadow-md"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                      className={`h-1 rounded-full transition-all ${
                        idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-gray-100 w-full aspect-square flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Actions */}
        <div className="px-3 pt-2 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={handleLike} className="transform active:scale-90 transition">
                <Heart className={`w-5 h-5 transition ${liked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </button>
              <button onClick={() => setIsCommentModalOpen(true)} className="transform active:scale-90 transition">
                <MessageCircle className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={handleShare} className="transform active:scale-90 transition">
                <Send className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <button onClick={handleSave} className="transform active:scale-90 transition">
              {saved ? <BookmarkCheck className="w-5 h-5 text-gray-800" /> : <Bookmark className="w-5 h-5 text-gray-600" />}
            </button>
          </div>

          {likesCount > 0 && (
            <p className="mt-1 text-xs font-semibold text-gray-900">{formatLikes(likesCount)} suka</p>
          )}

          {/* Caption */}
          <div className="mt-0.5">
            <p className="text-xs">
              <Link href={`/profile/${post.user_name}`} className="font-semibold text-gray-900 mr-1.5">
                {post.user_fullname || post.user_name}
              </Link>
              <span className="text-gray-700 break-words">{post.description}</span>
            </p>
            {post.investigation_result && (
              <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-1.5 rounded break-words">
                <span className="font-medium">Hasil Investigasi:</span> {post.investigation_result}
              </p>
            )}
            {post.work_details && (
              <p className="text-xs text-gray-500 mt-1 break-words">📋 Pekerjaan: {post.work_details}</p>
            )}
          </div>

          <Link href={`/complaints/${post.id}`} className="text-[9px] text-gray-400 mt-1 inline-block">
            📍 {post.tracking_code}
          </Link>

          {/* Comments Preview */}
          {comments.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {comments.slice(0, 1).map(c => (
                <div key={c.id} className="text-xs">
                  <span className="font-semibold mr-1 text-gray-900 truncate max-w-[100px] inline-block">{c.user_fullname || c.user_name}</span>
                  <span className="text-gray-600 break-words">
                    {c.text.length > 60 ? c.text.substring(0, 60) + '...' : c.text}
                  </span>
                </div>
              ))}
              {post.comments_count > 1 && (
                <button onClick={() => setIsCommentModalOpen(true)} className="text-[10px] text-gray-400">
                  Lihat {post.comments_count} komentar
                </button>
              )}
            </div>
          )}

          {/* Comment Input */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-[8px]">A</AvatarFallback>
            </Avatar>
            <Textarea 
              placeholder="Tulis komentar..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="flex-1 min-h-0 h-7 text-xs py-1 resize-none border-0 focus:ring-0 px-0 bg-transparent"
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleCommentSubmit())}
            />
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleCommentSubmit} 
              disabled={!comment.trim()} 
              className="text-blue-500 font-semibold text-xs px-2 h-7 flex-shrink-0"
            >
              Kirim
            </Button>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
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

      {/* Image Modal Fullscreen */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0">
          <VisuallyHidden.Root>
            <DialogTitle>Preview Gambar</DialogTitle>
          </VisuallyHidden.Root>
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center justify-center w-full h-[85vh]">
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={images[currentImageIndex]} 
                alt="Full size" 
                className="max-w-full max-h-full object-contain"
              />
              {images.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 w-1.5'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-white/50 text-xs">{currentImageIndex + 1} / {images.length}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}