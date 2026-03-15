export type Gender = 'male' | 'female';

export interface Baby {
  id: string;
  user_id: string;
  name: string;
  gender: Gender;
  birth_date: string; // ISO date
  birth_weight: number; // grams
  birth_height: number; // cm
  blood_type?: string;
  avatar_url?: string;
  created_at: string;
}

export type RecordType = 'feeding' | 'sleep' | 'diaper' | 'bath' | 'weight' | 'height' | 'temperature' | 'jaundice' | 'medicine' | 'note';

export interface Record {
  id: string;
  baby_id: string;
  type: RecordType;
  started_at: string;
  ended_at?: string;
  data: FeedingData | SleepData | DiaperData | MeasurementData | Record_NoteData;
  note?: string;
  created_at: string;
}

export interface FeedingData {
  method: 'breast_left' | 'breast_right' | 'breast_both' | 'bottle_formula' | 'bottle_breast_milk' | 'solid_food';
  amount_ml?: number;
  duration_minutes?: number;
  food_items?: string[];
}

export interface SleepData {
  location: 'crib' | 'parents_bed' | 'stroller' | 'carrier' | 'other';
  quality?: 1 | 2 | 3 | 4 | 5;
}

export interface DiaperData {
  type: 'wet' | 'dirty' | 'both' | 'dry';
  color?: string;
  consistency?: 'liquid' | 'soft' | 'formed' | 'hard';
  blood?: boolean;
}

export interface MeasurementData {
  value: number;
  unit: string;
  type: 'weight' | 'height' | 'head_circumference' | 'temperature' | 'jaundice';
}

export interface Record_NoteData {
  content: string;
}

export type VaccineStatus = 'scheduled' | 'completed' | 'overdue' | 'skipped';

export interface Vaccine {
  id: string;
  baby_id: string;
  name: string;
  name_en?: string;
  scheduled_date: string;
  administered_date?: string;
  status: VaccineStatus;
  dose_number: number;
  lot_number?: string;
  administered_by?: string;
  side_effects?: string;
  note?: string;
}

export interface GrowthData {
  date: string;
  weight?: number; // kg
  height?: number; // cm
  head_circumference?: number; // cm
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Report {
  id: string;
  baby_id: string;
  period_start: string;
  period_end: string;
  type: 'weekly' | 'monthly';
  summary: string;
  insights: string[];
  suggestions: string[];
  generated_at: string;
}
