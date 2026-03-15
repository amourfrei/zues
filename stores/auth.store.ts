import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ loading: false });
        return { error: error.message };
      }
      set({ user: data.user, session: data.session, loading: false });
      return {};
    } catch (err: any) {
      set({ loading: false });
      return { error: err.message };
    }
  },

  signUp: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        set({ loading: false });
        return { error: error.message };
      }
      set({ user: data.user, session: data.session, loading: false });
      return {};
    } catch (err: any) {
      set({ loading: false });
      return { error: err.message };
    }
  },

  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, session: null, loading: false });
  },

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      initialized: true,
    });
  },
}));
