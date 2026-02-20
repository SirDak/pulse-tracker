'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase, DailySummary, Workout, Meal, WaterLog } from '@/lib/supabase';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from 'date-fns';
import { IoChevronBack, IoChevronForward, IoBarbell, IoNutrition, IoWater, IoFitness, IoHeart } from 'react-icons/io5';
import styles from './history.module.css';

interface DayData {
    summary: DailySummary | null;
    workouts: Workout[];
    meals: Meal[];
    waterLogs: WaterLog[];
}

export default function HistoryPage() {
    const [mounted, setMounted] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [monthSummaries, setMonthSummaries] = useState<Record<string, DailySummary>>({});
    const [dayData, setDayData] = useState<DayData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Load month summaries for calendar coloring
    const loadMonth = useCallback(async (month: Date) => {
        const sb = getSupabase();
        if (!sb) return;
        const start = format(startOfMonth(month), 'yyyy-MM-dd');
        const end = format(endOfMonth(month), 'yyyy-MM-dd');
        const { data } = await sb
            .from('daily_summaries')
            .select('*')
            .gte('date', start)
            .lte('date', end)
            .order('date', { ascending: true });
        if (data) {
            const map: Record<string, DailySummary> = {};
            data.forEach((d: DailySummary) => { map[d.date] = d; });
            setMonthSummaries(map);
        }
    }, []);

    useEffect(() => { loadMonth(currentMonth); }, [currentMonth, loadMonth]);

    // Load a specific day's full data
    const loadDay = useCallback(async (date: Date) => {
        setSelectedDate(date);
        setLoading(true);
        const sb = getSupabase();
        const dateStr = format(date, 'yyyy-MM-dd');

        if (!sb) {
            setDayData({ summary: null, workouts: [], meals: [], waterLogs: [] });
            setLoading(false);
            return;
        }

        const [summaryRes, workoutRes, mealRes, waterRes] = await Promise.all([
            sb.from('daily_summaries').select('*').eq('date', dateStr).single(),
            sb.from('workouts').select('*').eq('date', dateStr).order('created_at', { ascending: true }),
            sb.from('meals').select('*').eq('date', dateStr).order('created_at', { ascending: true }),
            sb.from('water_logs').select('*').eq('date', dateStr).order('logged_at', { ascending: true }),
        ]);

        setDayData({
            summary: summaryRes.data ?? null,
            workouts: workoutRes.data ?? [],
            meals: mealRes.data ?? [],
            waterLogs: (waterRes.data ?? []).map((w: Record<string, unknown>) => ({
                id: w.id as string,
                timestamp: w.logged_at as string,
                amount_oz: w.amount_oz as number,
            })),
        });
        setLoading(false);
    }, []);

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    // Calendar grid
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPad = getDay(monthStart); // 0=Sun
    const today = new Date();

    const getStrainColor = (score: number | null) => {
        if (score === null || score === undefined) return 'transparent';
        if (score <= 7) return 'rgba(0, 230, 118, 0.25)';   // green
        if (score <= 14) return 'rgba(255, 214, 0, 0.25)';   // yellow
        return 'rgba(255, 23, 68, 0.25)';                     // red
    };

    const getRecoveryBorder = (score: number | null) => {
        if (score === null || score === undefined) return 'transparent';
        if (score >= 67) return '#00E676';
        if (score >= 34) return '#FFD600';
        return '#FF1744';
    };

    if (!mounted) return null;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>History</h1>
            </header>

            {/* Month Navigation */}
            <div className={styles.monthNav}>
                <button onClick={prevMonth} className={styles.navBtn}><IoChevronBack /></button>
                <h2 className={styles.monthLabel}>{format(currentMonth, 'MMMM yyyy')}</h2>
                <button onClick={nextMonth} className={styles.navBtn}><IoChevronForward /></button>
            </div>

            {/* Calendar Grid */}
            <section className={`glass-card ${styles.calendar}`}>
                <div className={styles.dayHeaders}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className={styles.dayHeader}>{d}</div>
                    ))}
                </div>
                <div className={styles.dayGrid}>
                    {Array.from({ length: startPad }).map((_, i) => (
                        <div key={`pad-${i}`} className={styles.dayCell} />
                    ))}
                    {days.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const summary = monthSummaries[dateStr];
                        const isToday = isSameDay(day, today);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isFuture = day > today;
                        return (
                            <button
                                key={dateStr}
                                className={`${styles.dayCell} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''} ${isFuture ? styles.future : ''}`}
                                style={{
                                    background: !isFuture ? getStrainColor(summary?.strain_score ?? null) : undefined,
                                    borderColor: !isFuture ? getRecoveryBorder(summary?.recovery_score ?? null) : undefined,
                                }}
                                onClick={() => !isFuture && loadDay(day)}
                                disabled={isFuture}
                            >
                                <span className={styles.dayNum}>{day.getDate()}</span>
                                {summary && (
                                    <div className={styles.dayDots}>
                                        {summary.strain_score !== null && <span className={styles.dotStrain} />}
                                        {summary.recovery_score !== null && <span className={styles.dotRecovery} />}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Legend */}
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <span className={styles.legendSwatch} style={{ background: 'rgba(0,230,118,0.4)' }} /> Low Strain
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.legendSwatch} style={{ background: 'rgba(255,214,0,0.4)' }} /> Med Strain
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.legendSwatch} style={{ background: 'rgba(255,23,68,0.4)' }} /> High Strain
                </div>
            </div>

            {/* Selected Day Detail */}
            {selectedDate && (
                <section className={styles.detail}>
                    <h2 className={styles.detailTitle}>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h2>

                    {loading ? (
                        <div className={`glass-card ${styles.detailCard}`}>
                            <p style={{ color: 'var(--muted)', textAlign: 'center' }}>Loading...</p>
                        </div>
                    ) : dayData ? (
                        <>
                            {/* Strain & Recovery */}
                            <div className={`glass-card ${styles.detailCard}`}>
                                <div className={styles.statRow}>
                                    <div className={styles.stat}>
                                        <IoFitness style={{ color: '#FFD600', fontSize: '1.3rem' }} />
                                        <div>
                                            <div className={styles.statLabel}>Strain</div>
                                            <div className={styles.statValue}>
                                                {dayData.summary?.strain_score?.toFixed(1) ?? '—'}
                                                <span className={styles.statUnit}>/21</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.stat}>
                                        <IoHeart style={{ color: '#00E676', fontSize: '1.3rem' }} />
                                        <div>
                                            <div className={styles.statLabel}>Recovery</div>
                                            <div className={styles.statValue}>
                                                {dayData.summary?.recovery_score ?? '—'}
                                                <span className={styles.statUnit}>%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Biometrics */}
                                {(dayData.summary?.hrv_ms || dayData.summary?.rhr_bpm || dayData.summary?.sleep_hours) && (
                                    <div className={styles.bioRow}>
                                        {dayData.summary?.hrv_ms && (
                                            <div className={styles.bioItem}>
                                                <span className={styles.bioLabel}>HRV</span>
                                                <span className={styles.bioValue}>{dayData.summary.hrv_ms}ms</span>
                                            </div>
                                        )}
                                        {dayData.summary?.rhr_bpm && (
                                            <div className={styles.bioItem}>
                                                <span className={styles.bioLabel}>RHR</span>
                                                <span className={styles.bioValue}>{dayData.summary.rhr_bpm}bpm</span>
                                            </div>
                                        )}
                                        {dayData.summary?.sleep_hours && (
                                            <div className={styles.bioItem}>
                                                <span className={styles.bioLabel}>Sleep</span>
                                                <span className={styles.bioValue}>{dayData.summary.sleep_hours}h</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Workouts */}
                            {dayData.workouts.length > 0 && (
                                <div className={`glass-card ${styles.detailCard}`}>
                                    <h3 className={styles.detailCardTitle}>
                                        <IoBarbell style={{ marginRight: '0.5rem' }} /> Workouts
                                    </h3>
                                    {dayData.workouts.map((w, i) => (
                                        <div key={w.id || i} className={styles.listItem}>
                                            <strong>{w.workout_type}</strong>
                                            <span>{w.duration_min} min{w.avg_hr_bpm ? ` · ${w.avg_hr_bpm} bpm` : ''}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Meals */}
                            {dayData.meals.length > 0 && (
                                <div className={`glass-card ${styles.detailCard}`}>
                                    <h3 className={styles.detailCardTitle}>
                                        <IoNutrition style={{ marginRight: '0.5rem' }} /> Nutrition
                                    </h3>
                                    {dayData.meals.map((m, i) => (
                                        <div key={m.id || i} className={styles.listItem}>
                                            <strong>{m.food_name}</strong>
                                            <span>{m.calories} kcal · {m.protein_g}g P</span>
                                        </div>
                                    ))}
                                    <div className={styles.totalRow}>
                                        <span>Total</span>
                                        <span>
                                            {dayData.meals.reduce((s, m) => s + m.calories, 0)} kcal ·{' '}
                                            {dayData.meals.reduce((s, m) => s + m.protein_g, 0)}g P
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Water */}
                            {dayData.waterLogs.length > 0 && (
                                <div className={`glass-card ${styles.detailCard}`}>
                                    <h3 className={styles.detailCardTitle}>
                                        <IoWater style={{ color: '#448AFF', marginRight: '0.5rem' }} /> Hydration
                                    </h3>
                                    <div className={styles.waterTotal}>
                                        {dayData.waterLogs.reduce((s, w) => s + w.amount_oz, 0)} oz total
                                    </div>
                                </div>
                            )}

                            {/* No data state */}
                            {!dayData.summary && dayData.workouts.length === 0 && dayData.meals.length === 0 && dayData.waterLogs.length === 0 && (
                                <div className={`glass-card ${styles.detailCard}`}>
                                    <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>
                                        No data recorded for this day
                                    </p>
                                </div>
                            )}
                        </>
                    ) : null}
                </section>
            )}
        </div>
    );
}
