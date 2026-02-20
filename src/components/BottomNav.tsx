'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoHome, IoFitness, IoHeart, IoSearch, IoAnalytics } from 'react-icons/io5';
import styles from './BottomNav.module.css';

const navItems = [
    { href: '/', icon: IoHome, label: 'Home' },
    { href: '/strain', icon: IoFitness, label: 'Strain' },
    { href: '/recovery', icon: IoHeart, label: 'Recovery' },
    { href: '/food', icon: IoSearch, label: 'Food' },
    { href: '/insights', icon: IoAnalytics, label: 'Insights' },
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
