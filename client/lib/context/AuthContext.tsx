"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User, LoginPayload, RegisterPayload } from "@/lib/types/auth";
import {
  loginApi,
  registerApi,
  getMeApi,
  logoutApi,
  refreshTokenApi,
} from "@/lib/api/auth";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "maison_access_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Persist token to localStorage
  const saveToken = useCallback((token: string | null) => {
    setAccessToken(token);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    setAccessToken(stored);

    getMeApi(stored)
      .then(({ user: u }) => {
        setUser(u);
      })
      .catch(async () => {
        // Try refresh
        try {
          const { accessToken: newToken } = await refreshTokenApi(stored);
          saveToken(newToken);
          const { user: u } = await getMeApi(newToken);
          setUser(u);
        } catch {
          // Fully expired
          saveToken(null);
          setUser(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(
    async (payload: LoginPayload) => {
      const { user: u, accessToken: token } = await loginApi(payload);
      setUser(u);
      saveToken(token);
    },
    [saveToken],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const { user: u, accessToken: token } = await registerApi(payload);
      setUser(u);
      saveToken(token);
    },
    [saveToken],
  );

  const logout = useCallback(async () => {
    if (accessToken) {
      try {
        await logoutApi(accessToken);
      } catch {
        // best-effort
      }
    }
    setUser(null);
    saveToken(null);
  }, [accessToken, saveToken]);

  const fetchMe = useCallback(async () => {
    if (accessToken) {
      try {
        const { user: u } = await getMeApi(accessToken);
        setUser(u);
      } catch (error) {
        // failed to fetch me
      }
    }
  }, [accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      fetchMe,
    }),
    [user, accessToken, isLoading, login, register, logout, fetchMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
