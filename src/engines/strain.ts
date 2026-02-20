/**
 * Strain Calculation Engine
 * 
 * Emulates Whoop's strain scoring using:
 * 1. HR zone-weighted cardiovascular load (modified TRIMP)
 * 2. Mechanical strain from resistance training volume
 * 3. Non-linear mapping to 0-21 Borg scale
 */

import type { HeartRateSample, WorkoutSet } from '@/lib/supabase';

// =====================================
// HR Zone Configuration
// =====================================

export interface HRZones {
    zone1: { min: number; max: number }; // 50-60% HRR
    zone2: { min: number; max: number }; // 60-70% HRR
    zone3: { min: number; max: number }; // 70-80% HRR
    zone4: { min: number; max: number }; // 80-90% HRR
    zone5: { min: number; max: number }; // 90-100% HRR
}

// Zone weights — higher zones contribute exponentially more strain
const ZONE_WEIGHTS = {
    zone1: 1,
    zone2: 2,
    zone3: 3,
    zone4: 5,
    zone5: 8,
};

// Strain calibration constant — controls how quickly strain accumulates
// Calibrated so a max-effort day scores ~18-20
const STRAIN_K = 0.00035;

// Mechanical strain scaling factor
const MECHANICAL_K = 0.000015;

// =====================================
// Max HR & Zone Calculation
// =====================================

/**
 * Estimate Max HR using Gellish non-linear formula
 * More accurate than the old 220-age formula
 */
export function estimateMaxHR(age: number): number {
    return Math.round(207 - 0.7 * age);
}

/**
 * Calculate HR zones using Heart Rate Reserve (HRR) method
 * HRR = MaxHR - RestingHR
 * Zone threshold = RestingHR + (HRR × percentage)
 */
export function calculateHRZones(maxHR: number, restingHR: number): HRZones {
    const hrr = maxHR - restingHR;

    return {
        zone1: { min: Math.round(restingHR + hrr * 0.50), max: Math.round(restingHR + hrr * 0.60) },
        zone2: { min: Math.round(restingHR + hrr * 0.60), max: Math.round(restingHR + hrr * 0.70) },
        zone3: { min: Math.round(restingHR + hrr * 0.70), max: Math.round(restingHR + hrr * 0.80) },
        zone4: { min: Math.round(restingHR + hrr * 0.80), max: Math.round(restingHR + hrr * 0.90) },
        zone5: { min: Math.round(restingHR + hrr * 0.90), max: maxHR },
    };
}

/**
 * Determine which HR zone a given BPM falls into
 */
export function getHRZone(bpm: number, zones: HRZones): keyof typeof ZONE_WEIGHTS | null {
    if (bpm >= zones.zone5.min) return 'zone5';
    if (bpm >= zones.zone4.min) return 'zone4';
    if (bpm >= zones.zone3.min) return 'zone3';
    if (bpm >= zones.zone2.min) return 'zone2';
    if (bpm >= zones.zone1.min) return 'zone1';
    return null; // Below zone 1
}

// =====================================
// Strain Calculation
// =====================================

export interface StrainResult {
    score: number;           // 0-21 final strain score
    cardiovascularStrain: number;
    mechanicalStrain: number;
    rawStrain: number;
    zoneMinutes: {
        zone1: number;
        zone2: number;
        zone3: number;
        zone4: number;
        zone5: number;
        below: number;
    };
    totalActiveMinutes: number;
}

/**
 * Calculate cardiovascular strain from heart rate samples
 * 
 * @param samples - Array of HR samples with timestamps
 * @param zones - Calculated HR zones for this user
 * @returns Raw cardiovascular strain value (pre-scaling)
 */
export function calculateCardiovascularStrain(
    samples: HeartRateSample[],
    zones: HRZones
): { rawStrain: number; zoneMinutes: StrainResult['zoneMinutes'] } {
    const zoneMinutes = {
        zone1: 0,
        zone2: 0,
        zone3: 0,
        zone4: 0,
        zone5: 0,
        below: 0,
    };

    if (samples.length < 2) {
        return { rawStrain: 0, zoneMinutes };
    }

    // Sort samples by timestamp
    const sorted = [...samples].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let rawStrain = 0;

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const timeDeltaMin = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 60000;

        // Skip gaps larger than 10 minutes (likely sensor was off)
        if (timeDeltaMin > 10) continue;

        const zone = getHRZone(curr.bpm, zones);

        if (zone) {
            zoneMinutes[zone] += timeDeltaMin;
            rawStrain += timeDeltaMin * ZONE_WEIGHTS[zone];
        } else {
            zoneMinutes.below += timeDeltaMin;
        }
    }

    return { rawStrain, zoneMinutes };
}

