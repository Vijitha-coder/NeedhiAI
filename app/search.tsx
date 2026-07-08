import { Search as SearchIcon, SearchX } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ContractCard } from "@/components/ContractCard";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { mockContracts } from "@/lib/mock-data";
import { colors, radii } from "@/lib/theme";

const recent = ["Auto-renewal", "NDA term", "Cloudline", "Payment penalty"];

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const results = query
    ? mockContracts.filter(
        (contract) =>
          contract.title.toLowerCase().includes(query.toLowerCase()) ||
          contract.summary.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Search" back="/(tabs)/home" />

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

      {!query ? (
        <View style={styles.recent}>
          <Text style={styles.recentTitle}>Recent</Text>
          <View style={styles.recentWrap}>
            {recent.map((term) => (
              <Pressable key={term} onPress={() => setQuery(term)} style={styles.recentChip}>
                <Text style={styles.recentText}>{term}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.results}>
          {results.length > 0 ? (
            <>
              <Text style={styles.resultCount}>
                {results.length} result{results.length === 1 ? "" : "s"}
              </Text>
              {results.map((contract) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </>
          ) : (
            <EmptyState
              icon={SearchX}
              title="No matches"
              body={`We couldn't find anything for "${query}". Try a broader term.`}
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
});
