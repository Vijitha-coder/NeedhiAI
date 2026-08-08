import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Backend URL configuration
 * - For Android emulator: http://10.0.2.2:8000
 * - For physical device: use your machine's local IP, e.g., http://192.168.1.5:8000
 * - For iOS simulator: http://localhost:8000
 * 
 * You can override via Expo extra or environment variable
 */

function getDefaultBackendUrl(): string {
  // Check if running in Expo Go or dev
  const extra = (Constants.expoConfig?.extra || {}) as any;

  // If explicit backendUrl in app.json extra
  if (extra.backendUrl) {
    // On Android device physical, 10.0.2.2 won't work, need user to set IP
    // We'll still respect the configured value but log hint
    return extra.backendUrl;
  }

  // Fallback based on platform
  if (Platform.OS === "android") {
    // Android emulator uses 10.0.2.2 to reach host localhost
    // For physical device, user should set EXPO_PUBLIC_BACKEND_URL
    const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    if (envUrl) return envUrl;
    return "http://10.0.2.2:8000";
  }

  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8000";
  }

  return process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8000";
}

export const BACKEND_URL = getDefaultBackendUrl();

export const API_TIMEOUT = 30000; // 30 seconds, longer for analysis

export const DISCLAIMER = "NeedhiAI provides informational assistance only and does not constitute legal advice. Consult a qualified legal professional for high-risk decisions.";

console.log(`[Config] Backend URL: ${BACKEND_URL}`);
