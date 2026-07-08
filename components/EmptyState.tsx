import { LinearGradient } from "expo-linear-gradient";
import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, gradients, radii, shadows } from "@/lib/theme";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <LinearGradient colors={gradients.primary} style={styles.icon}>
        <Icon size={36} color={colors.primaryForeground} />
      </LinearGradient>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  icon: {
    height: 80,
    width: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    ...shadows.soft,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.foreground,
    textAlign: "center",
  },
  body: {
    marginTop: 6,
    maxWidth: 280,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedForeground,
    textAlign: "center",
  },
});
