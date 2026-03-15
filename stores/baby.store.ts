import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Baby } from '../constants/types';

interface BabyState {
  babies: Baby[];
  activeBaby: Baby | null;
  loading: boolean;
  error: string | null;
  fetchBabies: (userId: string) => Promise<void>;
  setActiveBaby: (baby: Baby) => void;
  addBaby: (baby: Omit<Baby, 'id' | 'user_id' | 'created_at'>, userId: string) => Promise<Baby | null>;
  updateBaby: (id: string, updates: Partial<Baby>) => Promise<void>;
  deleteBaby: (id: string) => Promise<void>;
}

export const useBabyStore = create<BabyState>((set, get) => ({
  babies: [],
  activeBaby: null,
  loading: false,
  error: null,

  fetchBabies: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('babies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const babies = data as Baby[];
      set({
        babies,
        activeBaby: babies.length > 0 ? babies[0] : null,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  setActiveBaby: (baby: Baby) => {
    set({ activeBaby: baby });
  },

  addBaby: async (babyData, userId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('babies')
        .insert([{ ...babyData, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      const newBaby = data as Baby;
      set(state => ({
        babies: [...state.babies, newBaby],
        activeBaby: newBaby,
        loading: false,
      }));
      return newBaby;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  updateBaby: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('babies')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        babies: state.babies.map(b => (b.id === id ? { ...b, ...updates } : b)),
        activeBaby: state.activeBaby?.id === id ? { ...state.activeBaby, ...updates } : state.activeBaby,
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteBaby: async (id) => {
    try {
      const { error } = await supabase.from('babies').delete().eq('id', id);
      if (error) throw error;

      set(state => {
        const babies = state.babies.filter(b => b.id !== id);
        return {
          babies,
          activeBaby: state.activeBaby?.id === id ? (babies[0] || null) : state.activeBaby,
        };
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
