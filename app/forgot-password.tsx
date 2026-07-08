import { Link, router } from "expo-router";
import { ArrowLeft, Mail, MailCheck } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { FormField, PrimaryButton } from "@/components/FormControls";
import { colors, radii } from "@/lib/theme";

export default function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Link href="/login" asChild>
        <Pressable style={styles.backLink}>
          <ArrowLeft size={16} color={colors.mutedForeground} />
          <Text style={styles.backText}>Back to sign in</Text>
        </Pressable>
      </Link>

      {!sent ? (
        <>
          <Text style={styles.title}>Forgot password?</Text>
          <Text style={styles.subtitle}>Enter your email and we'll send you a link to reset it.</Text>
          <View style={styles.form}>
            <FormField icon={Mail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
            <PrimaryButton label="Send reset link" onPress={() => setSent(true)} />
          </View>
        </>
      ) : (
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <MailCheck size={36} color={colors.success} />
          </View>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We've sent a password reset link to your inbox. It expires in 30 minutes.
          </Text>
          <Pressable onPress={() => router.replace("/login")} style={styles.successBtn}>
            <Text style={styles.successBtnText}>Back to sign in</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 56, paddingBottom: 32 },
  backLink: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 32 },
  backText: { fontSize: 14, color: colors.mutedForeground },
  title: { fontSize: 30, fontWeight: "600", color: colors.foreground },
  subtitle: { marginTop: 8, fontSize: 15, color: colors.mutedForeground, lineHeight: 22 },
  form: { marginTop: 32, gap: 16 },
  success: { marginTop: 48, alignItems: "center" },
  successIcon: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: "rgba(45,157,111,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successBtn: {
    marginTop: 32,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  successBtnText: { color: colors.primaryForeground, fontSize: 14, fontWeight: "500" },
});
