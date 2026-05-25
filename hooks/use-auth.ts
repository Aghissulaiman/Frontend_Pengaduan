import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';
import { User } from '@/types';

interface RegisterData {
  username: string;
  password: string;
  email: string;
  fullname: string;
  phone?: string;
  province_api_id?: number;
}

interface GoogleLoginData {
  google_id: string;
  email: string;
  fullname: string;
  avatar?: string;
  province_api_id?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  _hasHydrated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  googleLogin: (data: GoogleLoginData) => Promise<boolean>;
  logout: () => void;
  getProfile: () => Promise<void>;
  setHasHydrated: (state: boolean) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login({ username, password });
          if (res.data.success) {
            const { token, user } = res.data.data;
            set({ user, token, isLoading: false });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch {
          set({ isLoading: false });
          return false;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          const res = await authApi.register(data);
          set({ isLoading: false });
          return res.data.success;
        } catch {
          set({ isLoading: false });
          return false;
        }
      },

      googleLogin: async (data: GoogleLoginData) => {
        set({ isLoading: true });
        try {
          const res = await authApi.googleLogin(data);
          if (res.data.success) {
            const { token, user } = res.data.data;
            set({ user, token, isLoading: false });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch {
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({ user: null, token: null });
      },

      getProfile: async () => {
        const { token } = get();
        if (!token) return;
        
        try {
          const res = await authApi.getProfile();
          if (res.data.success) {
            set({ user: res.data.data });
          }
        } catch (error) {
          console.error('Failed to get profile');
          // If token expired, logout
          if (error?.response?.status === 401) {
            get().logout();
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);

// Custom hook untuk menunggu hydration selesai
export const useAuthHydrated = () => {
  const { _hasHydrated, ...auth } = useAuth();
  return { ...auth, isHydrated: _hasHydrated };
};