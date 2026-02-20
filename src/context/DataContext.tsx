'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getSupabase, DailySummary, Workout, WorkoutSet, Meal, WaterLog, UserSettings, DEFAULT_SETTINGS } from '@/lib/supabase';
import { calculateStrainScore, StrainResult } from '@/engines/strain';
import { calculateRecovery, RecoveryResult, RecoveryInputs } from '@/engines/recovery';
import { format, subDays } from 'date-fns';

interface DataContextType {
    settings: UserSettings;
    todaySummary: DailySummary | null;
    strainResult: StrainResult | null;
    recoveryResult: RecoveryResult | null;
    workouts: Workout[];
    meals: Meal[];
    waterLogs: WaterLog[];
    weeklyStrain: { date: string; score: number }[];
    weeklyRecovery: { date: string; score: number }[];
    loading: boolean;

    updateSettings: (s: Partial<UserSettings>) => Promise<void>;
    addMeal: (meal: Omit<Meal, 'id' | 'created_at'>) => Promise<void>;
    removeMeal: (id: string) => Promise<void>;
    addWaterLog: (amount_oz: number) => Promise<void>;
    removeWaterLog: (id: string) => Promise<void>;
    addWorkout: (workout: Omit<Workout, 'id' | 'created_at'>, sets?: Omit<WorkoutSet, 'id' | 'workout_id' | 'created_at'>[]) => Promise<void>;
    removeWorkout: (id: string) => Promise<void>;
    submitMorningRoutine: (data: {
        hrv?: number; rhr?: number; sleepHours?: number;
        sleepQuality?: number; energy?: number; soreness?: number; stress?: number;
    }) => Promise<void>;
    refreshData: () => Promise<void>;

    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalWater: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const TODAY = format(new Date(), 'yyyy-MM-dd');

export function DataProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null);
    const [strainResult, setStrainResult] = useState<StrainResult | null>(null);
    const [recoveryResult, setRecoveryResult] = useState<RecoveryResult | null>(null);
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [meals, setMeals] = useState<Meal[]>([]);
    const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
    const [weeklyStrain, setWeeklyStrain] = useState<{ date: string; score: number }[]>([]);
    const [weeklyRecovery, setWeeklyRecovery] = useState<{ date: string; score: number }[]>([]);
    const [loading, setLoading] = useState(false);

    // ─── Computed totals ─────────────────────────────────────
    const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
    const totalProtein = meals.reduce((s, m) => s + m.protein_g, 0);
    const totalCarbs = meals.reduce((s, m) => s + m.carbs_g, 0);
    const totalFat = meals.reduce((s, m) => s + m.fat_g, 0);
    const totalWater = waterLogs.reduce((s, w) => s + w.amount_oz, 0);

    // ─── Recovery recalculation helper ───────────────────────
    const recalcRecovery = useCallback((
        summary: DailySummary | null,
        prevStrain: number | null,
        sleepTarget: number
    ) => {
        if (!summary) return;
        const inputs: RecoveryInputs = {
            currentHRV: summary.hrv_ms ?? null,
            hrvBaseline: [],
            currentRHR: summary.rhr_bpm ?? null,
            rhrBaseline: [],
            sleepHours: summary.sleep_hours ?? null,
            sleepTarget,
            sleepQuality: summary.sleep_quality ?? null,
            previousDayStrain: prevStrain,
            subjectiveEnergy: summary.subjective_energy ?? null,
            subjectiveSoreness: summary.subjective_soreness ?? null,
            subjectiveStress: summary.subjective_stress ?? null,
        };
        setRecoveryResult(calculateRecovery(inputs));
    }, []);

    // ─── Load all data from Supabase ─────────────────────────
    const refreshData = useCallback(async () => {
        setLoading(true);
        const sb = getSupabase();

        if (!sb) {
            // No Supabase — generate placeholder weekly trend data
            const strainData = Array.from({ length: 7 }, (_, i) => ({
                date: format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'),
                score: i === 6 ? (strainResult?.score ?? 0) : +(Math.random() * 15 + 3).toFixed(1),
            }));
            const recoveryData = Array.from({ length: 7 }, (_, i) => ({
                date: format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'),
                score: i === 6 ? (recoveryResult?.score ?? 50) : Math.round(Math.random() * 60 + 30),
            }));
            setWeeklyStrain(strainData);
            setWeeklyRecovery(recoveryData);
            setLoading(false);
            return;
        }

        try {
            // Settings
            const { data: settingsData } = await sb
                .from('user_settings')
                .select('*')
                .eq('user_id', 'default')
                .single();
            if (settingsData) {
                setSettings({
                    age: settingsData.age,
                    weight_lbs: settingsData.weight_lbs,
                    calorie_goal: settingsData.calorie_goal,
                    protein_goal: settingsData.protein_goal,
                    carbs_goal: settingsData.carbs_goal,
                    fat_goal: settingsData.fat_goal,
                    water_goal_oz: settingsData.water_goal_oz,
                    sleep_target_hours: settingsData.sleep_target_hours,
                    nutrition_mode: settingsData.nutrition_mode,
                    hardware: settingsData.hardware,
                });
            }

            // Today's summary
            const { data: summaryData } = await sb
                .from('daily_summaries')
                .select('*')
                .eq('date', TODAY)
                .single();
            setTodaySummary(summaryData ?? null);

            // Today's meals
            const { data: mealsData } = await sb
                .from('meals')
                .select('*')
                .eq('date', TODAY)
                .order('created_at', { ascending: true });
            setMeals(mealsData ?? []);

            // Today's water logs
            const { data: waterData } = await sb
                .from('water_logs')
                .select('*')
                .eq('date', TODAY)
                .order('logged_at', { ascending: true });
            setWaterLogs((waterData ?? []).map((w: Record<string, unknown>) => ({
                id: w.id as string,
                timestamp: w.logged_at as string,
                amount_oz: w.amount_oz as number,
            })));

            // Today's workouts
            const { data: workoutData } = await sb
                .from('workouts')
                .select('*')
                .eq('date', TODAY)
                .order('created_at', { ascending: true });
            setWorkouts(workoutData ?? []);

            // 7-day summaries for weekly trend
            const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
            const { data: weekData } = await sb
                .from('daily_summaries')
                .select('date, strain_score, recovery_score')
                .gte('date', sevenDaysAgo)
                .lte('date', TODAY)
                .order('date', { ascending: true });

            if (weekData && weekData.length > 0) {
                setWeeklyStrain(weekData.map((d: Record<string, unknown>) => ({
                    date: d.date as string,
                    score: (d.strain_score as number) ?? 0,
                })));
                setWeeklyRecovery(weekData.map((d: Record<string, unknown>) => ({
                    date: d.date as string,
                    score: (d.recovery_score as number) ?? 0,
                })));
                const yesterday = weekData.find((d: Record<string, unknown>) =>
                    d.date === format(subDays(new Date(), 1), 'yyyy-MM-dd')
                );
                recalcRecovery(
                    summaryData ?? null,
                    (yesterday?.strain_score as number) ?? null,
                    settingsData?.sleep_target_hours ?? DEFAULT_SETTINGS.sleep_target_hours
                );
            }
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load data on mount
    useEffect(() => { refreshData(); }, [refreshData]);

    // ─── Settings update ─────────────────────────────────────
    const updateSettings = useCallback(async (partial: Partial<UserSettings>) => {
        setSettings(prev => ({ ...prev, ...partial }));
        const sb = getSupabase();
        if (!sb) return;
        await sb.from('user_settings').update(partial).eq('user_id', 'default');
    }, []);

    // ─── Meals ───────────────────────────────────────────────
    const addMeal = useCallback(async (meal: Omit<Meal, 'id' | 'created_at'>) => {
        const sb = getSupabase();
        if (sb) {
            const { data } = await sb.from('meals').insert(meal).select().single();
            if (data) { setMeals(prev => [...prev, data]); return; }
        }
        // Fallback: optimistic local update
        setMeals(prev => [...prev, { ...meal, id: crypto.randomUUID(), created_at: new Date().toISOString() }]);
    }, []);

    const removeMeal = useCallback(async (id: string) => {
        setMeals(prev => prev.filter(m => m.id !== id));
        const sb = getSupabase();
        if (sb) await sb.from('meals').delete().eq('id', id);
    }, []);

    // ─── Water ───────────────────────────────────────────────
    const addWaterLog = useCallback(async (amount_oz: number) => {
        const sb = getSupabase();
        const row = { date: TODAY, amount_oz, logged_at: new Date().toISOString() };
        if (sb) {
            const { data } = await sb.from('water_logs').insert(row).select().single();
            if (data) {
                setWaterLogs(prev => [...prev, { id: data.id, timestamp: data.logged_at, amount_oz: data.amount_oz }]);
                return;
            }
        }
        setWaterLogs(prev => [...prev, { id: crypto.randomUUID(), timestamp: new Date().toISOString(), amount_oz }]);
    }, []);

    const removeWaterLog = useCallback(async (id: string) => {
        setWaterLogs(prev => prev.filter(w => w.id !== id));
        const sb = getSupabase();
        if (sb) await sb.from('water_logs').delete().eq('id', id);
    }, []);

    // ─── Workouts ────────────────────────────────────────────
    const addWorkout = useCallback(async (
        workout: Omit<Workout, 'id' | 'created_at'>,
        sets?: Omit<WorkoutSet, 'id' | 'workout_id' | 'created_at'>[]
    ) => {
        const sb = getSupabase();
        if (sb) {
            const { data: wData } = await sb.from('workouts').insert(workout).select().single();
            if (wData) {
                setWorkouts(prev => [...prev, wData]);
                if (sets && sets.length > 0) {
                    await sb.from('workout_sets').insert(sets.map(s => ({ ...s, workout_id: wData.id })));
                }
                // Recalculate strain from workouts
                const { data: allSets } = await sb.from('workout_sets')
                    .select('*')
                    .in('workout_id', [wData.id]);
                if (allSets) {
                    const strainRes = calculateStrainScore(
                        [],                     // HR samples (none yet, Shortcuts will fill later)
                        allSets,                // workout sets
                        settings.age,
                        todaySummary?.rhr_bpm ?? 60, // resting HR from today's summary or fallback
                        workout.avg_hr_bpm,
                    );
                    setStrainResult(strainRes);
                    await sb.from('daily_summaries').upsert(
                        { date: TODAY, strain_score: strainRes.score, updated_at: new Date().toISOString() },
                        { onConflict: 'date' }
                    );
                }
                return;
            }
        }
        setWorkouts(prev => [...prev, { ...workout, id: crypto.randomUUID(), created_at: new Date().toISOString() }]);
    }, [settings]);

    const removeWorkout = useCallback(async (id: string) => {
        setWorkouts(prev => prev.filter(w => w.id !== id));
        const sb = getSupabase();
        if (sb) {
            await sb.from('workout_sets').delete().eq('workout_id', id);
            await sb.from('workouts').delete().eq('id', id);
            // Recalculate strain with remaining workouts
            const remaining = workouts.filter(w => w.id !== id);
            if (remaining.length === 0) {
                setStrainResult(null);
                await sb.from('daily_summaries').upsert(
                    { date: TODAY, strain_score: 0, updated_at: new Date().toISOString() },
                    { onConflict: 'date' }
                );
            }
        }
    }, [workouts]);

    // ─── Morning routine ─────────────────────────────────────
    const submitMorningRoutine = useCallback(async (data: {
        hrv?: number; rhr?: number; sleepHours?: number;
        sleepQuality?: number; energy?: number; soreness?: number; stress?: number;
    }) => {
        const prevStrain = weeklyStrain.length > 1 ? weeklyStrain[weeklyStrain.length - 2].score : null;

        const patch: Record<string, unknown> = {
            date: TODAY,
            updated_at: new Date().toISOString(),
        };
        if (data.hrv !== undefined) patch.hrv_ms = data.hrv;
        if (data.rhr !== undefined) patch.rhr_bpm = data.rhr;
        if (data.sleepHours !== undefined) patch.sleep_hours = data.sleepHours;
        if (data.sleepQuality !== undefined) patch.sleep_quality = data.sleepQuality;
        if (data.energy !== undefined) patch.subjective_energy = data.energy;
        if (data.soreness !== undefined) patch.subjective_soreness = data.soreness;
        if (data.stress !== undefined) patch.subjective_stress = data.stress;

        const newSummary: DailySummary = {
            date: TODAY,
            hrv_ms: data.hrv ?? null,
            rhr_bpm: data.rhr ?? null,
            sleep_hours: data.sleepHours ?? null,
            sleep_quality: data.sleepQuality ?? null,
            subjective_energy: data.energy ?? null,
            subjective_soreness: data.soreness ?? null,
            subjective_stress: data.stress ?? null,
            strain_score: strainResult?.score ?? null,
            recovery_score: null,
        };
        setTodaySummary(newSummary);
        recalcRecovery(newSummary, prevStrain, settings.sleep_target_hours);

        const sb = getSupabase();
        if (sb) {
            const recoveryRes = calculateRecovery({
                currentHRV: data.hrv ?? null,
                hrvBaseline: [],
                currentRHR: data.rhr ?? null,
                rhrBaseline: [],
                sleepHours: data.sleepHours ?? null,
                sleepTarget: settings.sleep_target_hours,
                sleepQuality: data.sleepQuality ?? null,
                previousDayStrain: prevStrain,
                subjectiveEnergy: data.energy ?? null,
                subjectiveSoreness: data.soreness ?? null,
                subjectiveStress: data.stress ?? null,
            });
            patch.recovery_score = recoveryRes.score;
            await sb.from('daily_summaries').upsert(patch, { onConflict: 'date' });
        }
    }, [settings, weeklyStrain, strainResult, recalcRecovery]);

    return (
        <DataContext.Provider value={{
            settings, todaySummary, strainResult, recoveryResult,
            workouts, meals, waterLogs, weeklyStrain, weeklyRecovery, loading,
            updateSettings, addMeal, removeMeal, addWaterLog, removeWaterLog,
            addWorkout, removeWorkout, submitMorningRoutine, refreshData,
            totalCalories, totalProtein, totalCarbs, totalFat, totalWater,
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useData must be used within a DataProvider');
    return ctx;
}
