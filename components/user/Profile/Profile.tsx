// app/profile/[username]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  MapPin,
  Calendar,
  UserPlus,
  UserCheck,
  Grid3X3,
  Bookmark,
  Heart,
  MessageCircle,
  ArrowLeft,
  Settings,
  Image as ImageIcon,
  X,
  FileText,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface UserProfile {
  id: number;
  username: string;
  fullname: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: string;
  province_name?: string;
  is_following: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
}

interface Complaint {
  id: number;
  tracking_code: string;
  description: string;
  location_detail: string;
  status: string;
  status_text: string;
  created_at: string;
  user_name: string;
  user_fullname: string;
  user_avatar?: string;
  photo?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved: boolean;
  category_name: string;
}

interface Comment {
  id: number;
  text: string;
  created_at: string;
  user_name: string;
  user_fullname: string;
  user_avatar?: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { token, user: currentUser } = useAuth();
  const username = params?.username as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  
  // Modal state
  const [selectedPost, setSelectedPost] = useState<Complaint | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${username}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
          setIsFollowing(data.data.is_following);
          setFollowersCount(data.data.followers_count);
        }
      } catch (error) {
        console.error(error);
      }
    };
    
    const fetchPosts = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${username}/posts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setComplaints(data.data || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (token && username) {
      fetchProfile();
      fetchPosts();
    }
  }, [token, username]);

  // Fetch comments when modal opens
  useEffect(() => {
    const fetchComments = async () => {
      if (!token || !selectedPost) return;
      
      setIsLoadingComments(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feed/comments/${selectedPost.id}`, {
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
        setIsLoadingComments(false);
      }
    };
    
    if (showModal && selectedPost) {
      fetchComments();
    }
  }, [showModal, selectedPost, token]);

  // Scroll to bottom when comments change
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const handleFollow = async () => {
    if (!token || !profile) return;
    if (profile.id === currentUser?.id) {
      toast.error('Tidak bisa mengikuti diri sendiri');
      return;
    }
    
    setIsFollowLoading(true);
    try {
      const url = isFollowing ? '/users/unfollow' : '/users/follow';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ following_id: profile.id })
      });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(!isFollowing);
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
        toast.success(isFollowing ? 'Berhenti mengikuti' : 'Berhasil mengikuti');
      }
    } catch (error) {
      toast.error('Gagal');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleLike = async (postId: number, isLiked: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feed/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ post_id: postId })
      });
      const data = await res.json();
      if (data.success) {
        setComplaints(prev => prev.map(post =>
          post.id === postId
            ? { ...post, is_liked: !isLiked, likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1 }
            : post
        ));
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => prev ? {
            ...prev,
            is_liked: !isLiked,
            likes_count: isLiked ? prev.likes_count - 1 : prev.likes_count + 1
          } : null);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendComment = async () => {
    if (!token || !selectedPost || !newComment.trim()) return;
    
    setIsSendingComment(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feed/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ post_id: selectedPost.id, text: newComment })
      });
      const data = await res.json();
      if (data.success) {
        const newCommentObj: Comment = {
          id: data.data?.id || Date.now(),
          text: newComment,
          created_at: new Date().toISOString(),
          user_name: currentUser?.username || 'user',
          user_fullname: currentUser?.fullname || currentUser?.username || 'User',
        };
        setComments(prev => [...prev, newCommentObj]);
        setNewComment('');
        setSelectedPost(prev => prev ? {
          ...prev,
          comments_count: prev.comments_count + 1
        } : null);
        setComplaints(prev => prev.map(post =>
          post.id === selectedPost.id
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        ));
        toast.success('Komentar terkirim');
      } else {
        toast.error(data.message || 'Gagal mengirim komentar');
      }
    } catch (error) {
      toast.error('Gagal mengirim komentar');
    } finally {
      setIsSendingComment(false);
    }
  };

  const openModal = (post: Complaint) => {
    setSelectedPost(post);
    setShowModal(true);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: id });
  };

  const getInitials = (name: string) => name?.charAt(0).toUpperCase() || 'U';

  const isOwnProfile = currentUser?.username === username;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-muted-foreground">User tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg text-foreground">{profile.username}</h1>
          {isOwnProfile ? (
            <Link href="/profile/edit">
              <button className="p-1">
                <Settings className="w-5 h-5 text-foreground" />
              </button>
            </Link>
          ) : (
            <div className="w-8" />
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="pt-6 pb-4">
          <div className="flex gap-6 items-center mb-6">
            <Avatar className="w-24 h-24 ring-4 ring-primary/20">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-3xl">
                {getInitials(profile.fullname || profile.username)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 flex justify-around">
              <div className="text-center">
                <p className="font-bold text-xl text-foreground">{formatNumber(complaints.length)}</p>
                <p className="text-xs text-muted-foreground">postingan</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-xl text-foreground">{formatNumber(followersCount)}</p>
                <p className="text-xs text-muted-foreground">pengikut</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-xl text-foreground">{formatNumber(profile.following_count)}</p>
                <p className="text-xs text-muted-foreground">mengikuti</p>
              </div>
            </div>
          </div>

          <div className="mb-5">
            <p className="font-semibold text-base text-foreground">{profile.fullname}</p>
            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{profile.bio}</p>
            )}
            {profile.province_name && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {profile.province_name}
              </div>
            )}
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              Bergabung {new Date(profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
            </div>
          </div>

          {!isOwnProfile && (
            <button
              onClick={handleFollow}
              disabled={isFollowLoading}
              className={`w-full py-2 rounded-lg font-semibold text-sm transition ${
                isFollowing 
                  ? 'bg-secondary text-secondary-foreground border border-border' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isFollowLoading ? (
                <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
              ) : isFollowing ? (
                'Mengikuti'
              ) : (
                'Ikuti'
              )}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-border mt-4">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition ${
              activeTab === 'posts' ? 'text-foreground border-t-2 border-primary' : 'text-muted-foreground'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            POSTINGAN
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition ${
              activeTab === 'saved' ? 'text-foreground border-t-2 border-primary' : 'text-muted-foreground'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            TERSIMPAN
          </button>
        </div>

        {/* Grid Posts */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-3 gap-1 mt-1">
            {complaints.length === 0 ? (
              <div className="col-span-3 text-center py-20">
                <ImageIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">Belum ada pengaduan</p>
              </div>
            ) : (
              complaints.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square relative group cursor-pointer bg-muted"
                  onClick={() => openModal(post)}
                >
                  {post.photo ? (
                    <>
                      <img
                        src={post.photo}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-6">
                        <div className="flex items-center gap-1 text-white">
                          <Heart className="w-5 h-5" />
                          <span className="text-sm font-semibold">{formatNumber(post.likes_count)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-white">
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm font-semibold">{formatNumber(post.comments_count)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-muted flex flex-col items-center justify-center p-4">
                      <FileText className="w-8 h-8 text-muted-foreground/50 mb-2" />
                      <p className="text-xs text-muted-foreground text-center line-clamp-3">{post.description}</p>
                      <Badge className="mt-2 text-[10px]">{post.status_text}</Badge>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal - Image + Comments (Instagram Style) */}
      {showModal && selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-xl overflow-hidden flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side - Image */}
            <div className="hidden md:flex md:w-1/2 bg-black items-center justify-center">
              {selectedPost.photo ? (
                <img
                  src={selectedPost.photo}
                  alt="Post"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center text-white p-8">
                  <FileText className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>Tidak ada gambar</p>
                </div>
              )}
            </div>

            {/* Right Side - Comments */}
            <div className="flex flex-col w-full md:w-1/2 bg-white">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                    {getInitials(profile.fullname || profile.username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{profile.fullname || profile.username}</p>
                  <p className="text-xs text-gray-400">@{profile.username}</p>
                </div>
              </div>

              {/* Caption */}
              <div className="flex gap-3 p-4 border-b bg-gray-50">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs">
                    {getInitials(profile.fullname || profile.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold mr-2">{profile.username}</span>
                    {selectedPost.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatTime(selectedPost.created_at)}</p>
                </div>
              </div>

              {/* Comments List - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingComments ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                <div ref={commentsEndRef} />
              </div>

              {/* Actions & Add Comment */}
              <div className="border-t">
                <div className="p-3">
                  <div className="flex gap-4 mb-3">
                    <button onClick={() => handleLike(selectedPost.id, selectedPost.is_liked)}>
                      <Heart className={`w-6 h-6 ${selectedPost.is_liked ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
                    </button>
                    <button>
                      <MessageCircle className="w-6 h-6 text-foreground" />
                    </button>
                  </div>
                  <p className="font-semibold text-sm">{formatNumber(selectedPost.likes_count)} suka</p>
                  <p className="text-xs text-gray-400 mt-2">{formatTime(selectedPost.created_at)}</p>
                </div>

                {/* Add Comment Input */}
                <div className="flex items-center gap-2 p-3 border-t">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gray-400 text-white text-xs">
                      {currentUser?.fullname?.charAt(0) || currentUser?.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Tulis komentar..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) {
                          e.preventDefault();
                          handleSendComment();
                        }
                      }}
                      className="w-full px-3 py-2 text-sm bg-gray-100 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={handleSendComment}
                      disabled={!newComment.trim() || isSendingComment}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-primary disabled:opacity-50"
                    >
                      {isSendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}