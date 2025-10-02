export const tokens = {
  colors: {
    bg: '#0E0E10',
    card: '#151518',
    surface: '#1B1B1F',
    text: '#FFFFFF',
    textDim: '#B9BBC6',
    primary: '#FF6B3D',
    border: '#2A2A30',
    success: '#16A34A',
    danger: '#EF4444',
    warning: '#F59E0B'
  },
  space: [0, 4, 8, 12, 16, 20, 24, 28, 32], // s0..s8
  radius: { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 },
  font: {
    family: 'Inter',
    size: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, h2: 28, h1: 34 },
    line: { xs: 16, sm: 20, md: 22, lg: 24, xl: 28, h2: 34, h1: 40 }
  },
  elevation: {
    sm: 2,
    md: 6,
    lg: 12
  }
};

// Spacing utility function
export const s = (n: number): number => tokens.space[n];
