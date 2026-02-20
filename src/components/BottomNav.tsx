'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoHome, IoFitness, IoHeart, IoNutrition, IoSettings } from 'react-icons/io5';
import styles from './BottomNav.module.css';

const navItems = [
    { href: '/', icon: IoHome, label: 'Home' },
    { href: '/strain', icon: IoFitness, label: 'Strain' },
    { href: '/recovery', icon: IoHeart, label: 'Recovery' },
    { href: '/nutrition', icon: IoNutrition, label: 'Nutrition' },
    { href: '/settings', icon: IoSettings, label: 'Settings' },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className={styles.nav}>
            {navItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                    >
                        <Icon className={styles.icon} />
                        <span className={styles.label}>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
