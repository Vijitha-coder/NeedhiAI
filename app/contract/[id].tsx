import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  AlertTriangle,
  ChevronDown,
  Download,
  Lightbulb,
  MessageSquare,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { RiskBadge } from "@/components/RiskBadge";
import { ScreenHeader } from "@/components/ScreenHeader";
import { contractSections, mockContracts, riskyClauses, type RiskLevel } from "@/lib/mock-data";
import { colors, gradients, radii, shadows } from "@/lib/theme";

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contract = mockContracts.find((item) => item.id === id);
  const [tab, setTab] = useState<"summary" | "risk">("summary");

  if (!contract) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Not found" back="/(tabs)/history" />
        <Text style={styles.notFound}>We couldn't find that contract.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Analysis"
        subtitle={contract.type}
        back="/(tabs)/history"
        right={
          <View style={styles.headerActions}>
            <IconBtn><Star size={16} color={colors.foreground} /></IconBtn>
            <IconBtn><Share2 size={16} color={colors.foreground} /></IconBtn>
            <IconBtn><Download size={16} color={colors.foreground} /></IconBtn>
          </View>
        }
      />

      <View style={styles.summaryCard}>
        <Text style={styles.contractTitle}>{contract.title}</Text>
        <View style={styles.metaRow}>
          <RiskBadge level={contract.risk} />
          <Text style={styles.metaText}>
            {contract.pages} pages · Analyzed {new Date(contract.uploadedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {(["summary", "risk"] as const).map((value) => (
          <Pressable
            key={value}
            onPress={() => setTab(value)}
            style={[styles.tabBtn, tab === value && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === value && styles.tabTextActive]}>
              {value === "summary" ? "Summary" : "Risk analysis"}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "summary" ? <SummaryTab /> : <RiskTab score={contract.riskScore} level={contract.risk} />}

      <Pressable onPress={() => router.push("/(tabs)/chat")} style={styles.chatCard}>
        <LinearGradient colors={gradients.hero} style={styles.chatGradient}>
          <View style={styles.chatIcon}>
            <MessageSquare size={20} color={colors.gold} />
          </View>
          <View style={styles.chatCopy}>
            <Text style={styles.chatTitle}>Ask NeedhiAI</Text>
            <Text style={styles.chatSubtitle}>Questions about this contract?</Text>
          </View>
          <Text style={styles.chatArrow}>→</Text>
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <Pressable style={styles.iconBtn}>
      {children}
    </Pressable>
  );
}

function SummaryTab() {
  const [open, setOpen] = useState("summary");

  return (
    <View style={styles.accordion}>
      {contractSections.map((section) => {
        const isOpen = open === section.key;
        return (
          <View key={section.key} style={styles.accordionItem}>
            <Pressable onPress={() => setOpen(isOpen ? "" : section.key)} style={styles.accordionHeader}>
              <Text style={styles.accordionTitle}>{section.title}</Text>
              <ChevronDown
                size={16}
                color={colors.mutedForeground}
                style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
              />
            </Pressable>
            {isOpen ? <Text style={styles.accordionBody}>{section.body}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

function RiskTab({ score, level }: { score: number; level: RiskLevel }) {
  const Icon = level === "low" ? ShieldCheck : level === "medium" ? Shield : ShieldAlert;
  const tone =
    level === "low"
      ? { bg: "rgba(45,157,111,0.12)", text: colors.success }
      : level === "medium"
        ? { bg: "rgba(212,160,23,0.15)", text: colors.warningForeground }
        : { bg: "rgba(220,76,76,0.12)", text: colors.destructive };

  const circumference = 264;
  const dash = (score / 100) * circumference;

  return (
    <View>
      <LinearGradient colors={gradients.hero} style={styles.riskHero}>
        <View style={styles.riskRow}>
          <View style={styles.ringWrap}>
            <Svg width={96} height={96} viewBox="0 0 100 100" style={{ transform: [{ rotate: "-90deg" }] }}>
              <Circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
              <Circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={colors.gold}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={styles.ringScore}>{score}</Text>
              <Text style={styles.ringLabel}>of 100</Text>
            </View>
          </View>
          <View style={styles.riskCopy}>
            <View style={[styles.riskBadge, { backgroundColor: tone.bg }]}>
              <Icon size={14} color={tone.text} />
              <Text style={[styles.riskBadgeText, { color: tone.text }]}>
                {level === "low" ? "Low risk" : level === "medium" ? "Medium risk" : "High risk"}
              </Text>
            </View>
            <Text style={styles.riskText}>
              We flagged {riskyClauses.length} clauses that need your attention before signing.
            </Text>
          </View>
        </View>
      </LinearGradient>

      <Text style={styles.sectionHeading}>Risky clauses</Text>
      <View style={styles.clauseList}>
        {riskyClauses.map((clause) => (
          <View key={clause.title} style={styles.clauseCard}>
            <View style={styles.clauseHeader}>
              <View style={styles.clauseTitleRow}>
                <AlertTriangle
                  size={16}
                  color={clause.level === "high" ? colors.destructive : colors.warningForeground}
                />
                <Text style={styles.clauseTitle}>{clause.title}</Text>
              </View>
              <RiskBadge level={clause.level} />
            </View>
            <Text style={styles.clauseNote}>{clause.note}</Text>
          </View>
        ))}
      </View>

      <View style={styles.recommendation}>
        <View style={styles.recommendationHeader}>
          <Lightbulb size={16} color={colors.goldForeground} />
          <Text style={styles.recommendationTitle}>AI recommendation</Text>
        </View>
        <Text style={styles.recommendationBody}>
          Negotiate a price-lock addendum capping increases at 5%, and shorten the notice period from 90 to 30 days.
          These two changes alone would drop the risk score to <Text style={styles.bold}>42</Text>.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
  notFound: { paddingHorizontal: 20, fontSize: 14, color: colors.mutedForeground },
  headerActions: { flexDirection: "row", gap: 6 },
  iconBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    marginHorizontal: 20,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
    ...shadows.soft,
  },
  contractTitle: { fontSize: 14, fontWeight: "500", color: colors.foreground, lineHeight: 20 },
  metaRow: { marginTop: 8, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  metaText: { fontSize: 12, color: colors.mutedForeground },
  tabs: {
    marginTop: 20,
    marginHorizontal: 20,
    flexDirection: "row",
    backgroundColor: colors.secondary,
    borderRadius: radii.lg,
    padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: radii.md, alignItems: "center" },
  tabBtnActive: { backgroundColor: colors.surfaceElevated, ...shadows.soft },
  tabText: { fontSize: 14, fontWeight: "500", color: colors.mutedForeground },
  tabTextActive: { color: colors.foreground },
  accordion: { marginTop: 20, paddingHorizontal: 20, gap: 10 },
  accordionItem: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  accordionTitle: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  accordionBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedForeground,
  },
  riskHero: {
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: radii.xl,
    padding: 20,
    ...shadows.elevated,
  },
  riskRow: { flexDirection: "row", gap: 20, alignItems: "center" },
  ringWrap: { width: 96, height: 96, alignItems: "center", justifyContent: "center" },
  ringCenter: { position: "absolute", alignItems: "center" },
  ringScore: { fontSize: 28, fontWeight: "600", color: colors.primaryForeground },
  ringLabel: { fontSize: 10, color: "rgba(250,249,247,0.7)", textTransform: "uppercase" },
  riskCopy: { flex: 1 },
  riskBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  riskBadgeText: { fontSize: 12, fontWeight: "600" },
  riskText: { marginTop: 8, fontSize: 14, lineHeight: 20, color: "rgba(250,249,247,0.85)" },
  sectionHeading: {
    marginTop: 24,
    marginHorizontal: 20,
    fontSize: 18,
    fontWeight: "600",
    color: colors.foreground,
  },
  clauseList: { marginTop: 12, paddingHorizontal: 20, gap: 10 },
  clauseCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
  },
  clauseHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  clauseTitleRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  clauseTitle: { flex: 1, fontSize: 14, fontWeight: "500", color: colors.foreground },
  clauseNote: { marginTop: 8, fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
  recommendation: {
    marginTop: 24,
    marginHorizontal: 20,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(212,168,83,0.4)",
    backgroundColor: "rgba(212,168,83,0.1)",
    padding: 16,
  },
  recommendationHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  recommendationTitle: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  recommendationBody: { fontSize: 14, lineHeight: 20, color: colors.mutedForeground },
  bold: { fontWeight: "600", color: colors.foreground },
  chatCard: { marginTop: 24, marginHorizontal: 20, borderRadius: radii.lg, overflow: "hidden" },
  chatGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  chatIcon: {
    height: 40,
    width: 40,
    borderRadius: radii.md,
    backgroundColor: "rgba(212,168,83,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatCopy: { flex: 1 },
  chatTitle: { fontSize: 14, fontWeight: "500", color: colors.primaryForeground },
  chatSubtitle: { fontSize: 12, color: "rgba(250,249,247,0.7)" },
  chatArrow: { fontSize: 18, color: colors.primaryForeground },
});
