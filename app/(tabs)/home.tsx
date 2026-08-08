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
  RefreshCw,
} from "lucide-react-native";
import { useEffect, useState, useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";

import { ContractCard } from "@/components/ContractCard";
import { colors, gradients, radii, shadows } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { listContracts, ContractListItem, mapRiskLevel } from "@/lib/api/contracts";
import { EmptyState } from "@/components/EmptyState";

const quickActions = [
  { route: "/(tabs)/upload" as const, icon: Upload, label: "Upload Contract", desc: "PDF or DOCX", tone: "primary" as const },
  { route: "/scan" as const, icon: ScanLine, label: "Scan Contract", desc: "Use camera", tone: "gold" as const },
  { route: "/(tabs)/history" as const, icon: Clock, label: "View History", desc: "Recent analyses", tone: "surface" as const },
  { route: "/(tabs)/chat" as const, icon: Sparkles, label: "AI Assistant", desc: "Ask a question", tone: "primary" as const },
];

export default function HomeScreen() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated]);

  async function fetchContracts(showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await listContracts();
      setContracts(data);
    } catch (e: any) {
      console.log("Fetch contracts error:", e);
      setError(e.message || "Failed to load contracts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchContracts();
      }
    }, [isAuthenticated])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchContracts(false);
  };

  // Compute stats
  const highRiskCount = contracts.filter((c) => c.risk_level === "high").length;
  const pendingCount = contracts.filter((c) => c.status !== "analyzed").length;

  const stats = [
    { icon: FileText, label: "Contracts analyzed", value: `${contracts.length}`, tone: colors.primary },
    { icon: ShieldAlert, label: "High-risk", value: `${highRiskCount}`, tone: colors.destructive },
    { icon: ListChecks, label: "Pending review", value: `${pendingCount}`, tone: colors.goldForeground },
  ];

  // Find most urgent contract for insight card (highest risk or nearest deadline)
  const urgentContract = contracts.find((c) => c.risk_level === "high") || contracts[0];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.topRow}>
        <View style={styles.userRow}>
          <LinearGradient colors={gradients.primary} style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.avatar_initials || "U"}</Text>
          </LinearGradient>
          <View>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.name}>{user?.full_name?.split(" ")[0] || "User"}</Text>
          </View>
        </View>
        <Pressable onPress={() => router.push("/notifications")} style={styles.bellBtn}>
          <Bell size={18} color={colors.foreground} />
          {highRiskCount > 0 && <View style={styles.bellDot} />}
        </Pressable>
      </View>

      <Pressable onPress={() => router.push("/search")} style={styles.searchBar}>
        <Search size={16} color={colors.mutedForeground} />
        <Text style={styles.searchPlaceholder}>Search contracts, clauses…</Text>
      </Pressable>

      {urgentContract ? (
        <LinearGradient colors={gradients.hero} style={styles.insightCard}>
          <View style={styles.insightBadge}>
            <Sparkles size={12} color={colors.gold} />
            <Text style={styles.insightBadgeText}>AI insight</Text>
          </View>
          <Text style={styles.insightTitle} numberOfLines={3}>
            {urgentContract.risk_level === "high"
              ? `Your "${urgentContract.title}" has high-risk clauses.`
              : `Your "${urgentContract.title}" is ready for review.`}
          </Text>
          <Text style={styles.insightBody} numberOfLines={2}>
            {urgentContract.summary || "Tap to view detailed analysis."}
          </Text>
          <Pressable onPress={() => router.push(`/contract/${urgentContract.id}`)} style={styles.insightBtn}>
            <Text style={styles.insightBtnText}>Review contract →</Text>
          </Pressable>
        </LinearGradient>
      ) : (
        <LinearGradient colors={gradients.hero} style={styles.insightCard}>
          <View style={styles.insightBadge}>
            <Sparkles size={12} color={colors.gold} />
            <Text style={styles.insightBadgeText}>Get started</Text>
          </View>
          <Text style={styles.insightTitle}>Upload your first contract to get AI-powered insights</Text>
          <Text style={styles.insightBody}>We check auto-renewal, hidden fees, liability caps & more.</Text>
          <Pressable onPress={() => router.push("/(tabs)/upload")} style={styles.insightBtn}>
            <Text style={styles.insightBtnText}>Upload now →</Text>
          </Pressable>
        </LinearGradient>
      )}

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
        <Pressable onPress={() => router.push("/(tabs)/history")}>
          <Text style={styles.viewAll}>View all</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading contracts...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => fetchContracts()} style={styles.retryBtn}>
            <RefreshCw size={14} color={colors.primaryForeground} />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : contracts.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={FileText}
            title="No contracts yet"
            body="Upload a PDF, DOCX or image of your contract to get started with AI analysis."
          />
        </View>
      ) : (
        <View style={styles.list}>
          {contracts.slice(0, 3).map((contract) => (
            <ContractCard
              key={contract.id}
              contract={{
                id: contract.id,
                title: contract.title,
                type: contract.type,
                uploadedAt: contract.created_at,
                pages: contract.pages,
                risk: mapRiskLevel(contract.risk_level),
                riskScore: contract.risk_score,
                favorite: false,
                summary: contract.summary,
              }}
            />
          ))}
        </View>
      )}

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerTitle}>Legal Disclaimer</Text>
        <Text style={styles.disclaimerBody}>
          NeedhiAI provides informational assistance only. It does not constitute legal advice and should not replace consultation with a qualified legal professional for high-risk decisions.
        </Text>
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
  loadingWrap: { marginTop: 20, alignItems: "center", gap: 8, paddingVertical: 20 },
  loadingText: { fontSize: 13, color: colors.mutedForeground },
  errorWrap: { marginTop: 20, padding: 16, backgroundColor: "rgba(220,76,76,0.08)", borderRadius: radii.lg, alignItems: "center", gap: 12 },
  errorText: { fontSize: 13, color: colors.destructive, textAlign: "center" },
  retryBtn: { flexDirection: "row", backgroundColor: colors.primary, borderRadius: radii.full, paddingHorizontal: 16, paddingVertical: 8, alignItems: "center", gap: 6 },
  retryText: { color: colors.primaryForeground, fontSize: 12, fontWeight: "600" },
  emptyWrap: { marginTop: 12 },
  disclaimerBox: {
    marginTop: 28,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerTitle: { fontSize: 11, fontWeight: "600", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  disclaimerBody: { fontSize: 11, color: colors.mutedForeground, lineHeight: 16 },
});
