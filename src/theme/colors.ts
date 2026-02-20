// Dark mode color palette inspired by Whoop's aesthetic
export const colors = {
  // Backgrounds
  bg: {
    primary: '#0D1117',
    secondary: '#161B22',
    tertiary: '#1C2333',
    card: 'rgba(255, 255, 255, 0.04)',
    cardHover: 'rgba(255, 255, 255, 0.07)',
    glass: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
  },

  // Text
  text: {
    primary: '#E6EDF3',
    secondary: '#8B949E',
    tertiary: '#6E7681',
    inverse: '#0D1117',
  },

  // Strain gradient (green → yellow → red)
  strain: {
    low: '#00E676',      // 0-7
    medium: '#FFD600',   // 7-14
    high: '#FF6D00',     // 14-18
    max: '#FF1744',      // 18-21
    gradient: 'linear-gradient(135deg, #00E676 0%, #FFD600 40%, #FF6D00 70%, #FF1744 100%)',
  },

  // Recovery gradient (red → yellow → green)
  recovery: {
    low: '#FF1744',      // 0-33%
    medium: '#FFD600',   // 33-66%
    high: '#00E676',     // 66-100%
    gradient: 'linear-gradient(135deg, #FF1744 0%, #FFD600 50%, #00E676 100%)',
  },

  // Macros
  macros: {
    protein: '#7C4DFF',
    carbs: '#00BCD4',
    fat: '#FF9100',
    calories: '#E6EDF3',
    water: '#448AFF',
  },

  // Accents
  accent: {
    primary: '#58A6FF',
    success: '#00E676',
    warning: '#FFD600',
    error: '#FF1744',
    info: '#448AFF',
  },

  // HR Zones
  hrZones: {
    zone1: '#00E676',
    zone2: '#69F0AE',
    zone3: '#FFD600',
    zone4: '#FF6D00',
    zone5: '#FF1744',
  },
};

// Get strain color based on score (0-21)
export function getStrainColor(score: number): string {
  if (score <= 7) return colors.strain.low;
  if (score <= 14) return colors.strain.medium;
  if (score <= 18) return colors.strain.high;
  return colors.strain.max;
}

// Get recovery color based on percentage (0-100)
export function getRecoveryColor(score: number): string {
  if (score <= 33) return colors.recovery.low;
  if (score <= 66) return colors.recovery.medium;
  return colors.recovery.high;
}
