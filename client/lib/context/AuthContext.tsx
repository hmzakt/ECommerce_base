"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User, LoginPayload, RegisterPayload } from "@/lib/types/auth";
import {
  loginApi,
  registerApi,
  getMeApi,
  logoutApi,
  refreshTokenApi,
  googleAuthApi,
} from "@/lib/api/auth";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "maison_access_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hydrationStarted = useRef(false);

  // Persist token to localStorage
  const saveToken = useCallback((token: string | null) => {
    setAccessToken(token);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  // Hydrate from localStorage on mount.
  // Strategy:
  //  1. Try the stored access token with /auth/me.
  //  2. If that fails (token expired/invalid), attempt a silent refresh using
  //     the httpOnly refresh cookie — refreshTokenApi needs NO token arg.
  //  3. Only clear the session if the refresh cookie is also gone/expired.
  useEffect(() => {
    if (hydrationStarted.current) return;
    hydrationStarted.current = true;

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
        // Access token stale — try silent refresh via httpOnly cookie.
        // We pass the old token so the backend can extract userId (it ignores expiry for this).
        try {
          const { accessToken: newToken } = await refreshTokenApi(stored);
          saveToken(newToken);
          const { user: u } = await getMeApi(newToken);
          setUser(u);
        } catch (error) {
          console.error("Unable to restore the saved authentication session.", error);
          // Both tokens expired — clear local state.
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

  const googleLogin = useCallback(
    async (credential: string) => {
      const { user: u, accessToken: token } = await googleAuthApi(credential);
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
      googleLogin,
      logout,
      fetchMe,
    }),
    [user, accessToken, isLoading, login, register, googleLogin, logout, fetchMe],
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
