"use client";
/**
 * admin/context/AuthContext.tsx
 *
 * Global auth state for the admin panel.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { authApi, type LoginResponse } from "../api/admin";
import { tokenStorage } from "../api/client";
import { saveAdminToken, clearAllTokens } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On mount: restore session from token presence
  useEffect(() => {
    function restoreSession() {
      const access = tokenStorage.getAccess();
      if (access) {
        const stored = localStorage.getItem("admin_user");
        if (stored) {
          try {
            setUser(JSON.parse(stored));
            // Re-sync cookie in case it was cleared
            saveAdminToken(access);
          } catch {
            tokenStorage.clear();
            clearAllTokens();
          }
        }
      } else {
        tokenStorage.clear();
      }
      setIsLoading(false);
    }
    restoreSession();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data: LoginResponse = await authApi.login(username, password);
    setUser(data.user);
    localStorage.setItem("admin_user", JSON.stringify(data.user));
    // Sync access token to cookie for middleware
    const access = tokenStorage.getAccess();
    if (access) saveAdminToken(access);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    clearAllTokens();
    toast.success("تم تسجيل الخروج بنجاح");
    router.push("/admin/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
