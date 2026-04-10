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
    const payload = JSON.parse(atob(parts[1])) as TokenPayload;
    return payload;
  } catch {
    return null;
  }
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  // Try nyama_user first (richer data from admin login)
  const stored = localStorage.getItem("nyama_user");
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

  const token = localStorage.getItem("accessToken");
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
  const token = localStorage.getItem("accessToken");
  if (!token) return false;
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return false;
  return payload.exp * 1000 > Date.now();
}
