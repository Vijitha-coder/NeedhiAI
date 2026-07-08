import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Camera, Check, ImageIcon, RotateCcw, Zap } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, gradients, radii, shadows } from "@/lib/theme";

export default function ScanScreen() {
  const [captured, setCaptured] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Scan document" subtitle="Align the page within the frame" back="/(tabs)/home" />

      <View style={styles.preview}>
        {!captured ? (
          <>
            <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />
            <View style={styles.frame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.badge}>
              <Zap size={12} color={colors.gold} />
              <Text style={styles.badgeText}>Auto edge detect</Text>
            </View>
          </>
        ) : (
          <View style={styles.captured}>
            <View style={styles.pageMock}>
              <View style={[styles.line, { width: "50%" }]} />
              <View style={styles.line} />
              <View style={[styles.line, { width: "92%" }]} />
              <View style={[styles.line, { width: "84%" }]} />
              <View style={{ height: 12 }} />
              <View style={styles.line} />
              <View style={[styles.line, { width: "76%" }]} />
              <View style={[styles.line, { width: "88%" }]} />
            </View>
          </View>
        )}
      </View>

      {!captured ? (
        <View style={styles.controls}>
          <Pressable style={styles.sideBtn}>
            <ImageIcon size={20} color={colors.foreground} />
          </Pressable>
          <Pressable onPress={() => setCaptured(true)} style={styles.captureBtn}>
            <LinearGradient colors={gradients.primary} style={styles.captureInner}>
              <Camera size={24} color={colors.primaryForeground} />
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.sideBtn}>
            <Zap size={20} color={colors.foreground} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable onPress={() => setCaptured(false)} style={styles.actionBtn}>
            <RotateCcw size={16} color={colors.foreground} />
            <Text style={styles.actionText}>Retake</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/processing")} style={styles.analyzeBtn}>
            <Check size={16} color={colors.primaryForeground} />
            <Text style={styles.analyzeText}>Analyze</Text>
          </Pressable>
        </View>
      )}
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
  pageMock: {
    width: "75%",
    height: "85%",
    borderRadius: radii.md,
    backgroundColor: colors.card,
    padding: 16,
    gap: 8,
    ...shadows.card,
  },
  line: { height: 6, width: "100%", borderRadius: 3, backgroundColor: colors.secondary },
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
});
