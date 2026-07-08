import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/lib/theme";

export function ScreenHeader({
  title,
  subtitle,
  right,
  back,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  back?: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        {back ? (
          <Pressable
            onPress={() => router.push(back as never)}
            style={styles.backBtn}
            accessibilityLabel="Back"
          >
            <ChevronLeft size={20} color={colors.secondaryForeground} strokeWidth={2.5} />
          </Pressable>
        ) : null}
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

export function Screen({ children, scroll = false }: { children: ReactNode; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const Container = scroll ? require("react-native").ScrollView : View;

  return (
    <Container
      style={[styles.screen, { paddingBottom: insets.bottom + 16 }]}
      contentContainerStyle={scroll ? styles.scrollContent : undefined}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  backBtn: {
    marginTop: 4,
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    color: colors.mutedForeground,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
