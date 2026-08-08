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
  Trash2,
  FileText,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator, Alert } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { RiskBadge } from "@/components/RiskBadge";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, gradients, radii, shadows } from "@/lib/theme";
import { getContract, deleteContract, ContractDetailResponse, mapRiskLevel } from "@/lib/api/contracts";
import { ApiError } from "@/lib/api/client";

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [contract, setContract] = useState<ContractDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"summary" | "risk">("summary");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchContract();
    }
  }, [id]);

  async function fetchContract() {
    setLoading(true);
    setError(null);
    try {
      const data = await getContract(id as string);
      setContract(data);
    } catch (e: any) {
      console.log("Fetch contract error:", e);
      setError(e.message || "Failed to load contract");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    Alert.alert("Delete Contract", `Are you sure you want to delete "${contract?.title}"? This will remove all associated data.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteContract(id as string);
            router.replace("/(tabs)/history");
          } catch (e: any) {
            setError(e.message || "Failed to delete");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Analysis" back="/(tabs)/history" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading contract analysis...</Text>
        </View>
      </View>
    );
  }

  if (error || !contract) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Not found" back="/(tabs)/history" />
        <View style={styles.center}>
          <FileText size={48} color={colors.mutedForeground} />
          <Text style={styles.notFound}>{error || "We couldn't find that contract."}</Text>
          <Pressable onPress={fetchContract} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const analysis = contract.analysis;
  const riskLevel = contract.risk_level?.toLowerCase() as "low" | "medium" | "high" || "low";
  const riskScore = contract.risk_score || 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Analysis"
        subtitle={contract.type}
        back="/(tabs)/history"
        right={
          <View style={styles.headerActions}>
            <IconBtn onPress={handleDelete} disabled={deleting}>
              {deleting ? <ActivityIndicator size="small" color={colors.destructive} /> : <Trash2 size={16} color={colors.destructive} />}
            </IconBtn>
            <IconBtn>
              <Star size={16} color={colors.foreground} />
            </IconBtn>
            <IconBtn>
              <Share2 size={16} color={colors.foreground} />
            </IconBtn>
          </View>
        }
      />

      <View style={styles.summaryCard}>
        <Text style={styles.contractTitle}>{contract.title}</Text>
        <View style={styles.metaRow}>
          <RiskBadge level={mapRiskLevel(contract.risk_level)} />
          <Text style={styles.metaText}>
            {contract.pages} pages · {new Date(contract.created_at).toLocaleDateString()} · {contract.file_type.toUpperCase()}
          </Text>
        </View>
        {contract.status !== "analyzed" && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Status: {contract.status}</Text>
          </View>
        )}
      </View>

      {analysis ? (
        <>
          <View style={styles.tabs}>
            {(["summary", "risk"] as const).map((value) => (
              <Pressable key={value} onPress={() => setTab(value)} style={[styles.tabBtn, tab === value && styles.tabBtnActive]}>
                <Text style={[styles.tabText, tab === value && styles.tabTextActive]}>{value === "summary" ? "Summary" : "Risk analysis"}</Text>
              </Pressable>
            ))}
          </View>

          {tab === "summary" ? <SummaryTab analysis={analysis} /> : <RiskTab analysis={analysis} score={riskScore} level={riskLevel} />}
        </>
      ) : (
        <View style={styles.noAnalysis}>
          <Text style={styles.noAnalysisTitle}>Analysis not available</Text>
          <Text style={styles.noAnalysisText}>
            Contract is in "{contract.status}" status. {contract.status === "uploaded" ? "Analysis hasn't been run yet." : ""}
          </Text>
          <Pressable
            onPress={() => router.push({ pathname: "/processing", params: { contractId: contract.id, title: contract.title } } as any)}
            style={styles.analyzeBtn}
          >
            <Text style={styles.analyzeBtnText}>Run Analysis</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerTitle}>Disclaimer</Text>
        <Text style={styles.disclaimerBody}>
          This analysis is AI-generated for informational purposes and does not constitute legal advice. Consult a qualified legal professional for high-risk decisions. Backend: {analysis ? "Real AI pipeline used" : "Pending"}
        </Text>
      </View>

      <Pressable onPress={() => router.push({ pathname: "/(tabs)/chat", params: { contractId: contract.id } } as any)} style={styles.chatCard}>
        <LinearGradient colors={gradients.hero} style={styles.chatGradient}>
          <View style={styles.chatIcon}>
            <MessageSquare size={20} color={colors.gold} />
          </View>
          <View style={styles.chatCopy}>
            <Text style={styles.chatTitle}>Ask NeedhiAI about this contract</Text>
            <Text style={styles.chatSubtitle}>Real RAG chat with sources</Text>
          </View>
          <Text style={styles.chatArrow}>→</Text>
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}

function IconBtn({ children, onPress, disabled }: { children: React.ReactNode; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.iconBtn}>
      {children}
    </Pressable>
  );
}

function SummaryTab({ analysis }: { analysis: any }) {
  const [open, setOpen] = useState("summary");

  const sections = [
    { key: "summary", title: "Plain English Summary", body: analysis.summary || "No summary available" },
    { key: "rights", title: "Your Rights", body: analysis.rights?.length ? analysis.rights.join("\n• ") : "No explicit rights extracted" },
    { key: "obligations", title: "Your Obligations", body: analysis.obligations?.length ? analysis.obligations.join("\n• ") : "Obligations present - review contract" },
    { key: "key_clauses", title: "Key Clauses", body: analysis.key_clauses?.map((c: any) => `${c.title}: ${c.content.slice(0,200)}`).join("\n\n") || "No key clauses" },
    { key: "deadlines", title: "Deadlines", body: analysis.deadlines?.map((d: any) => `${d.description} (${d.importance||''})`).join("\n• ") || "No deadlines detected" },
    { key: "penalties", title: "Penalties", body: analysis.penalties?.join("\n• ") || "No explicit penalties found (check termination)" },
    { key: "renewal", title: "Renewal", body: analysis.renewal?.join("\n• ") || "No renewal terms detected" },
    { key: "termination", title: "Termination", body: analysis.termination?.join("\n• ") || "Termination clauses - review contract" },
    { key: "payment", title: "Payment Terms", body: analysis.payment_clauses?.join("\n• ") || "Payment terms present" },
    { key: "pros", title: "Pros", body: analysis.pros?.join("\n• ") || "Pros analysis pending" },
    { key: "cons", title: "Cons", body: analysis.cons?.join("\n• ") || "No major cons detected" },
    { key: "missing", title: "Potentially Missing Clauses", body: analysis.missing_clauses?.join("\n• ") || "No missing clauses detected" },
  ];

  return (
    <View style={styles.accordion}>
      {sections.map((section) => {
        const isOpen = open === section.key;
        return (
          <View key={section.key} style={styles.accordionItem}>
            <Pressable onPress={() => setOpen(isOpen ? "" : section.key)} style={styles.accordionHeader}>
              <Text style={styles.accordionTitle}>{section.title}</Text>
              <ChevronDown size={16} color={colors.mutedForeground} style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }} />
            </Pressable>
            {isOpen ? <Text style={styles.accordionBody}>{section.body}</Text> : null}
          </View>
        );
      })}

      {analysis.sources?.length > 0 && (
        <View style={styles.sourcesBox}>
          <Text style={styles.sourcesTitle}>Legal Sources Referenced</Text>
          {analysis.sources.map((src: any, idx: number) => (
            <View key={idx} style={styles.sourceItem}>
              <Text style={styles.sourceName}>{src.title}</Text>
              <Text style={styles.sourceMeta}>{src.jurisdiction} • {src.source} • {src.section}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function RiskTab({ score, level, analysis }: { score: number; level: "low" | "medium" | "high"; analysis: any }) {
  const Icon = level === "low" ? ShieldCheck : level === "medium" ? Shield : ShieldAlert;
  const tone =
    level === "low"
      ? { bg: "rgba(45,157,111,0.12)", text: colors.success }
      : level === "medium"
      ? { bg: "rgba(212,160,23,0.15)", text: colors.warningForeground }
      : { bg: "rgba(220,76,76,0.12)", text: colors.destructive };

  const circumference = 264;
  const dash = (score / 100) * circumference;

  const risks = analysis.risks || [];

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
              <Text style={[styles.riskBadgeText, { color: tone.text }]}>{level === "low" ? "Low risk" : level === "medium" ? "Medium risk" : "High risk"}</Text>
            </View>
            <Text style={styles.riskText}>
              We flagged {risks.length} clauses that need your attention before signing. {level === "high" ? "Consult a lawyer." : ""}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <Text style={styles.sectionHeading}>Risky clauses (Real AI Detection)</Text>
      <View style={styles.clauseList}>
        {risks.length === 0 ? (
          <View style={styles.clauseCard}>
            <Text style={styles.clauseNote}>No risky clauses detected automatically. Manual review still recommended.</Text>
          </View>
        ) : (
          risks.map((clause: any, idx: number) => (
            <View key={idx} style={styles.clauseCard}>
              <View style={styles.clauseHeader}>
                <View style={styles.clauseTitleRow}>
                  <AlertTriangle size={16} color={clause.severity === "HIGH" ? colors.destructive : colors.warningForeground} />
                  <Text style={styles.clauseTitle}>{clause.title}</Text>
                </View>
                <RiskBadge level={clause.severity === "HIGH" ? "high" : clause.severity === "MEDIUM" ? "medium" : "low"} />
              </View>
              <Text style={styles.clauseNote}>{clause.explanation}</Text>
              {clause.evidence && (
                <View style={styles.evidenceBox}>
                  <Text style={styles.evidenceLabel}>Evidence:</Text>
                  <Text style={styles.evidenceText}>"{clause.evidence}"</Text>
                  {clause.clause_reference && <Text style={styles.clauseRef}>Ref: {clause.clause_reference}</Text>}
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {analysis.warnings?.length > 0 && (
        <View style={styles.recommendation}>
          <View style={styles.recommendationHeader}>
            <Lightbulb size={16} color={colors.goldForeground} />
            <Text style={styles.recommendationTitle}>Warnings & Disclaimer</Text>
          </View>
          {analysis.warnings.map((w: string, i: number) => (
            <Text key={i} style={styles.recommendationBody}>
              • {w}
            </Text>
          ))}
        </View>
      )}

      {analysis.pros?.length > 0 || analysis.cons?.length > 0 ? (
        <View style={styles.prosConsRow}>
          <View style={styles.prosBox}>
            <Text style={styles.prosTitle}>Pros</Text>
            {analysis.pros?.slice(0, 4).map((p: string, i: number) => (
              <Text key={i} style={styles.prosText}>
                ✓ {p}
              </Text>
            ))}
          </View>
          <View style={styles.consBox}>
            <Text style={styles.consTitle}>Cons</Text>
            {analysis.cons?.slice(0, 4).map((c: string, i: number) => (
              <Text key={i} style={styles.consText}>
                ✗ {c}
              </Text>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  notFound: { paddingHorizontal: 20, fontSize: 14, color: colors.mutedForeground, textAlign: "center" },
  loadingText: { fontSize: 14, color: colors.mutedForeground },
  retryBtn: { marginTop: 12, backgroundColor: colors.primary, borderRadius: radii.full, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: colors.primaryForeground, fontSize: 14, fontWeight: "600" },
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
  statusBadge: { marginTop: 8, alignSelf: "flex-start", backgroundColor: colors.secondary, borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, color: colors.mutedForeground },
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
  evidenceBox: { marginTop: 10, padding: 10, backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  evidenceLabel: { fontSize: 11, fontWeight: "600", color: colors.mutedForeground, textTransform: "uppercase" },
  evidenceText: { marginTop: 4, fontSize: 12, color: colors.foreground, fontStyle: "italic", lineHeight: 18 },
  clauseRef: { marginTop: 4, fontSize: 11, color: colors.mutedForeground },
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
  recommendationBody: { fontSize: 14, lineHeight: 20, color: colors.mutedForeground, marginTop: 4 },
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
  noAnalysis: { marginTop: 24, marginHorizontal: 20, padding: 20, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  noAnalysisTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  noAnalysisText: { marginTop: 8, fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
  analyzeBtn: { marginTop: 16, backgroundColor: colors.primary, borderRadius: radii.full, paddingHorizontal: 20, paddingVertical: 12 },
  analyzeBtnText: { color: colors.primaryForeground, fontWeight: "600", fontSize: 14 },
  disclaimerBox: {
    marginTop: 24,
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: "rgba(212,168,83,0.08)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(212,168,83,0.3)",
  },
  disclaimerTitle: { fontSize: 11, fontWeight: "600", color: colors.mutedForeground, textTransform: "uppercase", marginBottom: 4 },
  disclaimerBody: { fontSize: 11, color: colors.mutedForeground, lineHeight: 16 },
  sourcesBox: { marginTop: 20, padding: 16, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, gap: 10 },
  sourcesTitle: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  sourceItem: { gap: 2 },
  sourceName: { fontSize: 13, fontWeight: "500", color: colors.foreground },
  sourceMeta: { fontSize: 11, color: colors.mutedForeground },
  prosConsRow: { flexDirection: "row", gap: 12, marginTop: 16, marginHorizontal: 20 },
  prosBox: { flex: 1, backgroundColor: "rgba(45,157,111,0.08)", borderWidth: 1, borderColor: "rgba(45,157,111,0.2)", borderRadius: radii.lg, padding: 12 },
  consBox: { flex: 1, backgroundColor: "rgba(220,76,76,0.08)", borderWidth: 1, borderColor: "rgba(220,76,76,0.2)", borderRadius: radii.lg, padding: 12 },
  prosTitle: { fontSize: 12, fontWeight: "600", color: colors.success, marginBottom: 6 },
  consTitle: { fontSize: 12, fontWeight: "600", color: colors.destructive, marginBottom: 6 },
  prosText: { fontSize: 12, color: colors.foreground, lineHeight: 18, marginTop: 4 },
  consText: { fontSize: 12, color: colors.foreground, lineHeight: 18, marginTop: 4 },
});
