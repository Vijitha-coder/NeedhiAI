import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Check, Sparkles, AlertCircle } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";

import { colors, gradients, radii } from "@/lib/theme";
import { analyzeContract, getContractStatus } from "@/lib/api/contracts";
import { ApiError } from "@/lib/api/client";

const steps = [
  "Extracting text from document...",
  "Cleaning and normalizing text...",
  "Semantic chunking...",
  "Generating embeddings...",
  "Searching legal knowledge base (RAG)...",
  "Analyzing with AI...",
  "Generating risk assessment...",
  "Finalizing structured report...",
];

export default function ProcessingScreen() {
  const { contractId, title } = useLocalSearchParams<{ contractId: string; title?: string }>();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState("Starting analysis...");

  useEffect(() => {
    if (!contractId) {
      setError("No contract ID provided");
      return;
    }

    let interval: any;
    let analysisStarted = false;

    // Simulate steps progress while real analysis runs
    interval = setInterval(() => {
      setStep((current) => {
        if (current < steps.length - 1) {
          return current + 1;
        }
        return current;
      });
    }, 1200);

    async function runAnalysis() {
      if (analysisStarted) return;
      analysisStarted = true;

      try {
        setProgressMessage("Connecting to backend...");
        
        // Check status first
        try {
          const status = await getContractStatus(contractId as string);
          setProgressMessage(`Status: ${status.status} - ${status.message}`);
        } catch {
          // ignore status check error
        }

        setProgressMessage("Running AI pipeline: OCR ✓ Chunking ✓ Embeddings ✓ RAG ✓ LLM analysis...");
        
        const result = await analyzeContract(contractId as string);
        
        setProgressMessage("Analysis complete!");
        setStep(steps.length - 1);
        
        // Short delay then navigate to contract detail
        setTimeout(() => {
          clearInterval(interval);
          router.replace(`/contract/${contractId}`);
        }, 800);

      } catch (e: any) {
        console.log("Analysis error:", e);
        clearInterval(interval);
        if (e instanceof ApiError) {
          if (e.status === 0) {
            setError(`Backend connection failed: ${e.message}. Ensure backend is running at configured URL.`);
          } else {
            setError(`Analysis failed: ${e.message}`);
          }
        } else {
          setError(e.message || "Analysis failed due to unknown error");
        }
      }
    }

    // Start analysis after small delay to show UI
    setTimeout(runAnalysis, 1000);

    return () => clearInterval(interval);
  }, [contractId]);

  const pct = Math.round(((step + 1) / steps.length) * 100);

  if (error) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.errorIcon}>
          <AlertCircle size={48} color={colors.destructive} />
        </View>
        <Text style={styles.title}>Analysis Failed</Text>
        <Text style={styles.subtitle}>{error}</Text>
        <View style={styles.errorActions}>
          <Text style={styles.errorHelp}>
            Possible causes: backend not running, OCR failure, file too large, or network issue. Check backend logs.
          </Text>
        </View>
        <View style={styles.retryRow}>
          <Text style={styles.retryText} onPress={() => router.back()}>
            ← Go back
          </Text>
          <Text style={[styles.retryText, styles.retryPrimary]} onPress={() => router.replace("/(tabs)/home")}>
            Home
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LinearGradient colors={gradients.primary} style={styles.icon}>
        <Sparkles size={48} color={colors.gold} />
      </LinearGradient>

      <Text style={styles.title}>NeedhiAI is reading your contract</Text>
      <Text style={styles.subtitle}>
        {title ? `"${title}"` : "Running real AI pipeline: OCR → Chunking → Embeddings → RAG → LLM"}
      </Text>

      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <LinearGradient colors={gradients.primary} style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progressText}>{pct}% • {progressMessage}</Text>
      </View>

      <View style={styles.steps}>
        {steps.map((label, index) => (
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
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Text style={styles.stepNumber}>{index + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, index === step && styles.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.realPipelineBox}>
        <Text style={styles.pipelineTitle}>Real Pipeline Running</Text>
        <Text style={styles.pipelineText}>
          Backend is performing: Text Extraction → Cleaning → Semantic Chunking → Embedding Generation → Vector DB (Chroma/Memory) → Legal Knowledge Retrieval → RAG Prompt → LLM (OpenAI or rule-based) → Structured JSON → Risk Analysis
        </Text>
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
  errorIcon: {
    height: 112,
    width: 112,
    borderRadius: 56,
    backgroundColor: "rgba(220,76,76,0.1)",
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
  stepNumber: { fontSize: 10, color: colors.mutedForeground },
  stepLabel: { fontSize: 14, color: colors.foreground },
  stepLabelActive: { fontWeight: "500" },
  errorActions: { marginTop: 20, padding: 16, backgroundColor: colors.surface, borderRadius: radii.lg, width: "100%" },
  errorHelp: { fontSize: 12, color: colors.mutedForeground, lineHeight: 18 },
  retryRow: { marginTop: 24, flexDirection: "row", gap: 16 },
  retryText: { fontSize: 14, color: colors.mutedForeground, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radii.full },
  retryPrimary: { backgroundColor: colors.primary, color: colors.primaryForeground, borderColor: colors.primary },
  realPipelineBox: {
    marginTop: 32,
    width: "100%",
    maxWidth: 340,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pipelineTitle: { fontSize: 11, fontWeight: "600", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  pipelineText: { fontSize: 11, color: colors.mutedForeground, lineHeight: 16 },
});
