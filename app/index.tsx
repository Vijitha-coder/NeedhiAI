import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Scale, Sparkles } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, gradients, radii } from "@/lib/theme";

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => router.replace("/login"), 2400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={gradients.hero} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <LinearGradient colors={gradients.gold} style={styles.logo}>
            <Scale size={48} color={colors.primary} strokeWidth={2.2} />
            <Sparkles size={24} color={colors.gold} style={styles.sparkle} />
          </LinearGradient>
        </View>
        <Text style={styles.title}>NeedhiAI</Text>
        <Text style={styles.tagline}>Justice, made simple.</Text>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.dot} />
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
  logoWrap: {
    marginBottom: 24,
  },
  logo: {
    height: 96,
    width: 96,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkle: {
    position: "absolute",
    top: -8,
    right: -8,
  },
  title: {
    fontSize: 44,
    fontWeight: "600",
    color: colors.primaryForeground,
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(250, 249, 247, 0.7)",
    letterSpacing: 0.5,
  },
  dots: {
    marginTop: 40,
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: "rgba(250, 249, 247, 0.5)",
  },
});
