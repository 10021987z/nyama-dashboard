"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth-service";
import { isAuthenticated } from "@/lib/auth";
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await authService.adminLogin(username.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#F5F5F0" }}
    >
      <div
        className="w-full"
        style={{
          maxWidth: 400,
          borderRadius: 20,
          padding: 40,
          backgroundColor: "#ffffff",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <Image
            src="/nyama-logo.svg"
            alt="NYAMA"
            width={72}
            height={72}
            className="mx-auto"
            priority
          />
          <p className="text-sm text-gray-400 mt-2">Administration</p>
          <div className="mt-5 h-px bg-gray-100" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="relative">
            <User
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Identifiant"
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
              className="w-full h-12 pl-10 pr-4 rounded-xl text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B4332]/20"
              style={{ backgroundColor: "#F6F6F6", border: "1px solid transparent" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#1B4332")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full h-12 pl-10 pr-11 rounded-xl text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-[#1B4332]/20"
              style={{ backgroundColor: "#F6F6F6", border: "1px solid transparent" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#1B4332")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-lg px-3.5 py-2.5 text-xs"
              style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#1B4332" }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p style={{ fontSize: 11, color: "#B0B0B0" }}>
            Acces reserve aux administrateurs autorises
          </p>
        </div>
      </div>
    </div>
  );
}
