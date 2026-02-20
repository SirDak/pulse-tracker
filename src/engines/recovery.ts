/**
 * Recovery Calculation Engine
 * 
 * Composite score (0-100%) from weighted inputs:
 * - HRV vs. 7-day baseline (30%)
 * - Resting HR vs. 7-day baseline (25%)
 * - Sleep duration vs. target (20%)
 * - Sleep quality (10%)
 * - Previous day strain (10%)
 * - Subjective wellness (5%)
 * 
 * Adapts weights when inputs are missing.
 * Blends auto (HealthKit) and manual data.
 */

export interface RecoveryInputs {
    // HRV
    currentHRV: number | null;       // Today's SDNN in ms
    hrvBaseline: number[];           // Last 7 days of HRV values

    // Resting Heart Rate
    currentRHR: number | null;       // Today's resting HR
    rhrBaseline: number[];           // Last 7 days of RHR values

    // Sleep
    sleepHours: number | null;       // Hours slept last night
    sleepTarget: number;             // Target hours (default 8)
    sleepQuality: number | null;     // 1-5 subjective (or auto-derived)

    // Strain
    previousDayStrain: number | null; // Yesterday's strain score (0-21)

    // Subjective
    subjectiveEnergy: number | null;   // 1-5
    subjectiveSoreness: number | null; // 1-5 (5 = not sore)
    subjectiveStress: number | null;   // 1-5 (5 = not stressed)
}

export interface RecoveryResult {
    score: number;            // 0-100 final recovery score
    breakdown: {
        hrv: { score: number; weight: number; available: boolean };
        rhr: { score: number; weight: number; available: boolean };
        sleep: { score: number; weight: number; available: boolean };
        sleepQuality: { score: number; weight: number; available: boolean };
        strain: { score: number; weight: number; available: boolean };
        subjective: { score: number; weight: number; available: boolean };
    };
    dataCompleteness: number; // 0-100% how much data we have
}

// Default weights for each component
const BASE_WEIGHTS = {
    hrv: 0.30,
    rhr: 0.25,
    sleep: 0.20,
    sleepQuality: 0.10,
    strain: 0.10,
    subjective: 0.05,
};

// =====================================
// Component Scorers (each returns 0-100)
// =====================================

/**
 * Score HRV relative to personal baseline
 * Higher HRV than baseline = better recovery
 */
function scoreHRV(current: number, baseline: number[]): number {
    if (baseline.length === 0) return 50; // No baseline yet, assume neutral

    // Use median for robustness against outliers
    const sorted = [...baseline].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    if (median === 0) return 50;

    // Calculate % deviation from baseline
    const deviation = (current - median) / median;

    // Map deviation to 0-100 score
    // +20% above baseline = 100, -20% below = 0
    const score = 50 + (deviation / 0.20) * 50;

    return clamp(score, 1, 99);
}

/**
 * Score Resting HR relative to personal baseline
 * Lower RHR than baseline = better recovery
 */
function scoreRHR(current: number, baseline: number[]): number {
    if (baseline.length === 0) return 50;

    // Use lowest value as the "ideal" baseline
    const lowestBaseline = Math.min(...baseline);

    if (lowestBaseline === 0) return 50;

    // Calculate deviation (negative is good for RHR)
    const deviation = (lowestBaseline - current) / lowestBaseline;

    // Lower than baseline = higher score
    const score = 50 + (deviation / 0.15) * 50;

    return clamp(score, 1, 99);
}

/**
 * Score sleep duration vs. target
 */
function scoreSleep(hours: number, target: number): number {
    const ratio = hours / target;

    if (ratio >= 1.0) return Math.min(99, 80 + (ratio - 1.0) * 100); // Bonus for extra sleep
    if (ratio >= 0.875) return 70 + (ratio - 0.875) * 800; // 7-8 hours (if target is 8)
    if (ratio >= 0.75) return 40 + (ratio - 0.75) * 240;  // 6-7 hours
    return Math.max(1, ratio * 53);                          // Less than 6 hours
}

/**
 * Score sleep quality (1-5 → 0-100)
 */
function scoreSleepQuality(quality: number): number {
    return clamp((quality - 1) * 25, 1, 99); // 1→0, 2→25, 3→50, 4→75, 5→100
}

/**
 * Score previous day strain impact on recovery
 * Very high strain = lower recovery (body needs more recovery)
 * Moderate strain = neutral
 * Light strain = slightly higher recovery
 */
function scoreStrainImpact(strain: number): number {
    // Strain 0 → 70 (rest day, decent recovery)
    // Strain 10 → 50 (moderate, neutral)
    // Strain 18 → 20 (very high, recovery suffers)
    // Strain 21 → 10 (max, severe recovery impact)
    return clamp(70 - (strain * 3.3), 1, 99);
}

