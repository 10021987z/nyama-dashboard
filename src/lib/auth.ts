import { authService } from "./auth-service";
import type { AuthUser } from "./types";

export function logout(): void {
  authService.logout();
  window.location.href = "/login";
}

interface TokenPayload {
  sub: string;
  exp: number;
  iat: number;
  // Backend JWT fields
  role?: string;
  phone?: string;
  // Admin JWT fields
  adminRole?: string;
  username?: string;
  displayName?: string;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // JWT uses base64url — convert to standard base64 before atob()
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as TokenPayload;
    return payload;
  } catch {
    return null;
  }
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  // Try nyama_admin_user first (richer data from admin login)
  const stored = localStorage.getItem("nyama_admin_user");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        sub: parsed.id || parsed.sub || "",
        role: parsed.role || parsed.adminRole || "ADMIN",
        phone: parsed.phone || "",
        name: parsed.displayName || parsed.name,
        email: parsed.email,
      };
    } catch {
      // fallback to token decode
    }
  }

  const token = localStorage.getItem("nyama_admin_token");
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload) return null;
  return {
    sub: payload.sub,
    role: payload.role || payload.adminRole || "",
    phone: payload.phone || "",
    name: payload.displayName,
  };
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("nyama_admin_token");
  if (!token) return false;
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return false;
  return payload.exp * 1000 > Date.now();
}
