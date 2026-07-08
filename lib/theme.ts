import { StyleSheet } from "react-native";

export const colors = {
  background: "#faf9f7",
  foreground: "#2a2d42",
  surface: "#f5f4f1",
  surfaceElevated: "#ffffff",
  card: "#ffffff",
  primary: "#1a1e3a",
  primaryForeground: "#faf9f7",
  primarySoft: "#e8eaf5",
  secondary: "#f0f1f5",
  secondaryForeground: "#1a1e3a",
  mutedForeground: "#6b7089",
  border: "#e5e6ec",
  gold: "#d4a853",
  goldForeground: "#3d3020",
  success: "#2d9d6f",
  successForeground: "#faf9f7",
  warning: "#d4a017",
  warningForeground: "#3d3020",
  destructive: "#dc4c4c",
  destructiveForeground: "#faf9f7",
} as const;

export const gradients = {
  primary: ["#1a1e3a", "#3d3a7a"] as const,
  gold: ["#e8c06a", "#c9953d"] as const,
  hero: ["#1a1e3a", "#2a2858", "#3d3a7a"] as const,
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 999,
} as const;

export const shadows = StyleSheet.create({
  soft: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  elevated: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
});

export const fonts = {
  display: "System",
  body: "System",
};
