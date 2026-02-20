'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useRouter } from 'next/navigation';
import { IoSunny, IoChevronForward } from 'react-icons/io5';
import styles from './morning.module.css';

const EMOJIS = ['😫', '😐', '🙂', '😊', '💪'];

export default function MorningRoutinePage() {
    const { submitMorningRoutine } = useData();
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState({
        hrv: '',
        rhr: '',
        sleepHours: '',
        sleepQuality: 3,
        energy: 3,
        soreness: 3,
        stress: 3,
    });

    useEffect(() => { setMounted(true); }, []);

    const steps = [
        {
            title: 'Sleep',
            description: 'How long did you sleep last night?',
            field: 'sleepHours',
            type: 'number',
            placeholder: '7.5',
            unit: 'hours',
        },
        {
            title: 'Sleep Quality',
            description: 'How would you rate your sleep quality?',
            field: 'sleepQuality',
            type: 'slider',
            labels: ['Terrible', 'Poor', 'OK', 'Good', 'Great'],
        },
        {
            title: 'Heart Rate Variability',
            description: 'Open the Breathe app on your Apple Watch for 1 minute, then enter your HRV value.',
            field: 'hrv',
            type: 'number',
            placeholder: '45',
            unit: 'ms',
            optional: true,
        },
        {
            title: 'Resting Heart Rate',
            description: 'Check your Apple Watch Heart Rate app while still in bed.',
            field: 'rhr',
            type: 'number',
            placeholder: '62',
            unit: 'bpm',
            optional: true,
        },
        {
            title: 'Energy Level',
            description: 'How energized do you feel right now?',
            field: 'energy',
            type: 'slider',
            labels: ['Exhausted', 'Low', 'OK', 'Good', 'Energized'],
        },
        {
            title: 'Muscle Soreness',
            description: 'How sore are your muscles?',
            field: 'soreness',
            type: 'slider',
            labels: ['Very Sore', 'Sore', 'Some', 'Mild', 'None'],
        },
        {
            title: 'Stress Level',
            description: 'How stressed do you feel?',
            field: 'stress',
            type: 'slider',
            labels: ['Very High', 'High', 'Moderate', 'Low', 'None'],
        },
    ];

    const currentStep = steps[step];
    const isLast = step === steps.length - 1;

    const handleNext = () => {
        if (isLast) {
            submitMorningRoutine({
                hrv: data.hrv ? Number(data.hrv) : undefined,
                rhr: data.rhr ? Number(data.rhr) : undefined,
                sleepHours: data.sleepHours ? Number(data.sleepHours) : undefined,
                sleepQuality: data.sleepQuality,
                energy: data.energy,
                soreness: data.soreness,
                stress: data.stress,
            });
            router.push('/');
        } else {
            setStep(s => s + 1);
        }
    };

    if (!mounted) return null;

    return (
        <div className={styles.page}>
            {/* Progress */}
            <div className={styles.progress}>
                {steps.map((_, i) => (
                    <div
                        key={i}
                        className={`${styles.progressDot} ${i <= step ? styles.active : ''}`}
                    />
                ))}
            </div>

            <div className={styles.content}>
                <div className={styles.stepIcon}>
                    <IoSunny />
                </div>
                <h1 className={styles.stepTitle}>{currentStep.title}</h1>
                <p className={styles.stepDesc}>{currentStep.description}</p>

                {currentStep.type === 'number' && (
                    <div className={styles.inputGroup}>
                        <input
                            type="number"
                            className={styles.bigInput}
                            placeholder={currentStep.placeholder}
                            value={data[currentStep.field as keyof typeof data]}
                            onChange={e => setData(p => ({ ...p, [currentStep.field]: e.target.value }))}
                            step="0.1"
                        />
                        <span className={styles.inputUnit}>{currentStep.unit}</span>
                        {'optional' in currentStep && currentStep.optional && (
                            <p className={styles.optional}>Optional — skip if not available</p>
                        )}
                    </div>
                )}

                {currentStep.type === 'slider' && (
                    <div className={styles.sliderGroup}>
                        <div className={styles.emojiRow}>
                            {EMOJIS.map((emoji, i) => (
                                <button
                                    key={i}
                                    className={`${styles.emojiBtn} ${data[currentStep.field as keyof typeof data] === i + 1 ? styles.emojiActive : ''}`}
                                    onClick={() => setData(p => ({ ...p, [currentStep.field]: i + 1 }))}
                                >
                                    <span className={styles.emoji}>{emoji}</span>
                                    <span className={styles.emojiLabel}>{currentStep.labels?.[i]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.actions}>
                {step > 0 && (
                    <button className={styles.backBtn} onClick={() => setStep(s => s - 1)}>
                        Back
                    </button>
                )}
                <button className={styles.nextBtn} onClick={handleNext}>
                    {isLast ? 'Calculate Recovery' : 'Next'}
                    <IoChevronForward />
                </button>
            </div>
        </div>
    );
}
