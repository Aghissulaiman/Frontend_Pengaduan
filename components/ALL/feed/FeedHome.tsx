'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { PostCard } from './PostCard';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Compass, 
  Globe, 
  MapPin, 
  Clock,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

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
  province_id?: number;
  category_id?: number;
  category_name?: string;
}

interface Category {
  id: number;
  name: string;
}

export function FeedHome() {
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  
  // Filters
  const [filterScope, setFilterScope] = useState<'all' | 'province'>('all');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  
  const isFetching = useRef(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/categories`);
        const data = await res.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch posts function
  const fetchPosts = async (reset = false) => {
    if (!token || isFetching.current) return;
    
    const currentPage = reset ? 1 : page;
    
    isFetching.current = true;
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      
      if (filterScope === 'province' && user?.province_id) {
        params.append('province_id', user.province_id.toString());
      }
      
      if (selectedCategory) {
        params.append('category_id', selectedCategory.toString());
      }
      
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      
      const url = `${process.env.NEXT_PUBLIC_API_URL}/feed?${params.toString()}`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      
      if (data.success) {
        let newPosts = [];
        if (data.data && Array.isArray(data.data.posts)) {
          newPosts = data.data.posts;
        } else if (Array.isArray(data.data)) {
          newPosts = data.data;
        } else {
          newPosts = [];
        }
        
        const newPostsArray = newPosts || [];
        
        if (reset) {
          setPosts(newPostsArray);
          setPage(1);
        } else {
          setPosts(prev => [...prev, ...newPostsArray]);
        }
        
        setHasMore(newPostsArray.length === 10);
        if (!reset) setPage(prev => prev + 1);
      } else {
        toast.error(data.message || 'Gagal memuat feed');
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat feed');
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  };

  // Reset and fetch when filters change
  useEffect(() => {
    if (token) {
      setPage(1);
      fetchPosts(true);
    }
  }, [filterScope, selectedCategory, selectedStatus, token]);

  // Initial fetch
  useEffect(() => {
    if (token) {
      fetchPosts(true);
    }
  }, [token]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchPosts(false);
    }
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedStatus('all');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedStatus !== 'all') count++;
    return count;
  };

const statusOptions = [
  { value: 'all', label: 'Semua Status', icon: TrendingUp },
  { value: 'pending_governor', label: 'Menunggu Gubernur', icon: Clock },
  { value: 'investigation_assigned', label: 'Investigasi Ditugaskan', icon: Users },
  { value: 'investigation_done', label: 'Investigasi Selesai', icon: CheckCircle },
  { value: 'governor_processing', label: 'Gubernur Memproses', icon: Clock },
  { value: 'completion_report_submitted', label: 'Laporan Akhir Dikirim', icon: Clock },
  { value: 'completed', label: 'Selesai', icon: CheckCircle },
];

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Compass className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Belum Login</h2>
        <p className="text-gray-400 mb-6">Login untuk melihat pengaduan masyarakat</p>
        <Button onClick={() => router.push('/auth/login')}>Login Sekarang</Button>
      </div>
    );
  }
console.log(localStorage.getItem('user'))
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        <div className="flex flex-col lg:flex-row">
          {/* MAIN FEED */}
          <main className="flex-1 min-w-0 lg:pl-6 xl:pl-8">
            {/* Header Mobile */}
            <div className="lg:hidden mb-3 px-3">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-900">Feed</h1>
                <button
                  onClick={() => setShowMobileFilter(!showMobileFilter)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-full text-xs"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filter
                  {getActiveFilterCount() > 0 && (
                    <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </button>
              </div>
              
              {showMobileFilter && (
                <div className="mt-2 bg-white rounded-lg border p-3 space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 mb-1.5">WILAYAH</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFilterScope('all')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs ${
                          filterScope === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                        }`}
                      >
                        Semua
                      </button>
                      <button
                        onClick={() => setFilterScope('province')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs ${
                          filterScope === 'province' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                        }`}
                      >
                        Provinsi Saya
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 mb-1.5">KATEGORI</p>
                    <select
                      className="w-full p-1.5 border rounded-lg text-xs"
                      value={selectedCategory || ''}
                      onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Semua Kategori</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 mb-1.5">STATUS</p>
                    <select
                      className="w-full p-1.5 border rounded-lg text-xs"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {(selectedCategory || selectedStatus !== 'all') && (
                    <button onClick={resetFilters} className="text-xs text-red-500">
                      Reset Filter
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Feed Posts */}
            <div className="px-3 pr-3 lg:pl-0 lg:pr-4">
              {posts.length === 0 && !isLoading ? (
                <div className="text-center py-12 bg-white rounded-lg">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Compass className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-sm">Belum ada pengaduan</p>
                </div>
              ) : (
                <>
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                  
                  {isLoading && posts.length > 0 && (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                  )}
                  
                  {hasMore && posts.length > 0 && !isLoading && (
                    <div className="text-center mt-2 pb-6">
                      <button 
                        onClick={handleLoadMore}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Muat lebih banyak
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          {/* SIDEBAR KANAN */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-6 h-[calc(100vh-3rem)] overflow-y-auto">
            <div className="bg-white rounded-lg border p-4 mr-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sm text-gray-900">Filter</h2>
                {(selectedCategory || selectedStatus !== 'all') && (
                  <button onClick={resetFilters} className="text-[10px] text-red-500">
                    Reset
                  </button>
                )}
              </div>

              <div className="mb-4">
                <p className="text-[10px] font-semibold text-gray-400 mb-1.5">WILAYAH</p>
                <div className="space-y-0.5">
                  <button
                    onClick={() => setFilterScope('all')}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition ${
                      filterScope === 'all' ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Semua Provinsi
                  </button>
                  <button
                    onClick={() => setFilterScope('province')}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition ${
                      filterScope === 'province' ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-50'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Provinsi Saya
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-[10px] font-semibold text-gray-400 mb-1.5">KATEGORI</p>
                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition ${
                      selectedCategory === null ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-50'
                    }`}
                  >
                    Semua Kategori
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition ${
                        selectedCategory === cat.id ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-[10px] font-semibold text-gray-400 mb-1.5">STATUS</p>
                <div className="space-y-0.5">
                  {statusOptions.map((status) => {
                    const StatusIcon = status.icon;
                    return (
                      <button
                        key={status.value}
                        onClick={() => setSelectedStatus(status.value)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition ${
                          selectedStatus === status.value ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-50'
                        }`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t text-center text-[10px] text-gray-400">
                <p>{posts.length} pengaduan</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}