"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { SystemSettings } from "@/lib/types";
import { formatFcfa } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";
import {
  Globe, Clock, Coins, CreditCard, Truck, Shield,
  ChevronRight, Copy, Check, Palette, LogOut, History,
} from "lucide-react";

// ── Toggle (visual only) ─────────────────────────────────────────────────────

function Toggle({ checked }: { checked: boolean }) {
  return (
    <div
      className="relative h-6 w-11 rounded-full shrink-0 transition-colors cursor-default"
      style={{ backgroundColor: checked ? "#a03c00" : "#e8e4de" }}
    >
      <div
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
      />
    </div>
  );
}

// ── SettingRow ────────────────────────────────────────────────────────────────

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #f5f3ef" }}>
      <span className="text-sm" style={{ color: "#7c7570" }}>{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<SystemSettings>("/admin/settings");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de contacter le serveur NYAMA");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  function handleCopyKey() {
    if (data?.security.apiKeyMasked) {
      navigator.clipboard.writeText(data.security.apiKeyMasked);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const BRAND_COLORS = [
    { name: "Terracotta", value: "#a03c00", active: true },
    { name: "Leaf", value: "#2c694e", active: false },
    { name: "Gold", value: "#b45309", active: false },
    { name: "Dark", value: "#1b1c1a", active: false },
  ];

  return (
    <div className="space-y-6 pb-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1
          className="text-[2rem] font-semibold italic leading-tight"
          style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
        >
          Configuration de l&apos;Écosystème
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#7c7570" }}>
          Gérez les fondations opérationnelles de Nyama.
        </p>
      </div>

      {error && <ErrorState message={error} onRetry={fetchSettings} />}

      {/* Configuration Générale */}
      <div
        className="rounded-2xl p-6 space-y-1"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5" style={{ color: "#a03c00" }} />
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            Configuration Générale
          </h2>
        </div>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
        ) : data ? (
          <>
            <SettingRow label="Langue">
              <select
                className="rounded-full px-4 py-1.5 text-sm outline-none cursor-pointer"
                style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
                defaultValue={data.general.language}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </SettingRow>
            <SettingRow label="Fuseau horaire">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" style={{ color: "#7c7570" }} />
                <span className="text-sm font-medium" style={{ color: "#1b1c1a" }}>{data.general.timezone}</span>
              </div>
            </SettingRow>
            <SettingRow label="Devise locale">
              <input
                type="text"
                value={data.general.currency}
                disabled
                className="rounded-full px-4 py-1.5 text-sm text-right w-24"
                style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
              />
            </SettingRow>
          </>
        ) : null}
      </div>

      {/* Règles de Paiement */}
      <div
        className="rounded-2xl p-6 space-y-1"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5" style={{ color: "#a03c00" }} />
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            Règles de Paiement
          </h2>
        </div>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
        ) : data ? (
          <>
            <SettingRow label="Paiement à la livraison">
              <Toggle checked={data.payment.cashOnDelivery} />
            </SettingRow>
            <SettingRow label="Commission plateforme">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={data.payment.platformCommission}
                  disabled
                  className="rounded-full px-4 py-1.5 text-sm text-right w-20"
                  style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
                />
                <span className="text-sm font-semibold" style={{ color: "#7c7570" }}>%</span>
              </div>
            </SettingRow>
            <SettingRow label="Montant minimum">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={data.payment.minimumOrderXaf.toLocaleString("fr-FR")}
                  disabled
                  className="rounded-full px-4 py-1.5 text-sm text-right w-24"
                  style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
                />
                <span className="text-sm font-semibold" style={{ color: "#7c7570" }}>FCFA</span>
              </div>
            </SettingRow>
          </>
        ) : null}
      </div>

      {/* Logistique */}
      <div
        className="rounded-2xl p-6 space-y-1"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Truck className="h-5 w-5" style={{ color: "#a03c00" }} />
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            Logistique
          </h2>
        </div>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
        ) : data ? (
          <>
            <SettingRow label="Rayon de livraison">
              <div className="flex items-center gap-3">
                <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f5f3ef" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (data.logistics.maxDeliveryRadiusKm / 30) * 100)}%`,
                      backgroundColor: "#a03c00",
                    }}
                  />
                </div>
                <span className="text-sm font-bold" style={{ color: "#1b1c1a" }}>
                  {data.logistics.maxDeliveryRadiusKm} km
                </span>
              </div>
            </SettingRow>
            <SettingRow label="Frais de livraison par défaut">
              <span className="text-sm font-semibold" style={{ color: "#1b1c1a" }}>
                {formatFcfa(data.logistics.defaultDeliveryFeeXaf)}
              </span>
            </SettingRow>
            <SettingRow label="Heures d'ouverture globales">
              <Toggle checked={data.logistics.enforceOpeningHours} />
            </SettingRow>
          </>
        ) : null}
      </div>

      {/* Sécurité & Accès */}
      <div
        className="rounded-2xl p-6 space-y-1"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5" style={{ color: "#a03c00" }} />
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            Sécurité & Accès
          </h2>
          {data?.security.mfaEnabled && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: "#dcfce7", color: "#166534" }}
            >
              ACTIF
            </span>
          )}
        </div>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
        ) : data ? (
          <>
            <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-[#fbf9f5] -mx-2 px-2 rounded-xl transition-colors" style={{ borderBottom: "1px solid #f5f3ef" }}>
              <span className="text-sm" style={{ color: "#1b1c1a" }}>Multi-Facteur (MFA)</span>
              <ChevronRight className="h-4 w-4" style={{ color: "#b8b3ad" }} />
            </div>
            <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-[#fbf9f5] -mx-2 px-2 rounded-xl transition-colors" style={{ borderBottom: "1px solid #f5f3ef" }}>
              <span className="text-sm" style={{ color: "#1b1c1a" }}>Logs d&apos;accès</span>
              <ChevronRight className="h-4 w-4" style={{ color: "#b8b3ad" }} />
            </div>
            <div className="py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#7c7570" }}>
                Clé API de production
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={data.security.apiKeyMasked}
                  readOnly
                  className="flex-1 rounded-full px-4 py-2 text-sm font-mono"
                  style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
                />
                <button
                  onClick={handleCopyKey}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                  style={{ backgroundColor: "#f5f3ef" }}
                  title="Copier"
                >
                  {copied ? (
                    <Check className="h-4 w-4" style={{ color: "#16a34a" }} />
                  ) : (
                    <Copy className="h-4 w-4" style={{ color: "#7c7570" }} />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Identité Visuelle */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-5 w-5" style={{ color: "#a03c00" }} />
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            Identité Visuelle
          </h2>
        </div>
        <div className="flex items-start gap-6">
          {/* Logo */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#7c7570" }}>Logo actuel</p>
            <div
              className="flex h-[100px] w-[100px] items-center justify-center rounded-2xl"
              style={{ backgroundColor: "#f5f3ef" }}
            >
              <span
                className="text-lg font-bold italic"
                style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#a03c00" }}
              >
                NYAMA
              </span>
            </div>
          </div>
          {/* Colors */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#7c7570" }}>Couleur primaire</p>
            <div className="flex items-center gap-3">
              {BRAND_COLORS.map((c) => (
                <div
                  key={c.name}
                  className="h-9 w-9 rounded-full cursor-pointer transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    boxShadow: c.active ? `0 0 0 3px #fbf9f5, 0 0 0 5px ${c.value}` : undefined,
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dernières modifications */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5" style={{ color: "#a03c00" }} />
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            Dernières modifications du système
          </h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5"
              style={{ backgroundColor: "#fdf3ee" }}
            >
              <CreditCard className="h-4 w-4" style={{ color: "#a03c00" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#1b1c1a" }}>Commission plateforme mise à jour de 12% à 15%</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#b8b3ad" }}>Il y a 3 jours &bull; Admin principal</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5"
              style={{ backgroundColor: "#fdf3ee" }}
            >
              <Truck className="h-4 w-4" style={{ color: "#a03c00" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#1b1c1a" }}>Rayon de livraison étendu à 15 km pour Yaoundé</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#b8b3ad" }}>Il y a 1 semaine &bull; Admin principal</p>
            </div>
          </div>
        </div>
        <button className="mt-4 text-xs font-semibold" style={{ color: "#a03c00" }}>
          Voir le journal complet
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-bold text-white transition-all"
        style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
      >
        <LogOut className="h-4 w-4" />
        Se déconnecter
      </button>

      {/* Footer */}
      <p
        className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2"
        style={{ color: "#b8b3ad" }}
      >
        NYAMA TECH SYSTEMS &copy; 2026 &bull; PROPULSION DE L&apos;EXCELLENCE CULINAIRE CAMEROUNAISE
      </p>
    </div>
  );
}
