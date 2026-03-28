const tintColorLight = "#FF6B35";
const tintColorDark = "#FF8A5B";

const Colors = {
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
  dark: {
    text: "#F3F4F6",
    background: "#0B0F14",
    tint: tintColorDark,
    tabIconDefault: "#6B7280",
    tabIconSelected: tintColorDark,
    card: "#111827",
    border: "#1F2937",
    secondary: "#9CA3AF",
    accent: "#1F2937",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#F87171",
    destructive: "#EF4444",
  },
} as const;

export type ColorSchemeName = keyof typeof Colors;
export type AppColors = (typeof Colors)[keyof typeof Colors];

export default Colors;

export const gradients = {
  primary: ['#FF6B35', '#F7931E'] as const,
  secondary: ['#FEF3C7', '#FDE68A'] as const,
  dark: ['#1F2937', '#374151'] as const,
};