"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch, clearToken, setToken } from "@/lib/api";
import type { AuthResponse, LoginPayload, RegisterPayload, User } from "@/types";

const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "user";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  updateUser: (partialUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    let savedUser: User | null = null;
    try {
      const raw = window.localStorage.getItem(USER_STORAGE_KEY);
      savedUser = raw ? (JSON.parse(raw) as User) : null;
    } catch {
      savedUser = null;
    }

    if (savedToken && savedUser) {
      setTokenState(savedToken);
      setUser(savedUser);
    }

    setLoading(false);
  }, []);

  const persist = useCallback((nextToken: string, nextUser: User) => {
    // CRITICAL: save to localStorage so getItem("token") works after reload
    setToken(nextToken);
    setTokenState(nextToken);
    setUser(nextUser);
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    // Mirror token to a cookie so Server Components can read it (fetchPrivate)
    document.cookie = `token=${nextToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      setLoading(true);
      try {
        const payload: LoginPayload = { email, password };
        const res = await apiFetch<AuthResponse>("/auth/login", {
          method: "POST",
          body: payload,
        });

        const data = res.data;
        if (!data) {
          throw new Error("Login failed. No data returned from the server.");
        }

        persist(data.token, data.user);
        return data.user;
      } finally {
        setLoading(false);
      }
    },
    [persist]
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<User> => {
      setLoading(true);
      try {
        const payload: RegisterPayload = { name, email, password };
        const res = await apiFetch<AuthResponse>("/auth/register", {
          method: "POST",
          body: payload,
        });

        const data = res.data;
        if (!data) {
          throw new Error(
            "Registration failed. No data returned from the server."
          );
        }

        persist(data.token, data.user);
        return data.user;
      } finally {
        setLoading(false);
      }
    },
    [persist]
  );

  const logout = useCallback(() => {
    clearToken();
    window.localStorage.removeItem(USER_STORAGE_KEY);
    document.cookie = "token=; path=/; max-age=0";
    setTokenState(null);
    setUser(null);
    router.push("/");
    router.refresh();
  }, [router]);

  const updateUser = useCallback((partialUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated: User = { ...prev, ...partialUser };
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      updateUser,
    }),
    [user, token, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}