import { ChevronRight, FileText, Globe, Info, LifeBuoy, Moon, ShieldCheck, Type, type LucideIcon } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, radii } from "@/lib/theme";

export default function SettingsScreen() {
  const [dark, setDark] = useState(false);
  const [fontSize, setFontSize] = useState<"S" | "M" | "L">("M");

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Settings" back="/(tabs)/profile" />

      <Section title="Appearance">
        <Row icon={Moon} label="Dark mode">
          <Switch value={dark} onValueChange={setDark} trackColor={{ true: colors.primary }} />
        </Row>
        <Row icon={Type} label="Font size">
          <View style={styles.segment}>
            {(["S", "M", "L"] as const).map((size) => (
              <Pressable
                key={size}
                onPress={() => setFontSize(size)}
                style={[styles.segmentBtn, fontSize === size && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, fontSize === size && styles.segmentTextActive]}>{size}</Text>
              </Pressable>
            ))}
          </View>
        </Row>
        <Row icon={Globe} label="Language">
          <View style={styles.languageRow}>
            <Text style={styles.languageText}>English</Text>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </View>
        </Row>
      </Section>

      <Section title="About">
        <Row icon={Info} label="About NeedhiAI">
          <ChevronRight size={16} color={colors.mutedForeground} />
        </Row>
        <Row icon={LifeBuoy} label="Help & support">
          <ChevronRight size={16} color={colors.mutedForeground} />
        </Row>
        <Row icon={ShieldCheck} label="Privacy policy">
          <ChevronRight size={16} color={colors.mutedForeground} />
        </Row>
        <Row icon={FileText} label="Terms & conditions">
          <ChevronRight size={16} color={colors.mutedForeground} />
        </Row>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon size={16} color={colors.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 20 },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    height: 36,
    width: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: colors.foreground },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 2,
  },
  segmentBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  segmentBtnActive: { backgroundColor: colors.surfaceElevated },
  segmentText: { fontSize: 12, color: colors.mutedForeground, fontWeight: "500" },
  segmentTextActive: { color: colors.foreground },
  languageRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  languageText: { fontSize: 14, color: colors.mutedForeground },
});
