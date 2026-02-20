'use client';

import React from 'react';
import styles from './CircularGauge.module.css';

interface CircularGaugeProps {
    value: number;
    maxValue: number;
    label: string;
    sublabel?: string;
    size?: number;
    strokeWidth?: number;
    colorStart: string;
    colorEnd: string;
    displayValue?: string;
}

export default function CircularGauge({
    value,
    maxValue,
    label,
    sublabel,
    size = 180,
    strokeWidth = 10,
    colorStart,
    colorEnd,
    displayValue,
}: CircularGaugeProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(value / maxValue, 1);
    const offset = circumference * (1 - percentage);

    const gradientId = `gauge-gradient-${label.replace(/\s/g, '')}`;

    return (
        <div className={styles.container} style={{ width: size, height: size }}>
            <svg width={size} height={size} className={styles.svg}>
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={colorStart} />
                        <stop offset="100%" stopColor={colorEnd} />
                    </linearGradient>
                </defs>

                {/* Background track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeWidth={strokeWidth}
                />

                {/* Progress arc */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={styles.progressArc}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </svg>

            <div className={styles.content}>
                <span className={styles.value}>{displayValue ?? value}</span>
                <span className={styles.label}>{label}</span>
                {sublabel && <span className={styles.sublabel}>{sublabel}</span>}
            </div>
        </div>
    );
}
