'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { getSupabase } from '@/lib/supabase';
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import { IoTrendingUp, IoAnalytics, IoBed, IoWater, IoBarbell } from 'react-icons/io5';
import { format, subDays } from 'date-fns';
import styles from './insights.module.css';

type TimeRange = '1w' | '2w' | '1m' | '3m';
const RANGE_DAYS: Record<TimeRange, number> = { '1w': 7, '2w': 14, '1m': 30, '3m': 90 };
const RANGE_LABELS: Record<TimeRange, string> = { '1w': '7 Day', '2w': '14 Day', '1m': '30 Day', '3m': '90 Day' };

export default function InsightsPage() {
    const {
        totalCalories, totalProtein, totalWater,
        settings, meals,
    } = useData();
    const [mounted, setMounted] = useState(false);
    const [range, setRange] = useState<TimeRange>('1w');
    const [rangeStrain, setRangeStrain] = useState<{ date: string; score: number }[]>([]);
    const [rangeRecovery, setRangeRecovery] = useState<{ date: string; score: number }[]>([]);

    useEffect(() => { setMounted(true); }, []);

    // Fetch data for the selected time range
    const loadRange = useCallback(async (r: TimeRange) => {
        const sb = getSupabase();
        const days = RANGE_DAYS[r];
        const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
        const endDate = format(new Date(), 'yyyy-MM-dd');

        if (!sb) {
            // Generate placeholder data
            const data = Array.from({ length: days }, (_, i) => ({
                date: format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd'),
                score: +(Math.random() * 15 + 3).toFixed(1),
            }));
            setRangeStrain(data);
            setRangeRecovery(data.map(d => ({ ...d, score: Math.round(Math.random() * 60 + 30) })));
            return;
        }

        const { data } = await sb
            .from('daily_summaries')
            .select('date, strain_score, recovery_score')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (data && data.length > 0) {
            setRangeStrain(data.map((d: Record<string, unknown>) => ({ date: d.date as string, score: (d.strain_score as number) ?? 0 })));
            setRangeRecovery(data.map((d: Record<string, unknown>) => ({ date: d.date as string, score: (d.recovery_score as number) ?? 0 })));
        } else {
            setRangeStrain([]);
            setRangeRecovery([]);
        }
    }, []);

    useEffect(() => { loadRange(range); }, [range, loadRange]);

    // Combine strain + recovery into a single chart dataset
    const overlayData = useMemo(() => {
        const data: { date: string; strain: number; recovery: number }[] = [];
        const recoveryMap = new Map(rangeRecovery.map(r => [r.date, r.score]));
        rangeStrain.forEach(s => {
            data.push({
                date: s.date.slice(5), // "MM-DD"
                strain: s.score,
                recovery: recoveryMap.get(s.date) ?? 0,
            });
        });
        return data;
    }, [rangeStrain, rangeRecovery]);

    // Compute insight cards for the selected range
    const avgStrain = rangeStrain.length > 0
        ? +(rangeStrain.reduce((s, d) => s + d.score, 0) / rangeStrain.length).toFixed(1)
        : 0;
    const avgRecovery = rangeRecovery.length > 0
        ? Math.round(rangeRecovery.reduce((s, d) => s + d.score, 0) / rangeRecovery.length)
        : 0;
    const peakStrain = rangeStrain.length > 0
        ? Math.max(...rangeStrain.map(s => s.score))
        : 0;
    const daysTracked = rangeStrain.length;
    const calorieBalance = totalCalories - settings.calorie_goal;
    const proteinPct = settings.protein_goal > 0
        ? Math.round((totalProtein / settings.protein_goal) * 100)
        : 0;
    const waterPct = settings.water_goal_oz > 0
        ? Math.round((totalWater / settings.water_goal_oz) * 100)
        : 0;

    // Simple correlation insight
    const strainRecoveryCorrelation = useMemo(() => {
        if (overlayData.length < 3) return null;
        const highStrain = overlayData.filter(d => d.strain > 12);
        const lowStrain = overlayData.filter(d => d.strain <= 8);
        if (highStrain.length === 0 || lowStrain.length === 0) return null;
        const avgRecAfterHigh = highStrain.reduce((s, d) => s + d.recovery, 0) / highStrain.length;
        const avgRecAfterLow = lowStrain.reduce((s, d) => s + d.recovery, 0) / lowStrain.length;
        return { avgRecAfterHigh: Math.round(avgRecAfterHigh), avgRecAfterLow: Math.round(avgRecAfterLow) };
    }, [overlayData]);

    if (!mounted) return null;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    <IoAnalytics style={{ marginRight: '0.5rem' }} />
                    Insights
                </h1>
            </header>

            {/* Summary Cards */}
            <div className={styles.cardGrid}>
                <div className={`glass-card ${styles.statCard}`}>
                    <IoTrendingUp className={styles.cardIcon} style={{ color: '#FF6B35' }} />
                    <div className={styles.statValue}>{avgStrain}</div>
                    <div className={styles.statLabel}>Avg Strain ({RANGE_LABELS[range]})</div>
                </div>
                <div className={`glass-card ${styles.statCard}`}>
                    <IoBed className={styles.cardIcon} style={{ color: '#4ECDC4' }} />
                    <div className={styles.statValue}>{avgRecovery}%</div>
                    <div className={styles.statLabel}>Avg Recovery ({RANGE_LABELS[range]})</div>
                </div>
                <div className={`glass-card ${styles.statCard}`}>
                    <IoBarbell className={styles.cardIcon} style={{ color: '#60CFFF' }} />
                    <div className={styles.statValue}>{peakStrain.toFixed(1)}</div>
                    <div className={styles.statLabel}>Peak Strain</div>
                </div>
                <div className={`glass-card ${styles.statCard}`}>
                    <IoAnalytics className={styles.cardIcon} style={{ color: '#38BDF8' }} />
                    <div className={styles.statValue}>{daysTracked}</div>
                    <div className={styles.statLabel}>Days Tracked</div>
                </div>
            </div>

            {/* Time Range Selector */}
            <section className={`glass-card ${styles.section}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Strain vs Recovery</h2>
                    <div className={styles.rangeToggle}>
                        {(['1w', '2w', '1m', '3m'] as TimeRange[]).map(r => (
                            <button
                                key={r}
                                className={`${styles.rangeBtn} ${range === r ? styles.rangeBtnActive : ''}`}
                                onClick={() => setRange(r)}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
                {overlayData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <ComposedChart data={overlayData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="date" tick={{ fill: '#8B949E', fontSize: 11 }} />
                            <YAxis yAxisId="strain" domain={[0, 21]} tick={{ fill: '#8B949E', fontSize: 11 }} />
                            <YAxis yAxisId="recovery" orientation="right" domain={[0, 100]} tick={{ fill: '#8B949E', fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ background: '#1C2333', border: '1px solid #30363D', borderRadius: 8 }}
                                labelStyle={{ color: '#E6EDF3' }}
                            />
                            <Bar yAxisId="strain" dataKey="strain" fill="rgba(255, 107, 53, 0.6)" radius={[4, 4, 0, 0]} />
                            <Line yAxisId="recovery" dataKey="recovery" type="monotone" stroke="#4ECDC4" strokeWidth={2} dot={{ fill: '#4ECDC4', r: 4 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <p className={styles.noData}>Complete a few days to see trends</p>
                )}
            </section>

            {/* Correlation Insight */}
            {strainRecoveryCorrelation && (
                <section className={`glass-card ${styles.section}`}>
                    <h2 className={styles.sectionTitle}>🔍 Pattern Detected</h2>
                    <p className={styles.insightText}>
                        On <strong>high-strain days</strong> (12+), your recovery averages{' '}
                        <span style={{ color: '#FF6B6B' }}>{strainRecoveryCorrelation.avgRecAfterHigh}%</span>.{' '}
                        On <strong>light days</strong> (≤8), recovery averages{' '}
                        <span style={{ color: '#4ECDC4' }}>{strainRecoveryCorrelation.avgRecAfterLow}%</span>.
                    </p>
                </section>
            )}

            {/* Progress Today */}
            <section className={`glass-card ${styles.section}`}>
                <h2 className={styles.sectionTitle}>Today&apos;s Progress</h2>
                <div className={styles.progressGrid}>
                    <div className={styles.progressItem}>
                        <div className={styles.progressHeader}>
                            <span>Protein</span>
                            <span>{proteinPct}%</span>
                        </div>
                        <div className={styles.progressTrack}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${Math.min(proteinPct, 100)}%`, background: '#60CFFF' }}
                            />
                        </div>
                        <span className={styles.progressDetail}>{totalProtein}g / {settings.protein_goal}g</span>
                    </div>
                    <div className={styles.progressItem}>
                        <div className={styles.progressHeader}>
                            <span>Calories</span>
                            <span>{totalCalories} / {settings.calorie_goal}</span>
                        </div>
                        <div className={styles.progressTrack}>
                            <div
                                className={styles.progressFill}
                                style={{
                                    width: `${Math.min((totalCalories / settings.calorie_goal) * 100, 100)}%`,
                                    background: '#38BDF8',
                                }}
                            />
                        </div>
                    </div>
                    <div className={styles.progressItem}>
                        <div className={styles.progressHeader}>
                            <span>Water</span>
                            <span>{totalWater} / {settings.water_goal_oz} oz</span>
                        </div>
                        <div className={styles.progressTrack}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${Math.min(waterPct, 100)}%`, background: '#38BDF8' }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Meals Breakdown */}
            <section className={`glass-card ${styles.section}`}>
                <h2 className={styles.sectionTitle}>Meal Breakdown</h2>
                {meals.length > 0 ? (
                    <div className={styles.mealBreakdown}>
                        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => {
                            const typeMeals = meals.filter(m => m.meal_type === type);
                            const typeCal = typeMeals.reduce((s, m) => s + m.calories, 0);
                            if (typeCal === 0) return null;
                            return (
                                <div key={type} className={styles.mealRow}>
                                    <span className={styles.mealType}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                    <div className={styles.mealBar}>
                                        <div
                                            className={styles.mealBarFill}
                                            style={{ width: `${Math.min((typeCal / settings.calorie_goal) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className={styles.mealCal}>{typeCal} cal</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className={styles.noData}>Log meals to see breakdown</p>
                )}
            </section>
        </div>
    );
}
