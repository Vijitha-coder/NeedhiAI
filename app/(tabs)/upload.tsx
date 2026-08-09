import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { CheckCircle2, FileText, UploadCloud, X, Image as ImageIcon, AlertCircle } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator, Alert, Platform } from "react-native";

import { ScreenHeader } from "@/components/ScreenHeader";
import { PrimaryButton } from "@/components/FormControls";
import { colors, gradients, radii, shadows } from "@/lib/theme";
import { uploadContract } from "@/lib/api/contracts";
import { ApiError } from "@/lib/api/client";

type PickedFile = {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
};

export default function UploadScreen() {
  const [file, setFile] = useState<PickedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickDocument() {
    try {
      if (Platform.OS === "web") {
        // Web: use hidden file input
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".pdf,.docx,.doc,.jpg,.jpeg,.png";
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (file) {
            if (file.size > 25 * 1024 * 1024) {
              setError("File too large. Maximum 25 MB allowed.");
              return;
            }
            setFile({
              uri: URL.createObjectURL(file),
              name: file.name,
              size: file.size,
              mimeType: file.type,
            });
            setError(null);
          }
        };
        input.click();
        return;
      }

      // React Native: use expo-document-picker
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg",
          "image/png",
          "image/jpg",
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Validate size 25MB
        if (asset.size && asset.size > 25 * 1024 * 1024) {
          setError("File too large. Maximum 25 MB allowed.");
          return;
        }
        setFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType ?? "application/pdf",
        });
        setError(null);
      }
    } catch (e: any) {
      setError(e.message || "Failed to pick document");
    }
  }

  async function pickImage() {
    try {
      if (Platform.OS === "web") {
        // Web: use hidden file input for images
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (file) {
            if (file.size > 25 * 1024 * 1024) {
              setError("Image too large. Maximum 25 MB allowed.");
              return;
            }
            setFile({
              uri: URL.createObjectURL(file),
              name: file.name,
              size: file.size,
              mimeType: file.type,
            });
            setError(null);
          }
        };
        input.click();
        return;
      }

      // React Native: use expo-image-picker
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError("Permission to access photos is required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 25 * 1024 * 1024) {
          setError("Image too large. Maximum 25 MB allowed.");
          return;
        }
        setFile({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          size: asset.fileSize,
          mimeType: asset.mimeType || "image/jpeg",
        });
        setError(null);
      }
    } catch (e: any) {
      setError(e.message || "Failed to pick image");
    }
  }

  async function handleUploadAndAnalyze() {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Map mimeType properly
      let mime = file.mimeType || "application/pdf";
      if (file.name.toLowerCase().endsWith(".pdf") && !mime.includes("pdf")) mime = "application/pdf";
      if (file.name.toLowerCase().endsWith(".docx")) mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg")) mime = "image/jpeg";
      if (file.name.toLowerCase().endsWith(".png")) mime = "image/png";

      const uploaded = await uploadContract(file.uri, file.name, mime, file.name);

      // Navigate to processing with contractId
      router.push({
        pathname: "/processing",
        params: { contractId: uploaded.id, title: uploaded.title },
      } as any);
    } catch (e: any) {
      console.log("Upload error:", e);
      console.log("Error status:", e.status);
      console.log("Error data:", e.data);
      if (e instanceof ApiError) {
        if (e.status === 0) {
          setError("Cannot connect to backend. Ensure backend is running and URL is correct. Check lib/config.ts");
        } else if (e.status === 422) {
          setError(`Validation error: ${JSON.stringify(e.data)}`);
        } else {
          setError(e.message);
        }
      } else {
        setError(e.message || "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Upload contract" subtitle="PDF, DOCX, JPG, PNG up to 25 MB" back="/(tabs)/home" />

      {error && (
        <View style={styles.errorBox}>
          <AlertCircle size={16} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!file ? (
        <>
          <Pressable onPress={pickDocument} style={styles.dropzone}>
            <LinearGradient colors={gradients.primary} style={styles.dropIcon}>
              <UploadCloud size={36} color={colors.primaryForeground} />
            </LinearGradient>
            <Text style={styles.dropTitle}>Choose your file</Text>
            <Text style={styles.dropSubtitle}>Tap to browse PDF, DOCX, or images</Text>
            <View style={styles.chooseBtn}>
              <Text style={styles.chooseBtnText}>Choose file</Text>
            </View>
            <Text style={styles.secureNote}>Encrypted in transit. Real OCR + AI analysis.</Text>
          </Pressable>

          <Pressable onPress={pickImage} style={styles.imageOption}>
            <ImageIcon size={20} color={colors.primary} />
            <Text style={styles.imageOptionText}>Or pick an image from gallery</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.fileCard}>
          <View style={styles.fileRow}>
            <View style={styles.fileIcon}>
              <FileText size={24} color={colors.primary} />
            </View>
            <View style={styles.fileMeta}>
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.fileSize}>
                {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "Document"} · {file.mimeType ?? "document"}
              </Text>
            </View>
            <Pressable onPress={() => setFile(null)} style={styles.removeBtn} disabled={uploading}>
              <X size={16} color={colors.foreground} />
            </Pressable>
          </View>

          {uploading ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.uploadingText}>Uploading & extracting text...</Text>
            </View>
          ) : (
            <View style={styles.completeRow}>
              <CheckCircle2 size={16} color={colors.success} />
              <Text style={styles.completeText}>Ready to analyze with real AI pipeline</Text>
            </View>
          )}

          <PrimaryButton label={uploading ? "Uploading..." : "Analyze with AI"} onPress={handleUploadAndAnalyze} />
          <Text style={styles.hintText}>This will run OCR (if needed), chunking, embeddings, RAG & LLM analysis</Text>
        </View>
      )}

      <View style={styles.checklist}>
        <Text style={styles.checklistTitle}>What NeedhiAI checks (Real Analysis)</Text>
        <Text style={styles.checklistItem}>✓ Auto-renewal & termination traps</Text>
        <Text style={styles.checklistItem}>✓ Hidden fees and price escalations</Text>
        <Text style={styles.checklistItem}>✓ Liability caps & indemnity risks</Text>
        <Text style={styles.checklistItem}>✓ Data & IP ownership</Text>
        <Text style={styles.checklistItem}>✓ Non-compete & confidentiality</Text>
        <Text style={styles.checklistItem}>✓ Missing important clauses</Text>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Disclaimer: Analysis is AI-generated for informational purposes. Not legal advice. Consult a qualified lawyer for high-risk decisions. Backend must be running for real analysis.
        </Text>
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
  imageOption: {
    marginTop: 16,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 14,
  },
  imageOptionText: { fontSize: 14, color: colors.foreground, fontWeight: "500" },
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
  uploadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  uploadingText: { fontSize: 13, color: colors.mutedForeground },
  completeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  completeText: { fontSize: 13, color: colors.success },
  hintText: { fontSize: 11, color: colors.mutedForeground, textAlign: "center" },
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
  errorText: { flex: 1, fontSize: 13, color: colors.destructive, lineHeight: 18 },
  disclaimer: {
    marginTop: 16,
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerText: { fontSize: 11, color: colors.mutedForeground, lineHeight: 16 },
});
