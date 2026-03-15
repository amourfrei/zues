import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Record, RecordType } from '../constants/types';

interface RecordsState {
  records: Record[];
  loading: boolean;
  error: string | null;
  fetchRecords: (babyId: string, date?: string) => Promise<void>;
  addRecord: (record: Omit<Record, 'id' | 'created_at'>) => Promise<Record | null>;
  updateRecord: (id: string, updates: Partial<Record>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  getRecordsByType: (type: RecordType) => Record[];
  getTodayRecords: () => Record[];
  getLastRecord: (type: RecordType) => Record | null;
}

export const useRecordsStore = create<RecordsState>((set, get) => ({
  records: [],
  loading: false,
  error: null,

  fetchRecords: async (babyId: string, date?: string) => {
    set({ loading: true, error: null });
    try {
      let query = supabase
        .from('records')
        .select('*')
        .eq('baby_id', babyId)
        .order('started_at', { ascending: false });

      if (date) {
        const startOfDay = `${date}T00:00:00.000Z`;
        const endOfDay = `${date}T23:59:59.999Z`;
        query = query.gte('started_at', startOfDay).lte('started_at', endOfDay);
      } else {
        // Fetch last 30 days by default
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.gte('started_at', thirtyDaysAgo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      set({ records: data as Record[], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  addRecord: async (recordData) => {
    try {
      const { data, error } = await supabase
        .from('records')
        .insert([recordData])
        .select()
        .single();

      if (error) throw error;

      const newRecord = data as Record;
      set(state => ({
        records: [newRecord, ...state.records],
      }));
      return newRecord;
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  updateRecord: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('records')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        records: state.records.map(r => (r.id === id ? { ...r, ...updates } : r)),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteRecord: async (id) => {
    try {
      const { error } = await supabase.from('records').delete().eq('id', id);
      if (error) throw error;

      set(state => ({
        records: state.records.filter(r => r.id !== id),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  getRecordsByType: (type: RecordType) => {
    return get().records.filter(r => r.type === type);
  },

  getTodayRecords: () => {
    const today = new Date().toDateString();
    return get().records.filter(r => new Date(r.started_at).toDateString() === today);
  },

  getLastRecord: (type: RecordType) => {
    const typed = get().records.filter(r => r.type === type);
    return typed.length > 0 ? typed[0] : null;
  },
}));
