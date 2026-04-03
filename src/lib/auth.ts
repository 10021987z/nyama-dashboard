import { apiClient } from "./api";
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
  document.cookie = `auth-token=${data.accessToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
  return data;
}

export function logout(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  document.cookie = "auth-token=; path=/; max-age=0";
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
