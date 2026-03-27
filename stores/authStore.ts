import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AppUser } from '../types/app.types';

interface AuthStore {
  user: User | null;
  appUser: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAppUser: (appUser: AppUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  appUser: null,
  session: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setAppUser: (appUser) => set({ appUser }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ session: null, user: null, appUser: null, isLoading: false });
  },
}));
