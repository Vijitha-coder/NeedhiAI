import { StyleSheet, Text, View } from "react-native";

import type { RiskLevel } from "@/lib/mock-data";
import { colors, radii } from "@/lib/theme";

const stylesByLevel: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
  low: {
    bg: "rgba(45, 157, 111, 0.12)",
    text: colors.success,
    border: "rgba(45, 157, 111, 0.3)",
    dot: colors.success,
  },
  medium: {
    bg: "rgba(212, 160, 23, 0.15)",
    text: colors.warningForeground,
    border: "rgba(212, 160, 23, 0.35)",
    dot: colors.warning,
  },
  high: {
    bg: "rgba(220, 76, 76, 0.12)",
    text: colors.destructive,
    border: "rgba(220, 76, 76, 0.3)",
    dot: colors.destructive,
  },
};

const labels: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const tone = stylesByLevel[level];

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={[styles.dot, { backgroundColor: tone.dot }]} />
      <Text style={[styles.label, { color: tone.text }]}>{labels[level]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
  },
});
