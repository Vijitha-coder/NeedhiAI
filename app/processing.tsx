import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Check, Sparkles } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { processingSteps } from "@/lib/mock-data";
import { colors, gradients, radii } from "@/lib/theme";

export default function ProcessingScreen() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((current) => {
        if (current >= processingSteps.length - 1) {
          clearInterval(interval);
          setTimeout(() => router.replace("/contract/c-001"), 900);
          return current;
        }
        return current + 1;
      });
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  const pct = Math.round(((step + 1) / processingSteps.length) * 100);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LinearGradient colors={gradients.primary} style={styles.icon}>
        <Sparkles size={48} color={colors.gold} />
      </LinearGradient>

      <Text style={styles.title}>NeedhiAI is reading your contract</Text>
      <Text style={styles.subtitle}>This usually takes 15–30 seconds</Text>

      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <LinearGradient colors={gradients.primary} style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progressText}>{pct}%</Text>
      </View>

      <View style={styles.steps}>
        {processingSteps.map((label, index) => (
          <View key={label} style={[styles.stepRow, index > step && styles.stepMuted]}>
            <View
              style={[
                styles.stepIcon,
                index < step && styles.stepDone,
                index === step && styles.stepActive,
              ]}
            >
              {index < step ? (
                <Check size={14} color={colors.successForeground} />
              ) : index === step ? (
                <View style={styles.stepDot} />
              ) : (
                <Text style={styles.stepNumber}>{index + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, index === step && styles.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: "center",
    minHeight: "80%",
  },
  icon: {
    height: 112,
    width: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.foreground,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: "center",
  },
  progressWrap: { marginTop: 32, width: "100%", maxWidth: 320 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  progressText: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
    color: colors.mutedForeground,
  },
  steps: { marginTop: 40, width: "100%", maxWidth: 320, gap: 12 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepMuted: { opacity: 0.3 },
  stepIcon: {
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDone: { backgroundColor: colors.success },
  stepActive: { backgroundColor: colors.primary },
  stepDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryForeground,
  },
  stepNumber: { fontSize: 10, color: colors.mutedForeground },
  stepLabel: { fontSize: 14, color: colors.foreground },
  stepLabelActive: { fontWeight: "500" },
});
