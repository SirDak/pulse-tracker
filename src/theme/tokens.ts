export const typography = {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

    fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem', // 36px
        '5xl': '3rem',    // 48px
        score: '4.5rem',  // 72px - for big score displays
    },

    fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
    },

    lineHeight: {
        tight: 1.1,
        normal: 1.5,
        relaxed: 1.75,
    },
};

export const spacing = {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
};

export const borderRadius = {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px',
};

export const shadows = {
    card: '0 2px 8px rgba(0, 0, 0, 0.3)',
    elevated: '0 8px 32px rgba(0, 0, 0, 0.4)',
    glow: (color: string) => `0 0 20px ${color}33, 0 0 60px ${color}11`,
};
