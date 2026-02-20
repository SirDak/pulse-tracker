'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { IoAdd, IoClose, IoBarbell } from 'react-icons/io5';
import styles from './workout.module.css';

interface ExerciseEntry {
    exercise: string;
    sets: string;
    reps: string;
    weight_lbs: string;
}

export default function WorkoutPage() {
    const { addWorkout, workouts } = useData();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [workoutType, setWorkoutType] = useState('Strength Training');
    const [duration, setDuration] = useState('');
    const [avgHR, setAvgHR] = useState('');
    const [exercises, setExercises] = useState<ExerciseEntry[]>([
        { exercise: '', sets: '', reps: '', weight_lbs: '' },
    ]);

    useEffect(() => { setMounted(true); }, []);

    const addExercise = () => {
        setExercises(prev => [...prev, { exercise: '', sets: '', reps: '', weight_lbs: '' }]);
    };

    const removeExercise = (index: number) => {
        setExercises(prev => prev.filter((_, i) => i !== index));
    };

    const updateExercise = (index: number, field: keyof ExerciseEntry, value: string) => {
        setExercises(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
    };

    const totalVolume = exercises.reduce((sum, e) => {
        return sum + (Number(e.sets) || 0) * (Number(e.reps) || 0) * (Number(e.weight_lbs) || 0);
    }, 0);

    const handleSubmit = async () => {
        const sets = exercises
            .filter(e => e.exercise.trim())
            .map(e => ({
                exercise: e.exercise,
                sets: Number(e.sets) || 1,
                reps: Number(e.reps) || null,
                weight_lbs: Number(e.weight_lbs) || null,
            }));
        await addWorkout(
            {
                date: format(new Date(), 'yyyy-MM-dd'),
                workout_type: workoutType,
                duration_min: Number(duration) || 0,
                avg_hr_bpm: avgHR ? Number(avgHR) : null,
                max_hr_bpm: null,
                calories_burned: null,
            },
            sets,
        );
        router.push('/');
    };

    if (!mounted) return null;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Log Workout</h1>
            </header>

            <section className={`glass-card ${styles.section}`}>
                <div className={styles.formGroup}>
                    <label>Workout Type</label>
                    <select
                        value={workoutType}
                        onChange={e => setWorkoutType(e.target.value)}
                        className={styles.select}
                    >
                        <option>Strength Training</option>
                        <option>Running</option>
                        <option>Cycling</option>
                        <option>Swimming</option>
                        <option>HIIT</option>
                        <option>Yoga</option>
                        <option>Walking</option>
                        <option>Other</option>
                    </select>
                </div>

                <div className={styles.row}>
                    <div className={styles.formGroup}>
                        <label>Duration (min)</label>
                        <input
                            type="number"
                            placeholder="60"
                            value={duration}
                            onChange={e => setDuration(e.target.value)}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Avg HR (optional)</label>
                        <input
                            type="number"
                            placeholder="145"
                            value={avgHR}
                            onChange={e => setAvgHR(e.target.value)}
                            className={styles.input}
                        />
                    </div>
                </div>
            </section>

            {/* Exercises */}
            <section className={`glass-card ${styles.section}`}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <IoBarbell style={{ marginRight: '0.5rem' }} />
                        Exercises
                    </h2>
                    {totalVolume > 0 && (
                        <span className={styles.volumeLabel}>
                            {totalVolume.toLocaleString()} lbs total volume
                        </span>
                    )}
                </div>

                {exercises.map((exercise, index) => (
                    <div key={index} className={styles.exerciseCard}>
                        <div className={styles.exerciseHeader}>
                            <input
                                type="text"
                                placeholder="Exercise name"
                                value={exercise.exercise}
                                onChange={e => updateExercise(index, 'exercise', e.target.value)}
                                className={styles.exerciseNameInput}
                            />
                            {exercises.length > 1 && (
                                <button className={styles.removeExBtn} onClick={() => removeExercise(index)}>
                                    <IoClose />
                                </button>
                            )}
                        </div>
                        <div className={styles.exerciseRow}>
                            <div className={styles.miniGroup}>
                                <label>Sets</label>
                                <input type="number" placeholder="3" value={exercise.sets}
                                    onChange={e => updateExercise(index, 'sets', e.target.value)} className={styles.miniInput} />
                            </div>
                            <span className={styles.times}>×</span>
                            <div className={styles.miniGroup}>
                                <label>Reps</label>
                                <input type="number" placeholder="10" value={exercise.reps}
                                    onChange={e => updateExercise(index, 'reps', e.target.value)} className={styles.miniInput} />
                            </div>
                            <span className={styles.times}>@</span>
                            <div className={styles.miniGroup}>
                                <label>Weight (lbs)</label>
                                <input type="number" placeholder="135" value={exercise.weight_lbs}
                                    onChange={e => updateExercise(index, 'weight_lbs', e.target.value)} className={styles.miniInput} />
                            </div>
                        </div>
                    </div>
                ))}

                <button className={styles.addExBtn} onClick={addExercise}>
                    <IoAdd /> Add Exercise
                </button>
            </section>

            <button className={styles.submitBtn} onClick={handleSubmit}>
                Save Workout
            </button>
        </div>
    );
}
