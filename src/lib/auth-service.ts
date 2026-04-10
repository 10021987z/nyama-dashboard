import { API_BASE_URL } from "./constants";

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

interface AdminLoginResponse {
  accessToken: string;
  user: AdminUser;
}

interface AuthData {
  accessToken: string;
  refreshToken: string;
  user?: { id: string; name?: string; email?: string; phone?: string; role: string };
}

function storeAuth(accessToken: string, refreshToken: string, user: AuthData["user"]) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  if (user) {
    localStorage.setItem("nyama_user", JSON.stringify(user));
  }
  document.cookie = `auth-token=${accessToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
}

export const authService = {
  // Admin login via dashboard API route
  async adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
    const res = await fetch("/api/v1/auth/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erreur de connexion");
    const response = data as AdminLoginResponse;
    // Store in localStorage + cookie for proxy auth
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("nyama_user", JSON.stringify(response.user));
    document.cookie = `auth-token=${response.accessToken}; path=/; max-age=7200; SameSite=Lax`;
    return response;
  },

  // Fallback OTP via backend API (kept for backward compat)
  async requestOTPFallback(phone: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/auth/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Impossible d'envoyer le code");
    }
  },

  async verifyOTPFallback(phone: string, code: string): Promise<AuthData> {
    const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Code incorrect ou expire");
    }
    const data = (await res.json()) as AuthData;
    storeAuth(data.accessToken, data.refreshToken, data.user);
    return data;
  },

  logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("nyama_user");
    document.cookie = "auth-token=; path=/; max-age=0";
  },

  getToken(): string | null {
    return localStorage.getItem("accessToken");
  },

  getUser(): AdminUser | null {
    const u = localStorage.getItem("nyama_user");
    return u ? JSON.parse(u) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
