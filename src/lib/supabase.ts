import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    if (!_supabase) {
        _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return _supabase;
}

// ─── Database Types (match supabase/schema.sql exactly) ───────────────────────

export interface DailySummary {
    id?: string;
    date: string;
    strain_score: number | null;
    recovery_score: number | null;
    hrv_ms: number | null;
    rhr_bpm: number | null;
    sleep_hours: number | null;
    sleep_quality: number | null;
    subjective_energy: number | null;
    subjective_soreness: number | null;
    subjective_stress: number | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface HeartRateSample {
    id?: string;
    date: string;
    timestamp: string;
    bpm: number;
    context?: string;
    created_at?: string;
}

export interface HrvReading {
    id?: string;
    date: string;
    timestamp: string;
    hrv_ms: number;
    type?: string;
    created_at?: string;
}

export interface Workout {
    id?: string;
    date: string;
    workout_type: string;
    duration_min: number;
    avg_hr_bpm: number | null;
    max_hr_bpm: number | null;
    calories_burned: number | null;
    notes?: string | null;
    created_at?: string;
}

export interface WorkoutSet {
    id?: string;
    workout_id: string;
    exercise: string;
    sets: number;
    reps: number | null;
    weight_lbs: number | null;
    created_at?: string;
}

export interface Meal {
    id?: string;
    date: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    food_name: string;
    serving_size: string | null;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    created_at?: string;
}

export interface WaterLog {
    id?: string;
    timestamp: string;
    amount_oz: number;
}

export interface UserSettings {
    age: number;
    weight_lbs: number;
    calorie_goal: number;
    protein_goal: number;
    carbs_goal: number;
    fat_goal: number;
    water_goal_oz: number;
    sleep_target_hours: number;
    nutrition_mode: 'full' | 'simple';
    hardware: string[];
}

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
    age: 32,
    weight_lbs: 200,
    calorie_goal: 3000,
    protein_goal: 200,
    carbs_goal: 360,
    fat_goal: 85,
    water_goal_oz: 100,
    sleep_target_hours: 8,
    nutrition_mode: 'full',
    hardware: ['apple_watch'],
};