/**
 * Calculate mechanical strain from resistance training
 * 
 * @param sets - Array of workout sets with exercise details
 * @param avgHR - Average heart rate during the workout (for intensity factor)
 * @param maxHR - User's max HR
 * @param restingHR - User's resting HR
 * @param personalFactor - Learned personal intensity factor (1.0 = population avg)
 */
export function calculateMechanicalStrain(
    sets: WorkoutSet[],
    avgHR: number | null,
    maxHR: number,
    restingHR: number,
    personalFactor: number = 1.0
): number {
    if (sets.length === 0) return 0;

    // Total volume = sum of (sets × reps × weight)
    const totalVolume = sets.reduce((sum, set) => {
        return sum + (set.sets * (set.reps ?? 0) * (set.weight_lbs ?? 0));
    }, 0);

    // Intensity factor based on HR during workout
    let intensityFactor = personalFactor;
    if (avgHR !== null) {
        const hrr = maxHR - restingHR;
        const hrIntensity = (avgHR - restingHR) / hrr;
        intensityFactor *= (0.5 + hrIntensity); // Scale from 0.5 to 1.5 based on HR
    }

    return totalVolume * MECHANICAL_K * intensityFactor;
}

/**
 * Calculate final strain score (0-21)
 * Uses logarithmic curve that makes it progressively harder to increase
 * (similar to Whoop's non-linear scaling)
 */
export function calculateStrainScore(
    samples: HeartRateSample[],
    workoutSets: WorkoutSet[],
    age: number,
    restingHR: number,
    avgWorkoutHR: number | null = null,
    personalFactor: number = 1.0,
    actualMaxHR?: number
): StrainResult {
    const estimatedMax = estimateMaxHR(age);
    const maxHR = actualMaxHR ? Math.max(estimatedMax, actualMaxHR) : estimatedMax;
    const zones = calculateHRZones(maxHR, restingHR);

    const { rawStrain: cvRaw, zoneMinutes } = calculateCardiovascularStrain(samples, zones);
    const mechRaw = calculateMechanicalStrain(workoutSets, avgWorkoutHR, maxHR, restingHR, personalFactor);

    const totalRaw = cvRaw + mechRaw;

    // Non-linear mapping: strain = 21 × (1 - e^(-k × raw))
    const score = Math.min(21, Math.max(0, 21 * (1 - Math.exp(-STRAIN_K * totalRaw))));

    const totalActiveMinutes = Object.entries(zoneMinutes)
        .filter(([key]) => key !== 'below')
        .reduce((sum, [, val]) => sum + val, 0);

    return {
        score: Math.round(score * 10) / 10,
        cardiovascularStrain: Math.round(21 * (1 - Math.exp(-STRAIN_K * cvRaw)) * 10) / 10,
        mechanicalStrain: Math.round(21 * (1 - Math.exp(-STRAIN_K * mechRaw)) * 10) / 10,
        rawStrain: totalRaw,
        zoneMinutes: {
            zone1: Math.round(zoneMinutes.zone1),
            zone2: Math.round(zoneMinutes.zone2),
            zone3: Math.round(zoneMinutes.zone3),
            zone4: Math.round(zoneMinutes.zone4),
            zone5: Math.round(zoneMinutes.zone5),
            below: Math.round(zoneMinutes.below),
        },
        totalActiveMinutes: Math.round(totalActiveMinutes),
    };
}

// =====================================
// Utility
// =====================================

/**
 * Get a descriptive label for a strain score
 */
export function getStrainLabel(score: number): string {
    if (score <= 4) return 'Light';
    if (score <= 8) return 'Low';
    if (score <= 13) return 'Medium';
    if (score <= 17) return 'High';
    return 'All Out';
}

/**
 * Get strain percentage (0-100) for UI gauges
 */
export function getStrainPercentage(score: number): number {
    return Math.round((score / 21) * 100);
}
