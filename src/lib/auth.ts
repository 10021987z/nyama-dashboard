import { apiClient } from "./api";
import { authService } from "./auth-service";
import type { AuthResponse, AuthUser, JwtPayload } from "./types";

export async function requestOtp(phone: string): Promise<void> {
  await apiClient.post("/auth/otp/request", { phone });
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<AuthResponse> {
  const data = await apiClient.post<AuthResponse>("/auth/otp/verify", {
    phone,
    code,
  });
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  if (data.user) {
    localStorage.setItem("nyama_user", JSON.stringify(data.user));
  }
  document.cookie = `auth-token=${data.accessToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
  return data;
}

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

  // Try nyama_user first (richer data from auth-service)
  const stored = localStorage.getItem("nyama_user");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        sub: parsed.id || parsed.sub || "",
        role: parsed.role || "",
        phone: parsed.phone || "",
        name: parsed.name,
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
