'use client';

import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
    value: number;
    maxValue: number;
    color: string;
    label: string;
    unit?: string;
    showValue?: boolean;
    height?: number;
}

export default function ProgressBar({
    value,
    maxValue,
    color,
    label,
    unit = '',
    showValue = true,
    height = 8,
}: ProgressBarProps) {
    const percentage = Math.min((value / maxValue) * 100, 100);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.label}>{label}</span>
                {showValue && (
                    <span className={styles.value}>
                        {Math.round(value)}<span className={styles.unit}>/{maxValue}{unit}</span>
                    </span>
                )}
            </div>
            <div className={styles.track} style={{ height }}>
                <div
                    className={styles.fill}
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 8px ${color}44`,
                    }}
                />
            </div>
        </div>
    );
}
