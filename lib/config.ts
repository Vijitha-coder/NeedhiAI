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
  // Force localhost:8000 for web platform
  if (Platform.OS === "web") {
    console.log('[Config] Web platform detected, forcing localhost:8000');
    return "http://localhost:8000";
  }

  // Check if running in Expo Go or dev
  const extra = (Constants.expoConfig?.extra || {}) as any;

  console.log('[Config] Platform:', Platform.OS);
  console.log('[Config] Constants.expoConfig:', Constants.expoConfig);
  console.log('[Config] Extra config:', extra);

  // If explicit backendUrl in app.json extra
  if (extra.backendUrl) {
    console.log('[Config] Using backendUrl from extra:', extra.backendUrl);
    return extra.backendUrl;
  }

  // Fallback based on platform
  if (Platform.OS === "android") {
    // Android emulator uses 10.0.2.2 to reach host localhost
    // For physical device, user should set EXPO_PUBLIC_BACKEND_URL
    const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    if (envUrl) return envUrl;
    console.log('[Config] Using Android emulator URL');
    return "http://10.0.2.2:8000";
  }

  if (Platform.OS === "ios") {
    const iosUrl = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8000";
    console.log('[Config] Using iOS URL:', iosUrl);
    return iosUrl;
  }

  const defaultUrl = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8000";
  console.log('[Config] Using default URL:', defaultUrl);
  return defaultUrl;
}

export const BACKEND_URL = getDefaultBackendUrl();

export const API_TIMEOUT = 30000; // 30 seconds, longer for analysis

export const DISCLAIMER = "NeedhiAI provides informational assistance only and does not constitute legal advice. Consult a qualified legal professional for high-risk decisions.";

console.log(`[Config] Backend URL: ${BACKEND_URL}`);
