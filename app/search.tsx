import { Search as SearchIcon, SearchX } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator } from "react-native";

import { ContractCard } from "@/components/ContractCard";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, radii } from "@/lib/theme";
import { listContracts, ContractListItem, mapRiskLevel } from "@/lib/api/contracts";

const recent = ["Auto-renewal", "NDA term", "Cloudline", "Payment penalty"];

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await listContracts();
        setContracts(data);
      } catch (e) {
        console.log("Search fetch error", e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const results = query
    ? contracts.filter(
        (contract) =>
          contract.title.toLowerCase().includes(query.toLowerCase()) ||
          contract.summary.toLowerCase().includes(query.toLowerCase()) ||
          contract.type.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Search" back="/(tabs)/home" subtitle="Real backend search" />

      <View style={styles.searchBar}>
        <SearchIcon size={16} color={colors.mutedForeground} />
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Search contracts, clauses, terms…"
          placeholderTextColor={colors.mutedForeground}
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !query ? (
        <View style={styles.recent}>
          <Text style={styles.recentTitle}>Recent searches</Text>
          <View style={styles.recentWrap}>
            {recent.map((term) => (
              <Pressable key={term} onPress={() => setQuery(term)} style={styles.recentChip}>
                <Text style={styles.recentText}>{term}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.hint}>Search now uses real contracts from database, not mock data</Text>
        </View>
      ) : (
        <View style={styles.results}>
          {results.length > 0 ? (
            <>
              <Text style={styles.resultCount}>
                {results.length} result{results.length === 1 ? "" : "s"} from real backend
              </Text>
              {results.map((contract) => (
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
            </>
          ) : (
            <EmptyState icon={SearchX} title="No matches" body={`We couldn't find anything for "${query}". Try a broader term.`} />
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
  recent: { marginTop: 24, paddingHorizontal: 20 },
  recentTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  recentWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  recentChip: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  recentText: { fontSize: 12, color: colors.foreground },
  results: { marginTop: 20, paddingHorizontal: 20, gap: 10 },
  resultCount: { fontSize: 12, color: colors.mutedForeground, marginBottom: 4 },
  loadingWrap: { marginTop: 40, alignItems: "center" },
  hint: { marginTop: 16, fontSize: 11, color: colors.mutedForeground },
});
