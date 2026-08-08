import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { BACKEND_URL, API_TIMEOUT } from "../config";

const TOKEN_KEY = "needhiai_auth_token";
const USER_KEY = "needhiai_user";

/**
 * Secure token storage - uses SecureStore on native, localStorage fallback for web
 */
export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function saveUser(user: any): Promise<void> {
  const json = JSON.stringify(user);
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(USER_KEY, json);
    }
    return;
  }
  await SecureStore.setItemAsync(USER_KEY, json);
}

export async function getUser(): Promise<any | null> {
  let json: string | null = null;
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      json = localStorage.getItem(USER_KEY);
    }
  } else {
    json = await SecureStore.getItemAsync(USER_KEY);
  }
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestOptions {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean; // whether to include token
  isFormData?: boolean;
}

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, auth = true, isFormData = false } = options;

  const url = endpoint.startsWith("http") ? endpoint : `${BACKEND_URL}${endpoint}`;

  const finalHeaders: Record<string, string> = { ...headers };

  if (!isFormData && body && typeof body === "object") {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = await getToken();
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  let fetchBody: any = undefined;
  if (body) {
    if (isFormData) {
      fetchBody = body; // FormData
    } else if (typeof body === "object") {
      fetchBody = JSON.stringify(body);
    } else {
      fetchBody = body;
    }
  }

  // Timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: fetchBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle no content
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get("content-type") || "";
    let data: any;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const message = data?.detail || data?.message || `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new ApiError("Request timed out. Please check your connection and try again.", 408);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error
    throw new ApiError(
      error.message?.includes("Network")
        ? "No internet connection or server unavailable. Please check your connection."
        : error.message || "Network request failed",
      0
    );
  }
}

export { ApiError };
