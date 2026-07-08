import { router } from "expo-router";
import { FileText, Star } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { RiskBadge } from "@/components/RiskBadge";
import type { Contract } from "@/lib/mock-data";
import { colors, radii, shadows } from "@/lib/theme";

export function ContractCard({ contract, compact }: { contract: Contract; compact?: boolean }) {
  return (
    <Pressable
      onPress={() => router.push(`/contract/${contract.id}`)}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compact,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <FileText size={20} color={colors.primary} />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {contract.title}
            </Text>
            {contract.favorite ? <Star size={16} color={colors.gold} fill={colors.gold} /> : null}
          </View>
          <View style={styles.meta}>
            <RiskBadge level={contract.risk} />
            <Text style={styles.metaText}>
              {contract.type} · {contract.pages} pages
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
    ...shadows.soft,
  },
  compact: {
    padding: 12,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  iconWrap: {
    height: 44,
    width: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
    lineHeight: 20,
  },
  meta: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
});
