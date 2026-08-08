import { FileX, Search, SlidersHorizontal, RefreshCw } from "lucide-react-native";
import { useMemo, useState, useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";

import { ContractCard } from "@/components/ContractCard";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, radii } from "@/lib/theme";
import { listContracts, ContractListItem, mapRiskLevel } from "@/lib/api/contracts";

type RiskLevel = "low" | "medium" | "high";

const filters: Array<{ key: RiskLevel | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "high", label: "High risk" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

export default function HistoryScreen() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchContracts(showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await listContracts();
      setContracts(data);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchContracts();
    }, [])
  );

  const filtered = useMemo(
    () =>
      contracts.filter((contract) => {
        const matchesFilter = filter === "all" || contract.risk_level === filter;
        const matchesQuery =
          contract.title.toLowerCase().includes(query.toLowerCase()) ||
          contract.type.toLowerCase().includes(query.toLowerCase());
        return matchesFilter && matchesQuery;
      }),
    [query, filter, contracts]
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchContracts(false); }} tintColor={colors.primary} />}
    >
      <ScreenHeader title="History" subtitle={`${contracts.length} contracts • Real backend data`} />

      <View style={styles.searchBar}>
        <Search size={16} color={colors.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by title or type…"
          placeholderTextColor={colors.mutedForeground}
          style={styles.searchInput}
        />
        <Pressable style={styles.filterBtn}>
          <SlidersHorizontal size={14} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((item) => (
          <Pressable key={item.key} onPress={() => setFilter(item.key)} style={[styles.chip, filter === item.key && styles.chipActive]}>
            <Text style={[styles.chipText, filter === item.key && styles.chipTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading from database...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => fetchContracts()} style={styles.retryBtn}>
            <RefreshCw size={14} color={colors.primaryForeground} />
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.length ? (
            filtered.map((contract) => (
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
            ))
          ) : (
            <EmptyState
              icon={FileX}
              title={contracts.length === 0 ? "No contracts yet" : "No contracts found"}
              body={
                contracts.length === 0
                  ? "Upload your first contract to see it here. Real AI analysis will be performed."
                  : "Try a different search term or clear the filters to see all your contracts."
              }
            />
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
  searchBar: {
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.foreground, padding: 0 },
  filterBtn: {
    height: 28,
    width: 28,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  filters: { paddingHorizontal: 20, gap: 8, marginTop: 16, paddingBottom: 4 },
  chip: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "500", color: colors.foreground },
  chipTextActive: { color: colors.primaryForeground },
  list: { marginTop: 20, paddingHorizontal: 20, gap: 10 },
  loadingWrap: { marginTop: 40, alignItems: "center", gap: 10 },
  loadingText: { fontSize: 13, color: colors.mutedForeground },
  errorWrap: { marginTop: 20, marginHorizontal: 20, padding: 16, backgroundColor: "rgba(220,76,76,0.08)", borderRadius: radii.lg, alignItems: "center", gap: 10 },
  errorText: { fontSize: 13, color: colors.destructive, textAlign: "center" },
  retryBtn: { flexDirection: "row", backgroundColor: colors.primary, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 8, gap: 6, alignItems: "center" },
  retryLabel: { color: colors.primaryForeground, fontSize: 12, fontWeight: "600" },
});
