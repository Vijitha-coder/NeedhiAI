import { apiRequest, saveToken, saveUser, deleteToken } from "./client";

export interface User {
  id: string;
  email: string;
  full_name: string;
  plan: string;
  avatar_initials: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function register(full_name: string, email: string, password: string): Promise<TokenResponse> {
  const data = await apiRequest<TokenResponse>("/auth/register", {
    method: "POST",
    body: { full_name, email, password },
    auth: false,
  });

  await saveToken(data.access_token);
  await saveUser(data.user);

  return data;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const data = await apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });

  await saveToken(data.access_token);
  await saveUser(data.user);

  return data;
}

export async function getMe(): Promise<User> {
  const user = await apiRequest<User>("/auth/me", {
    method: "GET",
  });
  await saveUser(user);
  return user;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest("/auth/logout", {
      method: "POST",
    });
  } catch (e) {
    // Ignore logout error, clear locally anyway
    console.log("Logout API error (ignored):", e);
  } finally {
    await deleteToken();
  }
}
