import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Camera, Check, ImageIcon, RotateCcw, Zap, AlertCircle } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Image, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, gradients, radii, shadows } from "@/lib/theme";
import { uploadContract } from "@/lib/api/contracts";
import { ApiError } from "@/lib/api/client";

export default function ScanScreen() {
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function takePhoto() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError("Camera permission required to scan documents");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedUri(result.assets[0].uri);
        setError(null);
      }
    } catch (e: any) {
      setError(e.message || "Failed to take photo");
    }
  }

  async function pickFromGallery() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError("Gallery permission required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedUri(result.assets[0].uri);
        setError(null);
      }
    } catch (e: any) {
      setError(e.message || "Failed to pick image");
    }
  }

  async function analyze() {
    if (!capturedUri) return;

    setUploading(true);
    setError(null);

    try {
      const fileName = `scan_${Date.now()}.jpg`;
      const uploaded = await uploadContract(capturedUri, fileName, "image/jpeg", fileName);

      router.push({
        pathname: "/processing",
        params: { contractId: uploaded.id, title: uploaded.title },
      } as any);
    } catch (e: any) {
      console.log("Scan upload error:", e);
      if (e instanceof ApiError && e.status === 0) {
        setError("Backend unavailable. Ensure server is running and backend URL is configured correctly.");
      } else {
        setError(e.message || "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Scan document" subtitle="Real camera → OCR → AI analysis" back="/(tabs)/home" />

      {error && (
        <View style={styles.errorBox}>
          <AlertCircle size={16} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.preview}>
        {!capturedUri ? (
          <>
            <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />
            <View style={styles.frame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              <Text style={styles.frameHint}>Align document within frame</Text>
            </View>
            <View style={styles.badge}>
              <Zap size={12} color={colors.gold} />
              <Text style={styles.badgeText}>Real OCR enabled</Text>
            </View>
          </>
        ) : (
          <View style={styles.captured}>
            <Image source={{ uri: capturedUri }} style={styles.capturedImage} resizeMode="contain" />
          </View>
        )}
      </View>

      {!capturedUri ? (
        <View style={styles.controls}>
          <Pressable style={styles.sideBtn} onPress={pickFromGallery}>
            <ImageIcon size={20} color={colors.foreground} />
          </Pressable>
          <Pressable onPress={takePhoto} style={styles.captureBtn}>
            <LinearGradient colors={gradients.primary} style={styles.captureInner}>
              <Camera size={24} color={colors.primaryForeground} />
            </LinearGradient>
          </Pressable>
          <View style={[styles.sideBtn, { opacity: 0.3 }]}>
            <Zap size={20} color={colors.foreground} />
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable onPress={() => setCapturedUri(null)} style={styles.actionBtn} disabled={uploading}>
            <RotateCcw size={16} color={colors.foreground} />
            <Text style={styles.actionText}>Retake</Text>
          </Pressable>
          <Pressable onPress={analyze} style={styles.analyzeBtn} disabled={uploading}>
            {uploading ? (
              <>
                <ActivityIndicator size="small" color={colors.primaryForeground} />
                <Text style={styles.analyzeText}>Uploading...</Text>
              </>
            ) : (
              <>
                <Check size={16} color={colors.primaryForeground} />
                <Text style={styles.analyzeText}>Analyze with Real AI</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How scanning works (Real Pipeline)</Text>
        <Text style={styles.infoText}>
          1. Take photo of physical contract{"\n"}
          2. Upload as JPG to FastAPI backend{"\n"}
          3. Backend runs OCR (pytesseract) if needed{"\n"}
          4. Text cleaned & chunked{"\n"}
          5. Embeddings generated{"\n"}
          6. Legal knowledge base searched (RAG){"\n"}
          7. LLM analyzes & returns structured risks{"\n"}
          8. Results stored in database
        </Text>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>Requires Tesseract OCR installed on backend for image text extraction. Fallback will still work but with limited accuracy if OCR not available.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
  preview: {
    marginHorizontal: 20,
    aspectRatio: 3 / 4,
    borderRadius: radii.xl,
    overflow: "hidden",
    backgroundColor: colors.primary,
    ...shadows.elevated,
  },
  frame: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  frameHint: { marginTop: 120, color: "rgba(255,255,255,0.6)", fontSize: 12 },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: colors.gold,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderRadius: 8,
  },
  cornerTL: { top: "10%", left: "12%" },
  cornerTR: { top: "10%", right: "12%", transform: [{ rotate: "90deg" }] },
  cornerBL: { bottom: "10%", left: "12%", transform: [{ rotate: "-90deg" }] },
  cornerBR: { bottom: "10%", right: "12%", transform: [{ rotate: "180deg" }] },
  badge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(250,249,247,0.15)",
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { color: "rgba(250,249,247,0.8)", fontSize: 12 },
  captured: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  capturedImage: { width: "100%", height: "100%" },
  controls: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  sideBtn: {
    height: 44,
    width: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtn: {
    height: 72,
    width: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.primaryForeground,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryForeground,
  },
  captureInner: {
    height: 56,
    width: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    marginTop: 24,
    marginHorizontal: 20,
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 16,
  },
  actionText: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  analyzeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    paddingVertical: 16,
  },
  analyzeText: { fontSize: 14, fontWeight: "500", color: colors.primaryForeground },
  errorBox: {
    marginHorizontal: 20,
    marginBottom: 16,
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(220,76,76,0.1)",
    borderWidth: 1,
    borderColor: "rgba(220,76,76,0.3)",
    borderRadius: radii.md,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: colors.destructive },
  infoBox: {
    marginTop: 24,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: { fontSize: 12, fontWeight: "600", color: colors.foreground, marginBottom: 8, textTransform: "uppercase" },
  infoText: { fontSize: 12, color: colors.mutedForeground, lineHeight: 18 },
  disclaimer: { marginTop: 12, marginHorizontal: 20, padding: 10, backgroundColor: colors.surface, borderRadius: radii.md },
  disclaimerText: { fontSize: 10, color: colors.mutedForeground, lineHeight: 14 },
});
