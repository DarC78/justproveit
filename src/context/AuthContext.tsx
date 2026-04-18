import {
  adminMeRequest,
  AuthUser,
  clearStoredSession,
  getStoredSession,
  isAdminUser,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  saveStoredSession,
} from "@/lib/auth";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  requireAdmin: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setStatus("anonymous");
  }, []);

  const applySession = useCallback(
    (nextSession: { user: AuthUser; token: string; refreshToken: string }) => {
      saveStoredSession(nextSession);
      setUser(nextSession.user);
      setToken(nextSession.token);
      setRefreshToken(nextSession.refreshToken);
      setStatus("authenticated");
    },
    [],
  );

  const refreshSession = useCallback(async () => {
    if (!refreshToken) {
      clearSession();
      return false;
    }

    try {
      const refreshed = await refreshRequest(refreshToken);

      if (!refreshed.token || !refreshed.refreshToken) {
        clearSession();
        return false;
      }

      const refreshedUser = refreshed.user ?? (await meRequest(refreshed.token));
      applySession({
        user: refreshedUser,
        token: refreshed.token,
        refreshToken: refreshed.refreshToken,
      });

      return true;
    } catch {
      clearSession();
      return false;
    }
  }, [applySession, clearSession, refreshToken]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const stored = getStoredSession();

      if (!stored.token || !stored.refreshToken) {
        if (!cancelled) {
          setStatus("anonymous");
        }
        return;
      }

      setToken(stored.token);
      setRefreshToken(stored.refreshToken);
      setUser(stored.user);

      try {
        const restoredUser = await meRequest(stored.token);

        if (!cancelled) {
          applySession({
            user: restoredUser,
            token: stored.token,
            refreshToken: stored.refreshToken,
          });
        }
      } catch {
        if (cancelled) {
          return;
        }

        try {
          const refreshed = await refreshRequest(stored.refreshToken);

          if (!refreshed.token || !refreshed.refreshToken) {
            clearSession();
            return;
          }

          const refreshedUser = refreshed.user ?? (await meRequest(refreshed.token));
          applySession({
            user: refreshedUser,
            token: refreshed.token,
            refreshToken: refreshed.refreshToken,
          });
        } catch {
          clearSession();
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await loginRequest(email, password);
      applySession(session);
      return session.user;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      if (token) {
        await logoutRequest(token);
      }
    } finally {
      clearSession();
    }
  }, [clearSession, token]);

  const requireAdmin = useCallback(async () => {
    if (!token) {
      return false;
    }

    try {
      await adminMeRequest(token);
      return true;
    } catch {
      return false;
    }
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      token,
      isAdmin: isAdminUser(user),
      login,
      logout,
      refreshSession,
      requireAdmin,
    }),
    [login, logout, refreshSession, requireAdmin, status, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
