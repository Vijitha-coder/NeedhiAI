import { FileX, Search, SlidersHorizontal } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ContractCard } from "@/components/ContractCard";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { mockContracts, type RiskLevel } from "@/lib/mock-data";
import { colors, radii } from "@/lib/theme";

const filters: Array<{ key: RiskLevel | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "high", label: "High risk" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

export default function HistoryScreen() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");

  const list = useMemo(
    () =>
      mockContracts.filter((contract) => {
        const matchesFilter = filter === "all" || contract.risk === filter;
        const matchesQuery =
          contract.title.toLowerCase().includes(query.toLowerCase()) ||
          contract.type.toLowerCase().includes(query.toLowerCase());
        return matchesFilter && matchesQuery;
      }),
    [query, filter],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="History" subtitle={`${mockContracts.length} contracts analyzed`} />

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
          <Pressable
            key={item.key}
            onPress={() => setFilter(item.key)}
            style={[styles.chip, filter === item.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === item.key && styles.chipTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.list}>
        {list.length ? (
          list.map((contract) => <ContractCard key={contract.id} contract={contract} />)
        ) : (
          <EmptyState
            icon={FileX}
            title="No contracts found"
            body="Try a different search term or clear the filters to see all your contracts."
          />
        )}
      </View>
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
});
