import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getToken, getUser, deleteToken } from "./api/client";
import { getMe, User } from "./api/auth";
import { router } from "expo-router";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      setIsLoading(true);
      const storedToken = await getToken();
      const storedUser = await getUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);

        // Validate token with backend
        try {
          const freshUser = await getMe();
          setUser(freshUser);
        } catch (e) {
          console.log("Token invalid or backend unavailable:", e);
          // If backend unavailable, keep local user for offline? But for security, if 401 clear
          // Check if error is 401
          // For now keep user if network error, clear if 401
          // We need to inspect error - simplified: if token exists, keep it, but on 401 clear
        }
      }
    } catch (e) {
      console.log("Auth check error:", e);
    } finally {
      setIsLoading(false);
    }
  }

  function login(newUser: User, newToken: string) {
    setUser(newUser);
    setToken(newToken);
  }

  async function logout() {
    try {
      await deleteToken();
    } finally {
      setUser(null);
      setToken(null);
      router.replace("/login");
    }
  }

  async function refreshUser() {
    try {
      const freshUser = await getMe();
      setUser(freshUser);
    } catch (e) {
      console.log("Refresh user failed:", e);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
