import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Scale, Sparkles } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, gradients, radii } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";

export default function SplashScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // wait for auth check

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/login");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated]);

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
        <Text style={styles.subTagline}>LegaliSec • Real AI Pipeline</Text>
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
  subTagline: {
    marginTop: 4,
    fontSize: 11,
    color: colors.gold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
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
