"use client";

import { useState, useRef, type KeyboardEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestOtp, verifyOtp } from "@/lib/auth";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Step 1: request OTP ────────────────────────────────────────────────────

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const fullPhone = phone.startsWith("+237")
        ? phone
        : `+237${phone.replace(/\s/g, "")}`;
      await requestOtp(fullPhone);
      setPhone(fullPhone);
      setStep("otp");
      toast.success("Code OTP envoyé par SMS !");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible d'envoyer le code."
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: verify OTP ─────────────────────────────────────────────────────

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Entrez les 6 chiffres du code.");
      return;
    }
    setLoading(true);
    try {
      const result = await verifyOtp(phone, code);
      // Decode role from token
      const parts = result.accessToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1])) as { role?: string };
        if (payload.role !== "ADMIN") {
          toast.error("Accès réservé aux administrateurs.");
          // Clear stored tokens
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          document.cookie = "auth-token=; path=/; max-age=0";
          setLoading(false);
          return;
        }
      }
      toast.success("Connexion réussie !");
      router.push("/dashboard");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Code incorrect ou expiré."
      );
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  // ── OTP input handlers ─────────────────────────────────────────────────────

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

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #F57C20 0%, #E06A10 50%, #8b4c11 100%)" }}
    >
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="text-4xl mb-2">🍽️</div>
          <CardTitle
            className="text-2xl font-black"
            style={{ color: "#F57C20" }}
          >
            NYAMA Dashboard
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Espace Administration
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          {step === "phone" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Numéro de téléphone
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground shrink-0">
                    +237
                  </div>
                  <Input
                    type="tel"
                    placeholder="6XX XX XX XX"
                    value={phone}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setPhone(e.target.value)
                    }
                    required
                    className="flex-1"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-bold text-white"
                style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
                disabled={loading}
              >
                {loading ? "Envoi en cours..." : "Recevoir le code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Code envoyé au <strong>{phone}</strong>
                </p>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Code de vérification
                </label>
                <div
                  className="flex gap-2 justify-center"
                  onPaste={handleOtpPaste}
                >
                  {otp.map((digit, i) => (
                    <Input
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
                      className="w-11 h-12 text-center text-xl font-bold p-0"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-bold text-white"
                style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
                disabled={loading || otp.join("").length < 6}
              >
                {loading ? "Vérification..." : "Se connecter"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("phone");
                  setOtp(["", "", "", "", "", ""]);
                }}
              >
                ← Changer de numéro
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
