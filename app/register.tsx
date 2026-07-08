import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { Lock, Mail, Scale, User } from "lucide-react-native";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { FormField, PrimaryButton } from "@/components/FormControls";
import { colors, gradients, radii } from "@/lib/theme";

export default function RegisterScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.brandRow}>
        <LinearGradient colors={gradients.primary} style={styles.brandIcon}>
          <Scale size={20} color={colors.primaryForeground} />
        </LinearGradient>
        <Text style={styles.brandName}>NeedhiAI</Text>
      </View>

      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Start analyzing contracts in under a minute.</Text>

      <View style={styles.form}>
        <FormField icon={User} placeholder="Full name" />
        <FormField icon={Mail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
        <FormField icon={Lock} placeholder="Password (min. 8 characters)" secureTextEntry />
        <View style={styles.termsRow}>
          <Switch value trackColor={{ true: colors.primary }} />
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.link}>Terms</Text> and <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </View>
        <PrimaryButton label="Create account" onPress={() => router.replace("/(tabs)/home")} />
      </View>

      <Text style={styles.footer}>
        Already have an account? <Link href="/login" style={styles.link}>Sign in</Link>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 56, paddingBottom: 32 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 40 },
  brandIcon: { height: 40, width: 40, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: 20, fontWeight: "600", color: colors.foreground },
  title: { fontSize: 30, fontWeight: "600", color: colors.foreground },
  subtitle: { marginTop: 8, fontSize: 15, color: colors.mutedForeground },
  form: { marginTop: 32, gap: 16 },
  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  termsText: { flex: 1, fontSize: 12, color: colors.mutedForeground, lineHeight: 18 },
  link: { color: colors.primary },
  footer: { marginTop: 32, textAlign: "center", fontSize: 14, color: colors.mutedForeground },
});
