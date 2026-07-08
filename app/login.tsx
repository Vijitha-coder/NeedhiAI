import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { Eye, EyeOff, Lock, Mail, Scale } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { FormField, OutlineButton, PrimaryButton } from "@/components/FormControls";
import { colors, gradients, radii } from "@/lib/theme";

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.brandRow}>
        <LinearGradient colors={gradients.primary} style={styles.brandIcon}>
          <Scale size={20} color={colors.primaryForeground} />
        </LinearGradient>
        <Text style={styles.brandName}>NeedhiAI</Text>
      </View>

      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to review your contracts with AI.</Text>

      <View style={styles.form}>
        <FormField icon={Mail} placeholder="Email address" defaultValue="aarav@example.com" keyboardType="email-address" autoCapitalize="none" />
        <FormField
          icon={Lock}
          placeholder="Password"
          defaultValue="password"
          secureTextEntry={!showPassword}
          trailing={
            <Pressable onPress={() => setShowPassword((v) => !v)}>
              {showPassword ? <EyeOff size={16} color={colors.mutedForeground} /> : <Eye size={16} color={colors.mutedForeground} />}
            </Pressable>
          }
        />
        <Link href="/forgot-password" style={styles.forgotLink}>
          Forgot password?
        </Link>
        <PrimaryButton label="Sign in" onPress={() => router.replace("/(tabs)/home")} />
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialRow}>
        <OutlineButton label="Google" />
        <OutlineButton label="Apple" />
      </View>

      <Text style={styles.footer}>
        New to NeedhiAI? <Link href="/register" style={styles.link}>Create an account</Link>
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
  forgotLink: { alignSelf: "flex-end", fontSize: 14, color: colors.primary, fontWeight: "500" },
  dividerRow: { marginVertical: 28, flexDirection: "row", alignItems: "center", gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, color: colors.mutedForeground },
  socialRow: { flexDirection: "row", gap: 12 },
  footer: { marginTop: 32, textAlign: "center", fontSize: 14, color: colors.mutedForeground },
  link: { color: colors.primary, fontWeight: "500" },
});