/**
 * Score subjective wellness (average of energy, soreness, stress)
 * Each is 1-5 scale, averaged and mapped to 0-100
 */
function scoreSubjective(
    energy: number | null,
    soreness: number | null,
    stress: number | null
): number {
    const values = [energy, soreness, stress].filter((v): v is number => v !== null);
    if (values.length === 0) return 50;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return clamp((avg - 1) * 25, 1, 99);
}

// =====================================
// Main Recovery Calculation
// =====================================

/**
 * Calculate recovery score (0-100%)
 * Adapts weights when inputs are missing
 */
export function calculateRecovery(inputs: RecoveryInputs): RecoveryResult {
    const breakdown = {
        hrv: { score: 0, weight: 0, available: false },
        rhr: { score: 0, weight: 0, available: false },
        sleep: { score: 0, weight: 0, available: false },
        sleepQuality: { score: 0, weight: 0, available: false },
        strain: { score: 0, weight: 0, available: false },
        subjective: { score: 0, weight: 0, available: false },
    };

    // Calculate individual scores and mark availability
    if (inputs.currentHRV !== null && inputs.hrvBaseline.length > 0) {
        breakdown.hrv = {
            score: scoreHRV(inputs.currentHRV, inputs.hrvBaseline),
            weight: BASE_WEIGHTS.hrv,
            available: true,
        };
    }

    if (inputs.currentRHR !== null && inputs.rhrBaseline.length > 0) {
        breakdown.rhr = {
            score: scoreRHR(inputs.currentRHR, inputs.rhrBaseline),
            weight: BASE_WEIGHTS.rhr,
            available: true,
        };
    }

    if (inputs.sleepHours !== null) {
        breakdown.sleep = {
            score: scoreSleep(inputs.sleepHours, inputs.sleepTarget),
            weight: BASE_WEIGHTS.sleep,
            available: true,
        };
    }

    if (inputs.sleepQuality !== null) {
        breakdown.sleepQuality = {
            score: scoreSleepQuality(inputs.sleepQuality),
            weight: BASE_WEIGHTS.sleepQuality,
            available: true,
        };
    }

    if (inputs.previousDayStrain !== null) {
        breakdown.strain = {
            score: scoreStrainImpact(inputs.previousDayStrain),
            weight: BASE_WEIGHTS.strain,
            available: true,
        };
    }

    const hasSubjective = inputs.subjectiveEnergy !== null ||
        inputs.subjectiveSoreness !== null ||
        inputs.subjectiveStress !== null;

    if (hasSubjective) {
        breakdown.subjective = {
            score: scoreSubjective(
                inputs.subjectiveEnergy,
                inputs.subjectiveSoreness,
                inputs.subjectiveStress
            ),
            weight: BASE_WEIGHTS.subjective,
            available: true,
        };
    }

    // Redistribute weights from missing components to available ones
    const availableComponents = Object.values(breakdown).filter(c => c.available);
    const totalAvailableWeight = availableComponents.reduce((sum, c) => sum + c.weight, 0);

    if (totalAvailableWeight === 0) {
        // No data at all — return neutral
        return {
            score: 50,
            breakdown,
            dataCompleteness: 0,
        };
    }

    // Normalize weights so they sum to 1.0
    availableComponents.forEach(c => {
        c.weight = c.weight / totalAvailableWeight;
    });

    // Calculate weighted composite score
    const score = availableComponents.reduce((sum, c) => sum + c.score * c.weight, 0);

    // Data completeness = what % of total weight we have data for
    const dataCompleteness = Math.round(totalAvailableWeight * 100);

    return {
        score: Math.round(clamp(score, 1, 99)),
        breakdown,
        dataCompleteness,
    };
}

// =====================================
// Utility
// =====================================

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Get a descriptive label for recovery score
 */
export function getRecoveryLabel(score: number): string {
    if (score <= 33) return 'Red';
    if (score <= 66) return 'Yellow';
    return 'Green';
}

/**
 * Get recovery recommendation based on score
 */
export function getRecoveryRecommendation(score: number): string {
    if (score <= 20) return 'Rest day recommended. Focus on sleep and nutrition.';
    if (score <= 33) return 'Light activity only. Active recovery, stretching, or walking.';
    if (score <= 50) return 'Moderate activity OK. Avoid high intensity.';
    if (score <= 66) return 'Good to train. Monitor how you feel during the session.';
    if (score <= 80) return 'Great recovery. You\'re ready for a solid session.';
    return 'Peak recovery! You\'re optimally recovered for a hard effort.';
}

/**
 * Calculate rolling median for baseline
 */
export function calculateBaseline(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}
