'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { getStrainLabel } from '@/engines/strain';
import { getStrainColor } from '@/theme/colors';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import styles from './strain.module.css';

export default function StrainPage() {
    const { strainResult, workouts, weeklyStrain, refreshData } = useData();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        refreshData();
    }, []);

    const score = strainResult?.score ?? 0;

    const zoneData = strainResult ? [
        { name: 'Zone 5', minutes: strainResult.zoneMinutes.zone5, color: '#FF1744' },
        { name: 'Zone 4', minutes: strainResult.zoneMinutes.zone4, color: '#FF6D00' },
        { name: 'Zone 3', minutes: strainResult.zoneMinutes.zone3, color: '#FFD600' },
        { name: 'Zone 2', minutes: strainResult.zoneMinutes.zone2, color: '#69F0AE' },
        { name: 'Zone 1', minutes: strainResult.zoneMinutes.zone1, color: '#00E676' },
    ] : [];

    if (!mounted) return null;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Strain</h1>
                <p className={styles.subtitle}>Today&apos;s cardiovascular &amp; muscular load</p>
            </header>

            {/* Big Score */}
            <section className={`glass-card ${styles.scoreCard} animate-in`}>
                <div className={styles.bigScore} style={{ color: getStrainColor(score) }}>
                    {score.toFixed(1)}
                </div>
                <div className={styles.scoreLabel}>{getStrainLabel(score)} Strain</div>
                <div className={styles.scoreMax}>of 21.0 max</div>

                {strainResult && (
                    <div className={styles.scoreBreakdown}>
                        <div className={styles.breakdownItem}>
                            <span className={styles.breakdownLabel}>Cardiovascular</span>
                            <span className={styles.breakdownValue}>{strainResult.cardiovascularStrain.toFixed(1)}</span>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.breakdownItem}>
                            <span className={styles.breakdownLabel}>Mechanical</span>
                            <span className={styles.breakdownValue}>{strainResult.mechanicalStrain.toFixed(1)}</span>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.breakdownItem}>
                            <span className={styles.breakdownLabel}>Active Min</span>
                            <span className={styles.breakdownValue}>{strainResult.totalActiveMinutes}</span>
                        </div>
                    </div>
                )}
            </section>

            {/* HR Zone Distribution */}
            {zoneData.length > 0 && (
                <section className={`glass-card ${styles.section} animate-in`} style={{ animationDelay: '0.1s' }}>
                    <h2 className={styles.sectionTitle}>HR Zone Distribution</h2>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={zoneData} layout="vertical" margin={{ left: 10, right: 10 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={50} tick={{ fill: '#8B949E', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        background: '#161B22',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '8px',
                                        color: '#E6EDF3',
                                        fontSize: '0.85rem',
                                    }}
                                    formatter={(value: unknown) => [`${value} min`, 'Time']}
                                />
                                <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
                                    {zoneData.map((entry, idx) => (
                                        <Cell key={idx} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

            {/* 7-Day Trend */}
            {weeklyStrain.length > 0 && (
                <section className={`glass-card ${styles.section} animate-in`} style={{ animationDelay: '0.15s' }}>
                    <h2 className={styles.sectionTitle}>7-Day Strain Trend</h2>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={weeklyStrain} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="strainGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00E676" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(v) => v.slice(5)}
                                    tick={{ fill: '#8B949E', fontSize: 11 }}
                                />
                                <YAxis domain={[0, 21]} hide />
                                <Tooltip
                                    contentStyle={{
                                        background: '#161B22',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '8px',
                                        color: '#E6EDF3',
                                        fontSize: '0.85rem',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#00E676"
                                    fill="url(#strainGradient)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

            {/* Today's Workouts */}
            <section className={`glass-card ${styles.section} animate-in`} style={{ animationDelay: '0.2s' }}>
                <h2 className={styles.sectionTitle}>Today&apos;s Workouts</h2>
                {workouts.length === 0 ? (
                    <p className={styles.empty}>No workouts logged today</p>
                ) : (
                    <div className={styles.workoutList}>
                        {workouts.map(w => (
                            <div key={w.id} className={styles.workoutItem}>
                                <div>
                                    <div className={styles.workoutType}>{w.workout_type}</div>
                                    <div className={styles.workoutMeta}>{w.duration_min} min · {w.calories_burned ?? 0} cal</div>
                                </div>
                                {w.avg_hr_bpm && (
                                    <div className={styles.workoutHR}>
                                        <span>{w.avg_hr_bpm}</span>
                                        <span className={styles.hrLabel}>avg bpm</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
