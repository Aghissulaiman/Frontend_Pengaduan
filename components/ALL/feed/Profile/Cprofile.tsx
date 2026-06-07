'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import Link from 'next/link';

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
  joined_date: string;
}

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
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { token, user: currentUser, isLoading: authLoading } = useAuth();
  const username = params?.username as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        console.log('🔍 Fetching profile for:', username);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${username}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log('📦 Profile response:', data);
        
        if (data.success) {
          setProfile(data.data);
          setIsFollowing(data.data.is_following);
          setFollowersCount(data.data.followers_count);
        } else {
          console.error('Profile fetch failed:', data.message);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    const fetchUserPosts = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${username}/posts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log('📦 Posts response:', data);
        if (data.success) setPosts(data.data || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (token && username) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [token, username]);

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!token || !profile) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }
    
    setIsFollowLoading(true);
    try {
      const url = isFollowing 
        ? `${process.env.NEXT_PUBLIC_API_URL}/users/unfollow`
        : `${process.env.NEXT_PUBLIC_API_URL}/users/follow`;
      
      console.log('📤 Sending follow request:', url, { following_id: profile.id });
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ following_id: profile.id })
      });
      
      const data = await res.json();
      console.log('📥 Follow response:', data);
      
      if (data.success) {
        setIsFollowing(!isFollowing);
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
        toast.success(isFollowing ? 'Berhenti mengikuti' : 'Berhasil mengikuti');
      } else {
        toast.error(data.message || 'Gagal');
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getInitials = (name: string) => name?.charAt(0).toUpperCase() || 'U';

  // Debug log
  console.log('===== DEBUG INFO =====');
  console.log('currentUser:', currentUser?.username);
  console.log('profile username:', profile?.username);
  console.log('isOwnProfile:', currentUser?.username === username);
  console.log('isFollowing:', isFollowing);
  console.log('======================');

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Silakan login untuk melihat profil</p>
          <Link href="/auth/login">
            <Button>Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <p className="text-gray-400">User tidak ditemukan</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-white z-10 border-b border-gray-100">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-lg">{profile.fullname || profile.username}</h1>
          {isOwnProfile && (
            <Link href="/profile/edit">
              <button className="p-2 hover:bg-gray-100 rounded-full transition">
                <Settings className="w-5 h-5" />
              </button>
            </Link>
          )}
          {!isOwnProfile && (
            <div className="w-9" /> // Spacer for alignment
          )}
        </div>

        {/* Profile Info */}
        <div className="px-4 py-6">
          <div className="flex gap-6 items-start">
            {/* Avatar */}
            <Avatar className="w-20 h-20 md:w-28 md:h-28 shadow-sm">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                {getInitials(profile.fullname || profile.username)}
              </AvatarFallback>
            </Avatar>

            {/* Stats */}
            <div className="flex-1 flex justify-around items-center">
              <div className="text-center">
                <p className="font-bold text-lg">{formatNumber(profile.posts_count)}</p>
                <p className="text-xs text-gray-500">Postingan</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{formatNumber(followersCount)}</p>
                <p className="text-xs text-gray-500">Pengikut</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{formatNumber(profile.following_count)}</p>
                <p className="text-xs text-gray-500">Mengikuti</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-4">
            <p className="font-semibold text-base">{profile.fullname || profile.username}</p>
            {profile.bio && (
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{profile.bio}</p>
            )}
            {profile.province_name && (
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                <MapPin className="w-3 h-3" />
                {profile.province_name}
              </div>
            )}
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              Bergabung {new Date(profile.joined_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
            </div>
          </div>

          {/* Follow Button - HANYA UNTUK BUKAN PROFILE SENDIRI */}
          {!isOwnProfile && (
            <div className="mt-4">
              <button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className={`w-32 py-2 rounded-lg font-semibold text-sm transition ${
                  isFollowing 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
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
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-100">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition ${
              activeTab === 'posts' ? 'text-black border-t-2 border-black' : 'text-gray-400'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            POSTINGAN
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition ${
              activeTab === 'saved' ? 'text-black border-t-2 border-black' : 'text-gray-400'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            TERSIMPAN
          </button>
        </div>

        {/* Grid Posts */}
        {activeTab === 'posts' && (
          <div className="py-1">
            {posts.length === 0 ? (
              <div className="text-center py-20">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Belum ada postingan</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="aspect-square relative group cursor-pointer bg-gray-50"
                    onClick={() => {
                      setSelectedImage(post.photo || null);
                      setShowImageModal(true);
                    }}
                  >
                    {post.photo ? (
                      <>
                        <img
                          src={post.photo}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-6">
                          <div className="flex items-center gap-1 text-white">
                            <Heart className="w-5 h-5 fill-white" />
                            <span className="text-sm font-semibold">{formatNumber(post.likes_count)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-white">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm font-semibold">{formatNumber(post.comments_count)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Tab */}
        {activeTab === 'saved' && (
          <div className="text-center py-20">
            <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Simpan foto dan video</p>
            <p className="text-xs text-gray-400 mt-1">Hanya Anda yang bisa melihat yang telah disimpan</p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/95 border-0">
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center justify-center w-full h-[85vh]">
            {selectedImage && (
              <img src={selectedImage} alt="" className="max-w-full max-h-full object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}