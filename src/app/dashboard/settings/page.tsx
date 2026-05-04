"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

// ── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 3000);
    return () => clearTimeout(id);
  }, [message, onDone]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        background: "linear-gradient(135deg, #F57C20, #c95a1e)",
        color: "#fff",
        padding: "12px 24px",
        borderRadius: 9999,
        fontSize: 14,
        fontWeight: 600,
        zIndex: 9999,
        boxShadow: "0 8px 24px rgba(160,60,0,0.3)",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}

// ── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ checked, onClick }: { checked: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative h-6 w-11 rounded-full shrink-0 transition-colors cursor-pointer"
      style={{ backgroundColor: checked ? "#F57C20" : "#e8e4de" }}
    >
      <div
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
      />
    </div>
  );
}

// ── SettingRow ───────────────────────────────────────────────────────────────

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #f5f3ef" }}>
      <span className="text-sm" style={{ color: "#6B7280" }}>{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

// ── Access Logs Modal ───────────────────────────────────────────────────────

const ACCESS_LOGS = [
  "2024-03-15 14:32 — 192.168.1.1 — Connexion réussie",
  "2024-03-14 09:15 — 10.0.0.42 — Export rapport",
  "2024-03-13 18:45 — 192.168.1.1 — Modification paramètres",
  "2024-03-12 11:20 — 10.0.0.42 — Connexion réussie",
  "2024-03-10 16:05 — 192.168.1.1 — Changement mot de passe",
];

function AccessLogsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(27,28,26,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9998,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 24,
          width: "90%",
          maxWidth: 480,
          boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: "#3D3D3D",
            marginBottom: 16,
          }}
        >
          Journal d&apos;accès
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ACCESS_LOGS.map((log, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#f5f3ef",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 13,
                color: "#3D3D3D",
                fontFamily: "monospace",
              }}
            >
              {log}
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            width: "100%",
            height: 40,
            borderRadius: 9999,
            background: "linear-gradient(135deg, #F57C20, #c95a1e)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

// ── Editable settings shape ─────────────────────────────────────────────────

interface EditableSettings {
  cashOnDelivery: boolean;
  minimumOrderXaf: number;
  maxDeliveryRadiusKm: number;
  defaultDeliveryFeeXaf: number;
  enforceOpeningHours: boolean;
  mfaEnabled: boolean;
}

function loadSettings(): EditableSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("nyama-settings");
    if (raw) return JSON.parse(raw) as EditableSettings;
  } catch { /* ignore */ }
  return null;
}

function saveSettings(s: EditableSettings) {
  localStorage.setItem("nyama-settings", JSON.stringify(s));
}

