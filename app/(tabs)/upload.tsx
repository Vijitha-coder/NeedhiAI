import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { CheckCircle2, FileText, UploadCloud, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/components/ScreenHeader";
import { PrimaryButton } from "@/components/FormControls";
import { colors, gradients, radii, shadows } from "@/lib/theme";

type PickedFile = {
  name: string;
  size?: number;
  mimeType?: string;
};

export default function UploadScreen() {
  const [file, setFile] = useState<PickedFile | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!file) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((value) => {
        if (value >= 100) {
          clearInterval(interval);
          return 100;
        }
        return value + 6;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [file]);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFile({
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType ?? undefined,
      });
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Upload contract" subtitle="PDF or DOCX up to 25 MB" back="/(tabs)/home" />

      {!file ? (
        <Pressable onPress={pickFile} style={styles.dropzone}>
          <LinearGradient colors={gradients.primary} style={styles.dropIcon}>
            <UploadCloud size={36} color={colors.primaryForeground} />
          </LinearGradient>
          <Text style={styles.dropTitle}>Choose your file</Text>
          <Text style={styles.dropSubtitle}>Tap to browse PDF or DOCX</Text>
          <View style={styles.chooseBtn}>
            <Text style={styles.chooseBtnText}>Choose file</Text>
          </View>
          <Text style={styles.secureNote}>Encrypted in transit. Deleted after analysis.</Text>
        </Pressable>
      ) : (
        <View style={styles.fileCard}>
          <View style={styles.fileRow}>
            <View style={styles.fileIcon}>
              <FileText size={24} color={colors.primary} />
            </View>
            <View style={styles.fileMeta}>
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <Text style={styles.fileSize}>
                {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "Document"} · {file.mimeType ?? "document"}
              </Text>
            </View>
            <Pressable onPress={() => setFile(null)} style={styles.removeBtn}>
              <X size={16} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={styles.progressWrap}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>{progress < 100 ? "Uploading…" : "Ready to analyze"}</Text>
              <Text style={styles.progressValue}>{progress}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <LinearGradient colors={gradients.primary} style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          {progress >= 100 ? (
            <View style={styles.completeRow}>
              <CheckCircle2 size={16} color={colors.success} />
              <Text style={styles.completeText}>Upload complete</Text>
            </View>
          ) : null}

          <PrimaryButton
            label="Analyze with AI"
            disabled={progress < 100}
            onPress={() => router.push("/processing")}
          />
        </View>
      )}

      <View style={styles.checklist}>
        <Text style={styles.checklistTitle}>What NeedhiAI checks</Text>
        <Text style={styles.checklistItem}>✓ Auto-renewal & termination traps</Text>
        <Text style={styles.checklistItem}>✓ Hidden fees and price escalations</Text>
        <Text style={styles.checklistItem}>✓ Liability caps & indemnity risks</Text>
        <Text style={styles.checklistItem}>✓ Data & IP ownership</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
  dropzone: {
    marginHorizontal: 20,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    padding: 32,
    alignItems: "center",
  },
  dropIcon: {
    height: 80,
    width: 80,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  dropTitle: { fontSize: 18, fontWeight: "600", color: colors.foreground },
  dropSubtitle: { marginTop: 4, fontSize: 14, color: colors.mutedForeground },
  chooseBtn: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  chooseBtnText: { color: colors.primaryForeground, fontSize: 14, fontWeight: "500" },
  secureNote: { marginTop: 16, fontSize: 11, color: colors.mutedForeground },
  fileCard: {
    marginHorizontal: 20,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 20,
    gap: 20,
    ...shadows.card,
  },
  fileRow: { flexDirection: "row", gap: 12 },
  fileIcon: {
    height: 48,
    width: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  fileMeta: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  fileSize: { marginTop: 2, fontSize: 12, color: colors.mutedForeground },
  removeBtn: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  progressWrap: { gap: 6 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 12, color: colors.mutedForeground },
  progressValue: { fontSize: 12, fontWeight: "500", color: colors.foreground },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.secondary, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  completeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  completeText: { fontSize: 14, color: colors.success },
  checklist: {
    marginTop: 24,
    marginHorizontal: 20,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  checklistTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  checklistItem: { marginTop: 8, fontSize: 14, color: colors.foreground },
});
