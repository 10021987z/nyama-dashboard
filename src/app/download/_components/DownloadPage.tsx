"use client";

import { useState } from "react";
import Image from "next/image";
import { QRCodeCanvas } from "qrcode.react";
import {
  Download,
  Smartphone,
  ShieldCheck,
  Globe,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import type { AppInfo } from "@/lib/apps";

interface DownloadPageProps {
  app: AppInfo;
}

export function DownloadPage({ app }: DownloadPageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(app.apkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "#fbf9f5" }}
    >
      <header className="border-b border-black/5 bg-white/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Image src="/nyama-logo.svg" alt="NYAMA" width={32} height={32} priority />
            <span
              className="text-sm font-bold tracking-tight"
              style={{
                fontFamily: "var(--font-montserrat), system-ui, sans-serif",
                color: "#1B4332",
              }}
            >
              NYAMA
            </span>
          </div>
          <span className="text-[11px] uppercase tracking-widest text-black/40">
            Cameroun · Beta
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16 pt-10 sm:pt-14">
        {/* Hero */}
        <section className="text-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: app.primaryColorRgba, color: app.primaryColor }}
          >
            <Smartphone className="h-3 w-3" /> Application Android
          </span>
          <h1
            className="mt-4 text-3xl sm:text-5xl font-bold leading-tight tracking-tight"
            style={{
              fontFamily: "var(--font-montserrat), system-ui, sans-serif",
              color: "#1B4332",
            }}
          >
            {app.name}
          </h1>
          <p
            className="mt-3 text-base sm:text-lg text-black/60"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
          >
            {app.tagline}
          </p>
        </section>

        {/* Main download card */}
        <section className="mt-8 rounded-2xl border border-black/5 bg-white p-6 sm:p-8 shadow-sm">
          <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex justify-center">
              <div
                className="rounded-2xl p-3 ring-1 ring-black/5"
                style={{ backgroundColor: app.primaryColorRgba }}
              >
                <div className="rounded-xl bg-white p-3">
                  <QRCodeCanvas
                    value={app.apkUrl}
                    size={168}
                    level="M"
                    fgColor={app.primaryColor}
                    bgColor="#ffffff"
                  />
                </div>
                <p
                  className="mt-2.5 text-center text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: app.primaryColor }}
                >
                  Scannez avec votre téléphone
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-black/70">
                {app.description}
              </p>
              <div className="flex flex-wrap gap-3 text-[11px] font-medium text-black/50">
                <span className="rounded-full bg-black/5 px-2.5 py-1">
                  Version {app.version}
                </span>
                <span className="rounded-full bg-black/5 px-2.5 py-1">
                  {app.apkSizeMB} MB
                </span>
                <span className="rounded-full bg-black/5 px-2.5 py-1">
                  Android 7.0+
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <a
                  href={app.apkUrl}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${app.primaryColor}, ${app.primaryColor}dd)`,
                  }}
                >
                  <Download className="h-4 w-4" />
                  Télécharger l&apos;APK ({app.apkSizeMB} MB)
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-3 text-sm font-medium text-black/70 transition-colors hover:bg-black/5"
                  aria-label="Copier le lien de téléchargement"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" /> Copié
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copier le lien
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Web preview link */}
        <section className="mt-4">
          <a
            href={app.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-black/5 bg-white px-5 py-4 transition-colors hover:bg-black/[0.02]"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: app.primaryColorRgba }}
              >
                <Globe className="h-4 w-4" style={{ color: app.primaryColor }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-black/80">
                  Tester en ligne (sans installer)
                </p>
                <p className="text-xs text-black/50">
                  Version web — utile pour aperçu rapide
                </p>
              </div>
            </div>
            <span
              className="text-xs font-semibold"
              style={{ color: app.primaryColor }}
            >
              Ouvrir →
            </span>
          </a>
        </section>

        {/* Install instructions */}
        <section className="mt-8 rounded-2xl border border-black/5 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" style={{ color: app.primaryColor }} />
            <h2
              className="text-sm font-bold uppercase tracking-widest text-black/70"
              style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif" }}
            >
              Comment installer
            </h2>
          </div>
          <ol className="space-y-3">
            {[
              "Téléchargez le fichier .apk via le bouton ou le QR code.",
              "Ouvrez le fichier dans votre gestionnaire de téléchargements.",
              "Acceptez l'autorisation « Installer depuis cette source » si Android la demande (Paramètres → Sécurité).",
              "Lancez l'application et connectez-vous avec votre numéro de téléphone.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-black/70">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: app.primaryColor }}
                >
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>

          <div
            className="mt-5 flex gap-3 rounded-xl p-3 text-[12px] leading-relaxed text-black/60"
            style={{ backgroundColor: app.primaryColorRgba }}
          >
            <AlertTriangle
              className="h-4 w-4 shrink-0 mt-0.5"
              style={{ color: app.primaryColor }}
            />
            <p>
              Phase pilote — l&apos;app est distribuée hors Play Store. Android peut afficher un
              avertissement, c&apos;est normal pendant la beta.
            </p>
          </div>
        </section>

        <footer className="mt-10 text-center text-[11px] text-black/40">
          © NYAMA · Cuisine camerounaise · Yaoundé / Douala
        </footer>
      </main>
    </div>
  );
}