function settingsFromBackend(data: SystemSettings): EditableSettings {
  return {
    cashOnDelivery: data.payment.cashOnDelivery,
    minimumOrderXaf: data.payment.minimumOrderXaf,
    maxDeliveryRadiusKm: data.logistics.maxDeliveryRadiusKm,
    defaultDeliveryFeeXaf: data.logistics.defaultDeliveryFeeXaf,
    enforceOpeningHours: data.logistics.enforceOpeningHours,
    mfaEnabled: data.security.mfaEnabled,
  };
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth();
  const { locale, setLocale, t } = useLanguage();
  const [data, setData] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Editable settings state
  const [settings, setSettings] = useState<EditableSettings | null>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => setToastMsg(msg), []);

  // Access logs modal
  const [showLogs, setShowLogs] = useState(false);

  // Logo
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load logo from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nyama-logo");
      if (saved) setLogoBase64(saved);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<SystemSettings>("/admin/settings");
      setData(result);
      // Initialize editable settings: localStorage takes priority
      const local = loadSettings();
      if (local) {
        setSettings(local);
      } else {
        const fromBe = settingsFromBackend(result);
        setSettings(fromBe);
        saveSettings(fromBe);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de contacter le serveur NYAMA");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Helper to update a setting
  function updateSetting<K extends keyof EditableSettings>(key: K, value: EditableSettings[K]) {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  }

  function handleCopyKey() {
    if (data?.security.apiKeyMasked) {
      navigator.clipboard.writeText(data.security.apiKeyMasked);
      setCopied(true);
      showToast("Clé API copiée ✅");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleLogoClick() {
    fileInputRef.current?.click();
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setLogoBase64(b64);
      localStorage.setItem("nyama-logo", b64);
      showToast("Logo mis à jour ✅");
    };
    reader.readAsDataURL(file);
  }

  const BRAND_COLORS = [
    { name: "NYAMA Orange", value: "#F57C20", active: true },
    { name: "Forest Green", value: "#1B4332", active: false },
    { name: "Gold", value: "#D4A017", active: false },
    { name: "Charcoal", value: "#3D3D3D", active: false },
  ];

  return (
    <div className="space-y-6 pb-8 max-w-3xl">
      {/* Toast */}
      {toastMsg && <Toast message={toastMsg} onDone={() => setToastMsg(null)} />}

      {/* Access Logs Modal */}
      {showLogs && <AccessLogsModal onClose={() => setShowLogs(false)} />}

      {/* Hidden file input for logo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoChange}
        style={{ display: "none" }}
      />

      {/* Header */}
      <div>
        <h1
          className="text-[2rem] font-semibold italic leading-tight"
          style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
        >
          {t("settings.title")}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
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
          <Globe className="h-5 w-5" style={{ color: "#F57C20" }} />
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
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
                style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
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
                <Clock className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                <span className="text-sm font-medium" style={{ color: "#3D3D3D" }}>{data.general.timezone}</span>
              </div>
            </SettingRow>
            <SettingRow label={t("settings.currency")}>
              <input
                type="text"
                value={data.general.currency}
                disabled
                className="rounded-full px-4 py-1.5 text-sm text-right w-24"
                style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
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
          <CreditCard className="h-5 w-5" style={{ color: "#F57C20" }} />
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
          >
            {t("settings.paymentRules")}
          </h2>
        </div>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
        ) : data && settings ? (
          <>
            <SettingRow label={t("settings.cashOnDelivery")}>
              <div className="flex items-center gap-2">
                <Toggle
                  checked={false}
                  onClick={() => {
                    showToast("Le paiement en espèces n'est plus accepté (NotchPay live).");
                  }}
                />
                <span className="text-xs text-neutral-500">Désactivé</span>
              </div>
            </SettingRow>
            <SettingRow label={t("settings.platformCommission")}>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={data.payment.platformCommission}
                  disabled
                  className="rounded-full px-4 py-1.5 text-sm text-right w-20"
                  style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
                />
                <span className="text-sm font-semibold" style={{ color: "#6B7280" }}>%</span>
              </div>
            </SettingRow>
            <SettingRow label={t("settings.minimumOrder")}>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={settings.minimumOrderXaf}
                  onChange={(e) => updateSetting("minimumOrderXaf", Number(e.target.value))}
                  onBlur={() => showToast(`Montant minimum mis à jour : ${settings.minimumOrderXaf} FCFA`)}
                  className="rounded-full px-4 py-1.5 text-sm text-right w-24"
                  style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
                />
                <span className="text-sm font-semibold" style={{ color: "#6B7280" }}>FCFA</span>
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
          <Truck className="h-5 w-5" style={{ color: "#F57C20" }} />
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
          >
            {t("settings.logistics")}
          </h2>
        </div>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
        ) : data && settings ? (
          <>
            <SettingRow label={t("settings.deliveryRadius")}>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={settings.maxDeliveryRadiusKm}
                  onChange={(e) => updateSetting("maxDeliveryRadiusKm", Number(e.target.value))}
                  className="w-32"
                  style={{ accentColor: "#F57C20" }}
                />
                <span className="text-sm font-bold" style={{ color: "#3D3D3D" }}>
                  {settings.maxDeliveryRadiusKm} km
                </span>
              </div>
            </SettingRow>
            <SettingRow label={t("settings.defaultDeliveryFee")}>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={settings.defaultDeliveryFeeXaf}
                  onChange={(e) => updateSetting("defaultDeliveryFeeXaf", Number(e.target.value))}
                  onBlur={() => showToast("Frais de livraison mis à jour")}
                  className="rounded-full px-4 py-1.5 text-sm text-right w-24"
                  style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
                />
                <span className="text-sm font-semibold" style={{ color: "#6B7280" }}>FCFA</span>
              </div>
            </SettingRow>
            <SettingRow label={t("settings.enforceHours")}>
              <Toggle
                checked={settings.enforceOpeningHours}
                onClick={() => {
                  const next = !settings.enforceOpeningHours;
                  updateSetting("enforceOpeningHours", next);
                  showToast(next ? "Heures d'ouverture appliquées ✅" : "Heures d'ouverture désactivées");
                }}
              />
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
          <Shield className="h-5 w-5" style={{ color: "#F57C20" }} />
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
          >
            {t("settings.security")}
          </h2>
          {settings?.mfaEnabled && (
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
        ) : data && settings ? (
          <>
            <div
              onClick={() => {
                const action = settings.mfaEnabled ? "désactiver" : "activer";
                if (window.confirm(`Voulez-vous ${action} l'authentification multi-facteurs ?`)) {
                  const next = !settings.mfaEnabled;
                  updateSetting("mfaEnabled", next);
                  showToast(next ? "MFA activé ✅" : "MFA désactivé");
                }
              }}
              className="flex items-center justify-between py-3 cursor-pointer hover:bg-[#fbf9f5] -mx-2 px-2 rounded-xl transition-colors"
              style={{ borderBottom: "1px solid #f5f3ef" }}
            >
              <span className="text-sm" style={{ color: "#3D3D3D" }}>{t("settings.mfa")}</span>
              <ChevronRight className="h-4 w-4" style={{ color: "#b8b3ad" }} />
            </div>
            <div
              onClick={() => setShowLogs(true)}
              className="flex items-center justify-between py-3 cursor-pointer hover:bg-[#fbf9f5] -mx-2 px-2 rounded-xl transition-colors"
              style={{ borderBottom: "1px solid #f5f3ef" }}
            >
              <span className="text-sm" style={{ color: "#3D3D3D" }}>{t("settings.accessLogs")}</span>
              <ChevronRight className="h-4 w-4" style={{ color: "#b8b3ad" }} />
            </div>
            <div className="py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>
                {t("settings.apiKey")}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={data.security.apiKeyMasked}
                  readOnly
                  className="flex-1 rounded-full px-4 py-2 text-sm font-mono"
                  style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
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
                    <Copy className="h-4 w-4" style={{ color: "#6B7280" }} />
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
          <Palette className="h-5 w-5" style={{ color: "#F57C20" }} />
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
          >
            {t("settings.visualIdentity")}
          </h2>
        </div>
        <div className="flex items-start gap-6">
          {/* Logo */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>{t("settings.currentLogo")}</p>
            <div
              onClick={handleLogoClick}
              className="flex h-[100px] w-[100px] items-center justify-center rounded-2xl cursor-pointer overflow-hidden"
              style={{ backgroundColor: "#f5f3ef", position: "relative" }}
            >
              {logoBase64 ? (
                <img
                  src={logoBase64}
                  alt="Logo"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span
                  className="text-lg font-bold italic"
                  style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#F57C20" }}
                >
                  NYAMA
                </span>
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(27,28,26,0.5)",
                  opacity: 0,
                  transition: "opacity 0.2s",
                  borderRadius: 16,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0"; }}
              >
                <span style={{ color: "#fff", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center", lineHeight: 1.3 }}>
                  Cliquez pour changer
                </span>
              </div>
            </div>
          </div>
          {/* Colors */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>{t("settings.primaryColor")}</p>
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
          <History className="h-5 w-5" style={{ color: "#F57C20" }} />
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
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
              <CreditCard className="h-4 w-4" style={{ color: "#F57C20" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#3D3D3D" }}>Commission plateforme mise à jour de 12% à 15%</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#b8b3ad" }}>Il y a 3 jours &bull; Admin principal</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5"
              style={{ backgroundColor: "#fdf3ee" }}
            >
              <Truck className="h-4 w-4" style={{ color: "#F57C20" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#3D3D3D" }}>Rayon de livraison étendu à 15 km pour Yaoundé</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#b8b3ad" }}>Il y a 1 semaine &bull; Admin principal</p>
            </div>
          </div>
        </div>
        <button className="mt-4 text-xs font-semibold" style={{ color: "#F57C20" }}>
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
