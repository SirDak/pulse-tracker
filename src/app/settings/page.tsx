'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { estimateMaxHR } from '@/engines/strain';
import styles from './settings.module.css';

export default function SettingsPage() {
    const { settings, updateSettings } = useData();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const maxHR = estimateMaxHR(settings.age);

    if (!mounted) return null;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Settings</h1>
                <p className={styles.subtitle}>Personalize your tracking</p>
            </header>

            {/* Personal Info */}
            <section className={`glass-card ${styles.section}`}>
                <h2 className={styles.sectionTitle}>Personal Info</h2>

                <div className={styles.row}>
                    <div className={styles.formGroup}>
                        <label>Age</label>
                        <input
                            type="number"
                            value={settings.age}
                            onChange={e => updateSettings({ age: Number(e.target.value) || 0 })}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Max HR: ~{maxHR} bpm</span>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Weight (lbs)</label>
                        <input
                            type="number"
                            value={settings.weight_lbs}
                            onChange={e => updateSettings({ weight_lbs: Number(e.target.value) || 0 })}
                            className={styles.input}
                        />
                    </div>
                </div>
            </section>

            {/* Nutrition Goals */}
            <section className={`glass-card ${styles.section}`}>
                <h2 className={styles.sectionTitle}>Nutrition Goals</h2>

                <div className={styles.formGroup}>
                    <label>Daily Calories</label>
                    <input
                        type="number"
                        value={settings.calorie_goal}
                        onChange={e => updateSettings({ calorie_goal: Number(e.target.value) || 0 })}
                        className={styles.input}
                    />
                </div>

                <div className={styles.row}>
                    <div className={styles.formGroup}>
                        <label>Protein (g)</label>
                        <input type="number" value={settings.protein_goal}
                            onChange={e => updateSettings({ protein_goal: Number(e.target.value) || 0 })}
                            className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Carbs (g)</label>
                        <input type="number" value={settings.carbs_goal}
                            onChange={e => updateSettings({ carbs_goal: Number(e.target.value) || 0 })}
                            className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Fat (g)</label>
                        <input type="number" value={settings.fat_goal}
                            onChange={e => updateSettings({ fat_goal: Number(e.target.value) || 0 })}
                            className={styles.input} />
                    </div>
                </div>

                <div className={styles.row}>
                    <div className={styles.formGroup}>
                        <label>Water Goal (oz)</label>
                        <input type="number" value={settings.water_goal_oz}
                            onChange={e => updateSettings({ water_goal_oz: Number(e.target.value) || 0 })}
                            className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Sleep Target (hrs)</label>
                        <input type="number" value={settings.sleep_target_hours} step="0.5"
                            onChange={e => updateSettings({ sleep_target_hours: Number(e.target.value) || 0 })}
                            className={styles.input} />
                    </div>
                </div>
            </section>

            {/* Preferences */}
            <section className={`glass-card ${styles.section}`}>
                <h2 className={styles.sectionTitle}>Preferences</h2>

                <div className={styles.toggleRow}>
                    <div>
                        <div className={styles.toggleLabel}>Nutrition Mode</div>
                        <div className={styles.toggleDesc}>
                            {settings.nutrition_mode === 'full' ? 'Full macros (protein, carbs, fat)' : 'Simple (calories only)'}
                        </div>
                    </div>
                    <button
                        className={`${styles.toggle} ${settings.nutrition_mode === 'full' ? styles.toggleOn : ''}`}
                        onClick={() => updateSettings({ nutrition_mode: settings.nutrition_mode === 'full' ? 'simple' : 'full' })}
                    >
                        <div className={styles.toggleThumb} />
                    </button>
                </div>
            </section>

            {/* Hardware */}
            <section className={`glass-card ${styles.section}`}>
                <h2 className={styles.sectionTitle}>HR Data Source</h2>
                {['apple_watch', 'polar_h10', 'other_ble', 'manual_only'].map(hw => (
                    <button
                        key={hw}
                        className={`${styles.hwOption} ${settings.hardware.includes(hw) ? styles.hwActive : ''}`}
                        onClick={() => updateSettings({ hardware: [hw] })}
                    >
                        <span className={styles.hwName}>
                            {hw === 'apple_watch' ? '⌚ Apple Watch' :
                                hw === 'polar_h10' ? '💓 Polar H10' :
                                    hw === 'other_ble' ? '📡 Other BLE' : '✋ Manual Only'}
                        </span>
                        {settings.hardware.includes(hw) && <span className={styles.hwCheck}>✓</span>}
                    </button>
                ))}
            </section>

            {/* About */}
            <section className={`glass-card ${styles.section}`}>
                <h2 className={styles.sectionTitle}>About</h2>
                <p className={styles.aboutText}>
                    Pulse Tracker v1.0<br />
                    Open source Whoop-style health tracker.<br />
                    Built with Next.js PWA + Supabase.
                </p>
            </section>
        </div>
    );
}
