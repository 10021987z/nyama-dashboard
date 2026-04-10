import { authService } from "./auth-service";
import type { AuthUser, JwtPayload } from "./types";

export function logout(): void {
  authService.logout();
  window.location.href = "/login";
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1])) as JwtPayload;
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
        role: parsed.role || parsed.adminRole || "",
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
  return { sub: payload.sub, role: payload.role, phone: payload.phone };
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("accessToken");
  if (!token) return false;
  const payload = decodeToken(token);
  if (!payload) return false;
  return payload.exp * 1000 > Date.now();
}
