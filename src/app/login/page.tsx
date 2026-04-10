"use client";

import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/lib/auth-service";

type PhoneStep = "input" | "otp";
type EmailMode = "login" | "register";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function Divider({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400 uppercase tracking-wider">{text}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phone
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("input");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(0);

  // Email
  const [emailMode, setEmailMode] = useState<EmailMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  // Google
  const [googleError, setGoogleError] = useState<string | null>(null);

  // ── Resend timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // ── Auto-submit OTP ────────────────────────────────────────────────────────
  useEffect(() => {
    const code = otp.join("");
    if (code.length === 6) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  async function handleGoogle() {
    setGoogleError(null);
    setLoading(true);
    try {
      const data = await authService.signInWithGoogle();
      if (data.user && data.user.role !== "ADMIN") {
        toast.error("Acces reserve aux administrateurs.");
        authService.logout();
        setLoading(false);
        return;
      }
      toast.success("Connexion reussie !");
      router.push("/dashboard");
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : "Erreur Google Sign-In");
    } finally {
      setLoading(false);
    }
  }

  // ── Email ──────────────────────────────────────────────────────────────────
  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setLoading(true);
    try {
      if (emailMode === "register") {
        await authService.createAccountWithEmail(email, password);
        toast.success("Compte cree ! Verifiez votre email.");
      } else {
        await authService.signInWithEmail(email, password);
        toast.success("Connexion reussie !");
      }
      router.push("/dashboard");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  // ── Phone OTP ──────────────────────────────────────────────────────────────
  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const fullPhone = phone.startsWith("+237")
        ? phone
        : `+237${phone.replace(/\s/g, "")}`;
      await authService.requestOTPFallback(fullPhone);
      setPhone(fullPhone);
      setPhoneStep("otp");
      setResendTimer(60);
      toast.success("Code OTP envoye par SMS !");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const code = otp.join("");
    if (code.length < 6) return;
    setError(null);
    setLoading(true);
    try {
      const data = await authService.verifyOTPFallback(phone, code);
      if (data.user && data.user.role !== "ADMIN") {
        toast.error("Acces reserve aux administrateurs.");
        authService.logout();
        setLoading(false);
        return;
      }
      toast.success("Connexion reussie !");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code incorrect ou expire.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await authService.requestOTPFallback(phone);
      setResendTimer(60);
      toast.success("Code renvoye !");
    } catch {
      toast.error("Impossible de renvoyer le code.");
    } finally {
      setLoading(false);
    }
  }

  // ── OTP input helpers ──────────────────────────────────────────────────────
  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length) {
      const newOtp = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
      setOtp(newOtp);
      otpRefs.current[Math.min(pasted.length - 1, 5)]?.focus();
    }
    e.preventDefault();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const inputClass =
    "w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-[#F57C20] focus:ring-2 focus:ring-[#F57C20]/20 transition-all placeholder:text-gray-400";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#F5F5F0" }}
    >
      <div
        className="w-full shadow-sm"
        style={{
          maxWidth: 420,
          borderRadius: 24,
          padding: 40,
          backgroundColor: "#ffffff",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ color: "#F57C20" }}
          >
            NYAMA
          </h1>
          <p className="text-sm text-gray-400 mt-1">Espace Administrateur</p>
          <div className="mt-4 h-px bg-gray-100" />
        </div>

        {/* ── Google Sign-In ─────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <GoogleIcon />
          Continuer avec Google
        </button>
        {googleError && (
          <p className="text-xs text-red-500 mt-2">{googleError}</p>
        )}

        <Divider text="ou" />

        {/* ── Email / Password ───────────────────────────────────────────── */}
        <form onSubmit={handleEmail} className="space-y-3">
          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
            minLength={6}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#1B4332" }}
          >
            {loading
              ? "Chargement..."
              : emailMode === "register"
                ? "Creer un compte"
                : "Se connecter"}
          </button>
          <button
            type="button"
            className="w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
            onClick={() => {
              setEmailMode(emailMode === "login" ? "register" : "login");
              setEmailError(null);
            }}
          >
            {emailMode === "login"
              ? "Pas de compte ? S'inscrire"
              : "Deja un compte ? Se connecter"}
          </button>
          {emailError && (
            <p className="text-xs text-red-500">{emailError}</p>
          )}
        </form>

        <Divider text="ou" />

        {/* ── Phone OTP ──────────────────────────────────────────────────── */}
        {phoneStep === "input" ? (
          <form onSubmit={handleRequestOtp} className="space-y-3">
            <div className="flex gap-2">
              <div
                className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-500 shrink-0"
                style={{ height: 48 }}
              >
                +237
              </div>
              <input
                type="tel"
                placeholder="6XX XX XX XX"
                value={phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#F57C20" }}
            >
              {loading ? "Envoi en cours..." : "Recevoir le code"}
            </button>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 text-center">
              Code envoye au <strong className="text-gray-700">{phone}</strong>
            </p>
            <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleOtpChange(i, e.target.value)
                  }
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                    handleOtpKeyDown(i, e)
                  }
                  className="w-12 h-12 text-center text-xl font-bold rounded-xl border border-gray-200 bg-white outline-none focus:border-[#F57C20] focus:ring-2 focus:ring-[#F57C20]/20 transition-all"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {/* Resend */}
            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-xs text-gray-400">
                  Renvoyer dans {resendTimer}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-xs font-medium hover:underline"
                  style={{ color: "#F57C20" }}
                >
                  Renvoyer le code
                </button>
              )}
            </div>

            <button
              type="button"
              className="w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => {
                setPhoneStep("input");
                setOtp(["", "", "", "", "", ""]);
                setError(null);
              }}
            >
              ← Changer de numero
            </button>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          </div>
        )}

        {/* Hidden recaptcha container */}
        <div id="recaptcha-container" />

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-300">Version 2.5 &bull; NYAMA Admin</p>
        </div>
      </div>
    </div>
  );
}
