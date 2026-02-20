'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { getRecoveryLabel, getRecoveryRecommendation } from '@/engines/recovery';
import { getRecoveryColor } from '@/theme/colors';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import styles from './recovery.module.css';

export default function RecoveryPage() {
    const { recoveryResult, weeklyRecovery, todaySummary, refreshData } = useData();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        refreshData();
    }, []);

    const score = recoveryResult?.score ?? 50;
    const recoveryColor = getRecoveryColor(score);

    if (!mounted) return null;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Recovery</h1>
                <p className={styles.subtitle}>How ready your body is to perform</p>
            </header>

            {/* Big Score */}
            <section className={`glass-card ${styles.scoreCard} animate-in`}>
                <div className={styles.bigScore} style={{ color: recoveryColor }}>
                    {score}%
                </div>
                <div className={styles.scoreLabel}>{getRecoveryLabel(score)} Zone</div>
                <p className={styles.recommendation}>
                    {getRecoveryRecommendation(score)}
                </p>
            </section>

            {/* Component Breakdown */}
            {recoveryResult && (
                <section className={`glass-card ${styles.section} animate-in`} style={{ animationDelay: '0.1s' }}>
                    <h2 className={styles.sectionTitle}>Recovery Breakdown</h2>
                    <div className={styles.breakdownList}>
                        {Object.entries(recoveryResult.breakdown).map(([key, comp]) => (
                            <div key={key} className={styles.breakdownRow}>
                                <div className={styles.breakdownLeft}>
                                    <span className={styles.breakdownName}>
                                        {key === 'hrv' ? 'HRV' : key === 'rhr' ? 'Resting HR' :
                                            key === 'sleep' ? 'Sleep Duration' : key === 'sleepQuality' ? 'Sleep Quality' :
                                                key === 'strain' ? 'Prior Strain' : 'Wellness'}
                                    </span>
                                    <span className={styles.breakdownWeight}>
                                        {comp.available ? `${Math.round(comp.weight * 100)}%` : 'No data'}
                                    </span>
                                </div>
                                <div className={styles.breakdownBar}>
                                    <div
                                        className={styles.breakdownFill}
                                        style={{
                                            width: comp.available ? `${comp.score}%` : '0%',
                                            backgroundColor: comp.available ? getRecoveryColor(comp.score) : 'var(--text-tertiary)',
                                            opacity: comp.available ? 1 : 0.3,
                                        }}
                                    />
                                </div>
                                <span className={styles.breakdownScore}>
                                    {comp.available ? Math.round(comp.score) : '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.completeness}>
                        Data completeness: {recoveryResult.dataCompleteness}%
                    </div>
                </section>
            )}

            {/* Sleep Summary */}
            {todaySummary?.sleep_hours && (
                <section className={`glass-card ${styles.section} animate-in`} style={{ animationDelay: '0.15s' }}>
                    <h2 className={styles.sectionTitle}>Sleep Summary</h2>
                    <div className={styles.sleepGrid}>
                        <div className={styles.sleepStat}>
                            <span className={styles.sleepValue}>{todaySummary.sleep_hours.toFixed(1)}</span>
                            <span className={styles.sleepLabel}>Hours</span>
                        </div>
                        {todaySummary.sleep_quality && (
                            <div className={styles.sleepStat}>
                                <span className={styles.sleepValue}>{todaySummary.sleep_quality}/5</span>
                                <span className={styles.sleepLabel}>Quality</span>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* 7-Day Trend */}
            {weeklyRecovery.length > 0 && (
                <section className={`glass-card ${styles.section} animate-in`} style={{ animationDelay: '0.2s' }}>
                    <h2 className={styles.sectionTitle}>7-Day Recovery Trend</h2>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={weeklyRecovery} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="recoveryGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={recoveryColor} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={recoveryColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(v) => v.slice(5)}
                                    tick={{ fill: '#8B949E', fontSize: 11 }}
                                />
                                <YAxis domain={[0, 100]} hide />
                                <Tooltip
                                    contentStyle={{
                                        background: '#161B22',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '8px',
                                        color: '#E6EDF3',
                                        fontSize: '0.85rem',
                                    }}
                                    formatter={(value: unknown) => [`${value}%`, 'Recovery']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke={recoveryColor}
                                    fill="url(#recoveryGrad)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}
        </div>
    );
}
