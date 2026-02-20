'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useData } from '@/context/DataContext';
import ProgressBar from '@/components/ProgressBar';
import { format } from 'date-fns';
import { IoAdd, IoClose, IoSwapHorizontal } from 'react-icons/io5';
import { useSearchParams } from 'next/navigation';
import styles from './nutrition.module.css';

function NutritionContent() {
    const {
        settings,
        meals,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        totalWater,
        addMeal,
        addWaterLog,
        removeWaterLog,
        waterLogs,
        removeMeal,
        updateSettings,
    } = useData();

    const [mounted, setMounted] = useState(false);
    const [showAddMeal, setShowAddMeal] = useState(false);
    const [mealForm, setMealForm] = useState({
        meal_type: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        food_name: '',
        calories: '',
        protein_g: '',
        carbs_g: '',
        fat_g: '',
    });

    const searchParams = useSearchParams();

    useEffect(() => {
        setMounted(true);
        // Auto-open add modal if navigated from "Log Meal" quick action
        if (searchParams.get('add') === 'true') {
            setShowAddMeal(true);
        }
    }, [searchParams]);

    const handleAddMeal = () => {
        if (!mealForm.food_name || !mealForm.calories) return;
        addMeal({
            date: format(new Date(), 'yyyy-MM-dd'),
            meal_type: mealForm.meal_type,
            food_name: mealForm.food_name,
            serving_size: null,
            calories: Number(mealForm.calories),
            protein_g: Number(mealForm.protein_g) || 0,
            carbs_g: Number(mealForm.carbs_g) || 0,
            fat_g: Number(mealForm.fat_g) || 0,
        });
        setMealForm({ meal_type: 'lunch', food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' });
        setShowAddMeal(false);
    };

    const isSimple = settings.nutrition_mode === 'simple';

    if (!mounted) return null;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Nutrition</h1>
                    <p className={styles.subtitle}>{format(new Date(), 'EEEE, MMM d')}</p>
                </div>
                <button
                    className={styles.modeToggle}
                    onClick={() => updateSettings({ nutrition_mode: isSimple ? 'full' : 'simple' })}
                    title={isSimple ? 'Switch to full mode' : 'Switch to simple mode'}
                >
                    <IoSwapHorizontal />
                    <span>{isSimple ? 'Simple' : 'Full'}</span>
                </button>
            </header>

            {/* Daily Summary */}
            <section className={`glass-card ${styles.summary} animate-in`}>
                <div className={styles.calorieRing}>
                    <div className={styles.calorieValue}>{totalCalories}</div>
                    <div className={styles.calorieLabel}>of {settings.calorie_goal} kcal</div>
                    <div className={styles.calorieRemaining}>
                        {Math.max(0, settings.calorie_goal - totalCalories)} remaining
                    </div>
                </div>

                {!isSimple && (
                    <div className={styles.macroGrid}>
                        <div className={styles.macroItem}>
                            <div className={styles.macroValue} style={{ color: '#7C4DFF' }}>{totalProtein}g</div>
                            <ProgressBar value={totalProtein} maxValue={settings.protein_goal} color="#7C4DFF" label="Protein" unit="g" />
                        </div>
                        <div className={styles.macroItem}>
                            <div className={styles.macroValue} style={{ color: '#00BCD4' }}>{totalCarbs}g</div>
                            <ProgressBar value={totalCarbs} maxValue={settings.carbs_goal} color="#00BCD4" label="Carbs" unit="g" />
                        </div>
                        <div className={styles.macroItem}>
                            <div className={styles.macroValue} style={{ color: '#FF9100' }}>{totalFat}g</div>
                            <ProgressBar value={totalFat} maxValue={settings.fat_goal} color="#FF9100" label="Fat" unit="g" />
                        </div>
                    </div>
                )}
            </section>

            {/* Meals List */}
            <section className={`glass-card ${styles.section} animate-in`} style={{ animationDelay: '0.1s' }}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Today&apos;s Meals</h2>
                    <button className={styles.addBtn} onClick={() => setShowAddMeal(true)}>
                        <IoAdd /> Add
                    </button>
                </div>

                {meals.length === 0 ? (
                    <p className={styles.empty}>No meals logged yet. Tap &quot;Add&quot; to get started.</p>
                ) : (
                    <div className={styles.mealList}>
                        {meals.map(meal => (
                            <div key={meal.id} className={styles.mealItem}>
                                <div className={styles.mealInfo}>
                                    <div className={styles.mealName}>{meal.food_name}</div>
                                    <div className={styles.mealMeta}>
                                        {meal.meal_type} · {meal.calories} cal
                                        {!isSimple && ` · P:${meal.protein_g}g C:${meal.carbs_g}g F:${meal.fat_g}g`}
                                    </div>
                                </div>
                                <button className={styles.removeBtn} onClick={() => removeMeal(meal.id!)}>
                                    <IoClose />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Water */}
            <section className={`glass-card ${styles.section} animate-in`} style={{ animationDelay: '0.15s' }}>
                <h2 className={styles.sectionTitle}>💧 Water: {totalWater} / {settings.water_goal_oz} oz</h2>
                <ProgressBar value={totalWater} maxValue={settings.water_goal_oz} color="#448AFF" label="" showValue={false} height={12} />
                <div className={styles.waterButtons}>
                    {[8, 12, 16, 24].map(oz => (
                        <button key={oz} className={styles.waterBtn} onClick={() => addWaterLog(oz)}>+{oz}oz</button>
                    ))}
                    {waterLogs.length > 0 && (
                        <button
                            className={styles.waterBtn}
                            onClick={() => {
                                const last = waterLogs[waterLogs.length - 1];
                                if (last?.id) removeWaterLog(last.id);
                            }}
                            style={{ background: 'rgba(255,23,68,0.12)', borderColor: 'rgba(255,23,68,0.3)', color: '#FF6B6B' }}
                        >
                            Undo
                        </button>
                    )}
                </div>
            </section>

            {/* Add Meal Modal */}
            {showAddMeal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>Add Meal</h3>
                            <button onClick={() => setShowAddMeal(false)}><IoClose /></button>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Meal Type</label>
                            <select
                                value={mealForm.meal_type}
                                onChange={e => setMealForm(p => ({ ...p, meal_type: e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack' }))}
                                className={styles.select}
                            >
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="snack">Snack</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Food Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Chicken Breast"
                                value={mealForm.food_name}
                                onChange={e => setMealForm(p => ({ ...p, food_name: e.target.value }))}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Calories</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={mealForm.calories}
                                onChange={e => setMealForm(p => ({ ...p, calories: e.target.value }))}
                                className={styles.input}
                            />
                        </div>

                        {!isSimple && (
                            <div className={styles.macroInputs}>
                                <div className={styles.formGroup}>
                                    <label>Protein (g)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={mealForm.protein_g}
                                        onChange={e => setMealForm(p => ({ ...p, protein_g: e.target.value }))}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Carbs (g)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={mealForm.carbs_g}
                                        onChange={e => setMealForm(p => ({ ...p, carbs_g: e.target.value }))}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Fat (g)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={mealForm.fat_g}
                                        onChange={e => setMealForm(p => ({ ...p, fat_g: e.target.value }))}
                                        className={styles.input}
                                    />
                                </div>
                            </div>
                        )}

                        <button className={styles.submitBtn} onClick={handleAddMeal}>
                            Add Meal
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function NutritionPage() {
    return (
        <Suspense fallback={<div style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>Loading...</div>}>
            <NutritionContent />
        </Suspense>
    );
}
