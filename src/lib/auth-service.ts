import { auth } from "./firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendEmailVerification,
  type ConfirmationResult,
} from "firebase/auth";
import { API_BASE_URL } from "./constants";

function storeAuth(accessToken: string, refreshToken: string, user: AuthData["user"]) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  if (user) {
    localStorage.setItem("nyama_user", JSON.stringify(user));
  }
  document.cookie = `auth-token=${accessToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
}

interface AuthData {
  accessToken: string;
  refreshToken: string;
  user?: { id: string; name?: string; email?: string; phone?: string; role: string };
}

export const authService = {
  // Google Sign-In
  async signInWithGoogle(): Promise<AuthData> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    return this.exchangeToken(idToken, result.user.phoneNumber);
  },

  // Email Sign-In
  async signInWithEmail(email: string, password: string): Promise<AuthData> {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await result.user.getIdToken();
    return this.exchangeToken(idToken);
  },

  // Email Sign-Up
  async createAccountWithEmail(email: string, password: string): Promise<AuthData> {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(result.user);
    const idToken = await result.user.getIdToken();
    return this.exchangeToken(idToken);
  },

  // Phone OTP via Firebase
  async requestPhoneOTP(phone: string, recaptchaContainer: string): Promise<ConfirmationResult> {
    const recaptcha = new RecaptchaVerifier(auth, recaptchaContainer, { size: "invisible" });
    const confirmation = await signInWithPhoneNumber(auth, phone, recaptcha);
    return confirmation;
  },

  // Exchange Firebase token for NYAMA JWT
  async exchangeToken(firebaseToken: string, phone?: string | null): Promise<AuthData> {
    const res = await fetch(`${API_BASE_URL}/auth/firebase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firebaseToken, phone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Erreur serveur");
    }
    const data = (await res.json()) as AuthData;
    storeAuth(data.accessToken, data.refreshToken, data.user);
    return data;
  },

  // Fallback OTP via backend
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
      throw new Error((err as { message?: string }).message || "Code incorrect ou expiré");
    }
    const data = (await res.json()) as AuthData;
    storeAuth(data.accessToken, data.refreshToken, data.user);
    return data;
  },

  logout() {
    auth.signOut();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("nyama_user");
    document.cookie = "auth-token=; path=/; max-age=0";
  },

  getToken(): string | null {
    return localStorage.getItem("accessToken");
  },

  getUser(): AuthData["user"] | null {
    const u = localStorage.getItem("nyama_user");
    return u ? JSON.parse(u) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
