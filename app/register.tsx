import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { Lock, Mail, Scale, User, AlertCircle } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View, ActivityIndicator } from "react-native";

import { FormField, PrimaryButton } from "@/components/FormControls";
import { colors, gradients, radii } from "@/lib/theme";
import { register as registerApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();

  async function handleRegister() {
    if (!fullName || !email || !password) {
      setError("Please fill all fields");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!agree) {
      setError("Please agree to Terms and Privacy Policy");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await registerApi(fullName, email.trim().toLowerCase(), password);
      login(result.user, result.access_token);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      console.log("Register error:", e);
      if (e instanceof ApiError) {
        if (e.status === 0) {
          setError("Cannot connect to server. Check backend URL configuration. " + e.message);
        } else {
          setError(e.message);
        }
      } else {
        setError(e.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  }

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

      {error && (
        <View style={styles.errorBox}>
          <AlertCircle size={16} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.form}>
        <FormField icon={User} placeholder="Full name" value={fullName} onChangeText={setFullName} />
        <FormField icon={Mail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <FormField icon={Lock} placeholder="Password (min. 8 characters)" secureTextEntry value={password} onChangeText={setPassword} />
        <View style={styles.termsRow}>
          <Switch value={agree} onValueChange={setAgree} trackColor={{ true: colors.primary }} />
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.link}>Terms</Text> and <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBtn}>
            <ActivityIndicator color={colors.primaryForeground} />
            <Text style={styles.loadingText}>Creating account...</Text>
          </View>
        ) : (
          <PrimaryButton label="Create account" onPress={handleRegister} />
        )}
      </View>

      <Text style={styles.footer}>
        Already have an account? <Link href="/login" style={styles.link}>Sign in</Link>
      </Text>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Your data is encrypted. We do not store plain-text passwords. Legal disclaimer: informational assistance only, not legal advice.
        </Text>
      </View>
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
  errorBox: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(220,76,76,0.1)",
    borderWidth: 1,
    borderColor: "rgba(220,76,76,0.3)",
    borderRadius: radii.md,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: colors.destructive, lineHeight: 18 },
  loadingBtn: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: { color: colors.primaryForeground, fontSize: 16, fontWeight: "600" },
  disclaimer: {
    marginTop: 24,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerText: { fontSize: 11, color: colors.mutedForeground, lineHeight: 16, textAlign: "center" },
});
