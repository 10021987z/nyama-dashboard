"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { SystemSettings } from "@/lib/types";
import { formatFcfa } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";
import { useLanguage } from "@/hooks/use-language";
import type { Locale } from "@/lib/i18n";
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
  const { locale, setLocale, t } = useLanguage();
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
          {t("settings.title")}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#7c7570" }}>
          {t("settings.subtitle")}
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
            {t("settings.generalConfig")}
          </h2>
        </div>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
        ) : data ? (
          <>
            <SettingRow label={t("settings.language")}>
              <select
                className="rounded-full px-4 py-1.5 text-sm outline-none cursor-pointer"
                style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
              >
                <option value="fr">{t("settings.french")}</option>
                <option value="en">{t("settings.english")}</option>
                <option value="pidgin">{t("settings.pidgin")}</option>
              </select>
            </SettingRow>
            <SettingRow label={t("settings.timezone")}>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" style={{ color: "#7c7570" }} />
                <span className="text-sm font-medium" style={{ color: "#1b1c1a" }}>{data.general.timezone}</span>
              </div>
            </SettingRow>
            <SettingRow label={t("settings.currency")}>
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
            {t("settings.paymentRules")}
          </h2>
        </div>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
        ) : data ? (
          <>
            <SettingRow label={t("settings.cashOnDelivery")}>
              <Toggle checked={data.payment.cashOnDelivery} />
            </SettingRow>
            <SettingRow label={t("settings.platformCommission")}>
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
            <SettingRow label={t("settings.minimumOrder")}>
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
            {t("settings.logistics")}
          </h2>
        </div>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
        ) : data ? (
          <>
            <SettingRow label={t("settings.deliveryRadius")}>
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
            <SettingRow label={t("settings.defaultDeliveryFee")}>
              <span className="text-sm font-semibold" style={{ color: "#1b1c1a" }}>
                {formatFcfa(data.logistics.defaultDeliveryFeeXaf)}
              </span>
            </SettingRow>
            <SettingRow label={t("settings.enforceHours")}>
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
            {t("settings.security")}
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
              <span className="text-sm" style={{ color: "#1b1c1a" }}>{t("settings.mfa")}</span>
              <ChevronRight className="h-4 w-4" style={{ color: "#b8b3ad" }} />
            </div>
            <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-[#fbf9f5] -mx-2 px-2 rounded-xl transition-colors" style={{ borderBottom: "1px solid #f5f3ef" }}>
              <span className="text-sm" style={{ color: "#1b1c1a" }}>{t("settings.accessLogs")}</span>
              <ChevronRight className="h-4 w-4" style={{ color: "#b8b3ad" }} />
            </div>
            <div className="py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#7c7570" }}>
                {t("settings.apiKey")}
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
            {t("settings.visualIdentity")}
          </h2>
        </div>
        <div className="flex items-start gap-6">
          {/* Logo */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#7c7570" }}>{t("settings.currentLogo")}</p>
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
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#7c7570" }}>{t("settings.primaryColor")}</p>
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
            {t("settings.recentChanges")}
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
          {t("settings.viewFullLog")}
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-bold text-white transition-all"
        style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
      >
        <LogOut className="h-4 w-4" />
        {t("common.logout")}
      </button>

      {/* Footer */}
      <p
        className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2"
        style={{ color: "#b8b3ad" }}
      >
        {t("footer")}
      </p>
    </div>
  );
}
