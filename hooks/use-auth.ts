import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';
import { User } from '@/types';
import { AxiosError } from 'axios';

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
          console.log('Login response:', res.data);
          
          if (res.data.success) {
            const { token, user } = res.data.data;
            
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', token);
              localStorage.setItem('user', JSON.stringify(user));
              console.log('Token saved to localStorage');
              console.log('User saved to localStorage:', user);
            }
            
            set({ user, token, isLoading: false });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error: unknown) {
          const err = error as AxiosError;
          console.error('Login error:', err?.response?.data || err.message);
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
        } catch (error: unknown) {
          console.error('Register error:', error);
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
            
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', token);
              localStorage.setItem('user', JSON.stringify(user));
            }
            
            set({ user, token, isLoading: false });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error: unknown) {
          console.error('Google login error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        set({ user: null, token: null });
      },

      getProfile: async () => {
        const { token } = get();
        if (!token) return;
        
        try {
          const res = await authApi.getProfile();
          if (res.data.success) {
            const user = res.data.data;
            if (typeof window !== 'undefined') {
              localStorage.setItem('user', JSON.stringify(user));
            }
            set({ user });
          }
        } catch (error: unknown) {
          const err = error as AxiosError;
          console.error('Failed to get profile');
          if (err?.response?.status === 401) {
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

export const useAuthHydrated = () => {
  const { _hasHydrated, ...auth } = useAuth();
  return { ...auth, isHydrated: _hasHydrated };
};