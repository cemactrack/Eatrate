const tintColorLight = "#FF6B35";

export default {
  light: {
    text: "#1A1A1A",
    background: "#FFFFFF",
    tint: tintColorLight,
    tabIconDefault: "#9CA3AF",
    tabIconSelected: tintColorLight,
    card: "#FFFFFF",
    border: "#E5E7EB",
    secondary: "#6B7280",
    accent: "#FEF3C7",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    destructive: "#EF4444",
  },
};

export const gradients = {
  primary: ['#FF6B35', '#F7931E'] as const,
  secondary: ['#FEF3C7', '#FDE68A'] as const,
  dark: ['#1F2937', '#374151'] as const,
};