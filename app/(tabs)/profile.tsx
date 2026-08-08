import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Bell, ChevronRight, Crown, KeyRound, LogOut, Settings, Shield, Server } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, gradients, radii, shadows } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { BACKEND_URL } from "@/lib/config";

const items = [
  { icon: Settings, label: "App settings", route: "/settings" },
  { icon: Bell, label: "Notification preferences", route: "/notifications" },
  { icon: KeyRound, label: "Change password", route: "/forgot-password" },
  { icon: Shield, label: "Privacy & security", route: "/settings" },
  { icon: Server, label: `Backend: ${BACKEND_URL}`, route: "/settings" },
] as const;

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Profile" />

      <LinearGradient colors={gradients.hero} style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.avatar_initials || "U"}</Text>
          </View>
          <View style={styles.heroMeta}>
            <Text style={styles.name}>{user?.full_name || "User"}</Text>
            <Text style={styles.email}>{user?.email || "user@example.com"}</Text>
            <View style={styles.planBadge}>
              <Crown size={12} color={colors.gold} />
              <Text style={styles.planText}>{user?.plan || "Free"}</Text>
            </View>
          </View>
        </View>
        <View style={styles.backendBadge}>
          <Text style={styles.backendText}>Backend: Real FastAPI + RAG Pipeline</Text>
        </View>
      </LinearGradient>

      <View style={styles.menu}>
        {items.map((item, index) => (
          <Pressable key={item.label} onPress={() => router.push(item.route as never)} style={[styles.menuRow, index > 0 && styles.menuRowBorder]}>
            <View style={styles.menuIcon}>
              <item.icon size={16} color={colors.primary} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={async () => {
          await logout();
        }}
        style={styles.logoutBtn}
      >
        <LogOut size={16} color={colors.destructive} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>About Real Integration</Text>
        <Text style={styles.infoText}>
          ✅ Real JWT authentication with secure storage{"\n"}
          ✅ Real file upload (PDF/DOCX/JPG/PNG){"\n"}
          ✅ Real OCR + text extraction{"\n"}
          ✅ Real embeddings (TF-IDF / Sentence Transformers / OpenAI){"\n"}
          ✅ Real Vector DB (Chroma / Memory){"\n"}
          ✅ Real RAG with legal knowledge base{"\n"}
          ✅ Real LLM (OpenAI or rule-based){"\n"}
          ✅ Real structured JSON analysis{"\n"}
          ✅ Real database persistence{"\n"}
          ✅ Real chat with contract + sources
        </Text>
      </View>

      <Text style={styles.version}>NeedhiAI · v1.0.0 · End-to-End Real Implementation</Text>
      <Text style={styles.disclaimer}>Disclaimer: Informational assistance only, not legal advice.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
  hero: {
    marginHorizontal: 20,
    borderRadius: radii.xl,
    padding: 20,
    ...shadows.elevated,
  },
  heroRow: { flexDirection: "row", gap: 16 },
  avatar: {
    height: 64,
    width: 64,
    borderRadius: radii.lg,
    backgroundColor: "rgba(250,249,247,0.15)",
    borderWidth: 1,
    borderColor: "rgba(250,249,247,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 24, fontWeight: "600", color: colors.primaryForeground },
  heroMeta: { flex: 1 },
  name: { fontSize: 20, fontWeight: "600", color: colors.primaryForeground },
  email: { marginTop: 2, fontSize: 14, color: "rgba(250,249,247,0.7)" },
  planBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(212,168,83,0.25)",
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  planText: { fontSize: 11, fontWeight: "600", color: colors.gold },
  backendBadge: {
    marginTop: 12,
    backgroundColor: "rgba(212,168,83,0.15)",
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backendText: { fontSize: 11, color: colors.gold, fontWeight: "500" },
  menu: {
    marginTop: 24,
    marginHorizontal: 20,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  menuIcon: {
    height: 36,
    width: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: colors.foreground },
  logoutBtn: {
    marginTop: 24,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(220,76,76,0.3)",
    backgroundColor: "rgba(220,76,76,0.1)",
    paddingVertical: 14,
  },
  logoutText: { fontSize: 14, fontWeight: "500", color: colors.destructive },
  infoBox: {
    marginTop: 24,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: { fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 },
  infoText: { fontSize: 12, color: colors.mutedForeground, lineHeight: 18 },
  version: { marginTop: 24, textAlign: "center", fontSize: 12, color: colors.mutedForeground },
  disclaimer: { marginTop: 6, textAlign: "center", fontSize: 10, color: colors.mutedForeground, paddingHorizontal: 20 },
});
