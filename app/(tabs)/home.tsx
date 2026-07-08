import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Bell,
  Clock,
  FileText,
  ListChecks,
  ScanLine,
  Search,
  ShieldAlert,
  Sparkles,
  Upload,
} from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ContractCard } from "@/components/ContractCard";
import { mockContracts, mockUser } from "@/lib/mock-data";
import { colors, gradients, radii, shadows } from "@/lib/theme";

const quickActions = [
  { route: "/upload", icon: Upload, label: "Upload Contract", desc: "PDF or DOCX", tone: "primary" as const },
  { route: "/scan", icon: ScanLine, label: "Scan Contract", desc: "Use camera", tone: "gold" as const },
  { route: "/history", icon: Clock, label: "View History", desc: "Recent analyses", tone: "surface" as const },
  { route: "/chat", icon: Sparkles, label: "AI Assistant", desc: "Ask a question", tone: "primary" as const },
];

const stats = [
  { icon: FileText, label: "Contracts analyzed", value: "24", tone: colors.primary },
  { icon: ShieldAlert, label: "High-risk", value: "3", tone: colors.destructive },
  { icon: ListChecks, label: "Pending review", value: "5", tone: colors.goldForeground },
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <View style={styles.userRow}>
          <LinearGradient colors={gradients.primary} style={styles.avatar}>
            <Text style={styles.avatarText}>{mockUser.avatar}</Text>
          </LinearGradient>
          <View>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.name}>{mockUser.name.split(" ")[0]}</Text>
          </View>
        </View>
        <Pressable onPress={() => router.push("/notifications")} style={styles.bellBtn}>
          <Bell size={18} color={colors.foreground} />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      <Pressable onPress={() => router.push("/search")} style={styles.searchBar}>
        <Search size={16} color={colors.mutedForeground} />
        <Text style={styles.searchPlaceholder}>Search contracts, clauses…</Text>
      </Pressable>

      <LinearGradient colors={gradients.hero} style={styles.insightCard}>
        <View style={styles.insightBadge}>
          <Sparkles size={12} color={colors.gold} />
          <Text style={styles.insightBadgeText}>AI insight</Text>
        </View>
        <Text style={styles.insightTitle}>
          Your Cloudline SaaS contract auto-renews in <Text style={styles.goldText}>70 days</Text>.
        </Text>
        <Text style={styles.insightBody}>Send termination notice before 15 Sep to renegotiate.</Text>
        <Pressable onPress={() => router.push("/contract/c-001")} style={styles.insightBtn}>
          <Text style={styles.insightBtnText}>Review contract →</Text>
        </Pressable>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.grid}>
        {quickActions.map((action) => (
          <Pressable key={action.route} onPress={() => router.push(action.route as never)} style={styles.actionCard}>
            <View
              style={[
                styles.actionIcon,
                action.tone === "primary" && styles.actionIconPrimary,
                action.tone === "gold" && styles.actionIconGold,
              ]}
            >
              <action.icon size={20} color={action.tone === "gold" ? colors.goldForeground : colors.primary} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
            <Text style={styles.actionDesc}>{action.desc}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>This month</Text>
      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <stat.icon size={16} color={stat.tone} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Recently analyzed</Text>
        <Pressable onPress={() => router.push("/history")}>
          <Text style={styles.viewAll}>View all</Text>
        </Pressable>
      </View>
      <View style={styles.list}>
        {mockContracts.slice(0, 3).map((contract) => (
          <ContractCard key={contract.id} contract={contract} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, paddingBottom: 32, gap: 0 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primaryForeground, fontWeight: "600" },
  welcome: { fontSize: 12, color: colors.mutedForeground },
  name: { fontSize: 18, fontWeight: "600", color: colors.foreground },
  bellBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 8,
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: colors.destructive,
  },
  searchBar: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...shadows.soft,
  },
  searchPlaceholder: { fontSize: 14, color: colors.mutedForeground },
  insightCard: {
    marginTop: 24,
    borderRadius: radii.xl,
    padding: 20,
    ...shadows.elevated,
  },
  insightBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(250,249,247,0.15)",
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  insightBadgeText: { color: colors.primaryForeground, fontSize: 11, fontWeight: "500" },
  insightTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "500",
    color: colors.primaryForeground,
    lineHeight: 24,
  },
  goldText: { color: colors.gold },
  insightBody: { marginTop: 4, fontSize: 14, color: "rgba(250,249,247,0.75)" },
  insightBtn: {
    marginTop: 16,
    alignSelf: "flex-start",
    backgroundColor: colors.gold,
    borderRadius: radii.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  insightBtnText: { color: colors.goldForeground, fontSize: 12, fontWeight: "600" },
  sectionTitle: { marginTop: 28, marginBottom: 12, fontSize: 18, fontWeight: "600", color: colors.foreground },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: {
    width: "47%",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    padding: 16,
    ...shadows.soft,
  },
  actionIcon: {
    height: 40,
    width: 40,
    borderRadius: radii.md,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionIconPrimary: { backgroundColor: colors.primarySoft },
  actionIconGold: { backgroundColor: "rgba(212,168,83,0.2)" },
  actionLabel: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  actionDesc: { marginTop: 2, fontSize: 12, color: colors.mutedForeground },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 12,
    ...shadows.soft,
  },
  statValue: { marginTop: 12, fontSize: 24, fontWeight: "600", color: colors.foreground },
  statLabel: { marginTop: 2, fontSize: 11, color: colors.mutedForeground, lineHeight: 14 },
  recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  viewAll: { fontSize: 12, color: colors.primary, fontWeight: "500" },
  list: { gap: 10 },
});
