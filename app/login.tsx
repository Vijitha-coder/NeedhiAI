import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { Eye, EyeOff, Lock, Mail, Scale, AlertCircle } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";

import { FormField, OutlineButton, PrimaryButton } from "@/components/FormControls";
import { colors, gradients, radii } from "@/lib/theme";
import { login as loginApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("aarav@example.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login: authLogin } = useAuth();

  async function handleLogin() {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await loginApi(email.trim().toLowerCase(), password);
      authLogin(result.user, result.access_token);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      console.log("Login error:", e);
      if (e instanceof ApiError) {
        if (e.status === 401) {
          setError("Invalid email or password");
        } else if (e.status === 0) {
          setError("Cannot connect to server. Please check if backend is running and backend URL is configured. " + e.message);
        } else {
          setError(e.message);
        }
      } else {
        setError(e.message || "Login failed");
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

      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to review your contracts with AI.</Text>

      {error && (
        <View style={styles.errorBox}>
          <AlertCircle size={16} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.form}>
        <FormField
          icon={Mail}
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormField
          icon={Lock}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
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

        {loading ? (
          <View style={styles.loadingBtn}>
            <ActivityIndicator color={colors.primaryForeground} />
            <Text style={styles.loadingText}>Signing in...</Text>
          </View>
        ) : (
          <PrimaryButton label="Sign in" onPress={handleLogin} />
        )}
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

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Legal Disclaimer: NeedhiAI provides informational assistance only and does not constitute legal advice. Consult a qualified professional for high-risk decisions.
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
  forgotLink: { alignSelf: "flex-end", fontSize: 14, color: colors.primary, fontWeight: "500" },
  dividerRow: { marginVertical: 28, flexDirection: "row", alignItems: "center", gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, color: colors.mutedForeground },
  socialRow: { flexDirection: "row", gap: 12 },
  footer: { marginTop: 32, textAlign: "center", fontSize: 14, color: colors.mutedForeground },
  link: { color: colors.primary, fontWeight: "500" },
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
