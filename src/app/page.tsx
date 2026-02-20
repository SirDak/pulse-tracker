'use client';

import React, { useEffect, useState } from 'react';
import { useData } from '@/context/DataContext';
import CircularGauge from '@/components/CircularGauge';
import ProgressBar from '@/components/ProgressBar';
import { getStrainLabel } from '@/engines/strain';
import { getRecoveryLabel, getRecoveryRecommendation } from '@/engines/recovery';
import { format } from 'date-fns';
import Link from 'next/link';
import { IoAdd, IoWater, IoBarbell, IoSunny, IoRefresh, IoSettings, IoNutrition, IoTime } from 'react-icons/io5';
import styles from './page.module.css';

export default function Dashboard() {
  const {
    strainResult,
    recoveryResult,
    settings,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    totalWater,
    addWaterLog,
    refreshData,
  } = useData();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    refreshData();
  }, []);

  const strainScore = strainResult?.score ?? 0;
  const recoveryScore = recoveryResult?.score ?? 50;

  const today = format(new Date(), 'EEEE, MMM d');

  if (!mounted) return null;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Pulse</h1>
          <p className={styles.date}>{today}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/history" className={styles.syncButton} title="History">
            <IoTime />
          </Link>
          <button className={styles.syncButton} onClick={refreshData} title="Sync data">
            <IoRefresh />
          </button>
          <Link href="/settings" className={styles.syncButton} title="Settings">
            <IoSettings />
          </Link>
        </div>
      </header>

      {/* Score Gauges */}
      <section className={`${styles.gauges} animate-in`}>
        <Link href="/strain" className={styles.gaugeLink}>
          <CircularGauge
            value={strainScore}
            maxValue={21}
            label="Strain"
            sublabel={getStrainLabel(strainScore)}
            colorStart={strainScore <= 10 ? '#00E676' : '#FFD600'}
            colorEnd={strainScore <= 10 ? '#69F0AE' : strainScore <= 17 ? '#FF6D00' : '#FF1744'}
            displayValue={strainScore.toFixed(1)}
          />
        </Link>
        <Link href="/recovery" className={styles.gaugeLink}>
          <CircularGauge
            value={recoveryScore}
            maxValue={100}
            label="Recovery"
            sublabel={getRecoveryLabel(recoveryScore) + ' Zone'}
            colorStart={recoveryScore <= 33 ? '#FF1744' : recoveryScore <= 66 ? '#FFD600' : '#00E676'}
            colorEnd={recoveryScore <= 33 ? '#FF6D00' : recoveryScore <= 66 ? '#69F0AE' : '#00E676'}
            displayValue={`${recoveryScore}%`}
          />
        </Link>
      </section>

      {/* Recovery Recommendation */}
      {recoveryResult && (
        <section className={`glass-card ${styles.recommendation} animate-in`} style={{ animationDelay: '0.1s' }}>
          <p className={styles.recText}>
            💡 {getRecoveryRecommendation(recoveryScore)}
          </p>
        </section>
      )}

      {/* Nutrition Summary */}
      <section className={`glass-card ${styles.section} animate-in`} style={{ animationDelay: '0.15s' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Nutrition</h2>
          <Link href="/nutrition" className={styles.seeAll}>See All</Link>
        </div>

        {settings.nutrition_mode === 'full' ? (
          <div className={styles.macros}>
            <ProgressBar
              value={totalCalories}
              maxValue={settings.calorie_goal}
              color="#E6EDF3"
              label="Calories"
              unit=" kcal"
            />
            <ProgressBar
              value={totalProtein}
              maxValue={settings.protein_goal}
              color="#7C4DFF"
              label="Protein"
              unit="g"
            />
            <ProgressBar
              value={totalCarbs}
              maxValue={settings.carbs_goal}
              color="#00BCD4"
              label="Carbs"
              unit="g"
            />
            <ProgressBar
              value={totalFat}
              maxValue={settings.fat_goal}
              color="#FF9100"
              label="Fat"
              unit="g"
            />
          </div>
        ) : (
          <div className={styles.macros}>
            <ProgressBar
              value={totalCalories}
              maxValue={settings.calorie_goal}
              color="#E6EDF3"
              label="Calories"
              unit=" kcal"
            />
          </div>
        )}
      </section>

      {/* Water Tracking */}
      <section className={`glass-card ${styles.section} animate-in`} style={{ animationDelay: '0.2s' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <IoWater style={{ color: '#448AFF', marginRight: '0.5rem' }} />
            Hydration
          </h2>
          <span className={styles.waterAmount}>{totalWater} / {settings.water_goal_oz} oz</span>
        </div>
        <ProgressBar
          value={totalWater}
          maxValue={settings.water_goal_oz}
          color="#448AFF"
          label=""
          showValue={false}
          height={12}
        />
        <div className={styles.waterButtons}>
          {[8, 12, 16, 24].map(oz => (
            <button
              key={oz}
              className={styles.waterBtn}
              onClick={() => addWaterLog(oz)}
            >
              +{oz}oz
            </button>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className={`${styles.quickActions} animate-in`} style={{ animationDelay: '0.25s' }}>
        <Link href="/nutrition?add=true" className={`glass-card ${styles.actionCard}`}>
          <IoAdd className={styles.actionIcon} style={{ color: '#00BCD4' }} />
          <span>Log Meal</span>
        </Link>
        <Link href="/workout" className={`glass-card ${styles.actionCard}`}>
          <IoBarbell className={styles.actionIcon} style={{ color: '#7C4DFF' }} />
          <span>Workout</span>
        </Link>
        <Link href="/morning" className={`glass-card ${styles.actionCard}`}>
          <IoSunny className={styles.actionIcon} style={{ color: '#FFD600' }} />
          <span>Morning</span>
        </Link>
        <Link href="/nutrition" className={`glass-card ${styles.actionCard}`}>
          <IoNutrition className={styles.actionIcon} style={{ color: '#69F0AE' }} />
          <span>Nutrition</span>
        </Link>
      </section>
    </div>
  );
}
