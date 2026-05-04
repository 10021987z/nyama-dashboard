"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/hooks/use-language";
import { LanguageProvider } from "@/lib/i18n";

const COLORS = {
  orange: "#F57C20",
  orangeLight: "#FF9F55",
  green: "#1B4332",
  charcoal: "#3D3D3D",
  creme: "#F5F5F0",
  muted: "#666666",
};

export default function HomePage() {
  return (
    <LanguageProvider>
      <HomeContent />
    </LanguageProvider>
  );
}

function HomeContent() {
  const { t } = useLanguage();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: "#FFFFFF",
        fontFamily: "var(--font-nunito-sans), system-ui, sans-serif",
      }}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3 md:px-10">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/nyama-logo.svg"
              alt="NYAMA"
              width={44}
              height={44}
              priority
            />
            <span
              className="text-xl font-bold tracking-tight"
              style={{
                color: COLORS.orange,
                fontFamily: "var(--font-montserrat), system-ui, sans-serif",
              }}
            >
              NYAMA
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/devenir-livreur"
              className="hidden sm:inline-flex text-sm font-semibold transition-colors hover:opacity-70"
              style={{ color: COLORS.charcoal }}
            >
              Devenir livreur
            </Link>
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: COLORS.green }}
            >
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: COLORS.creme }}
      >
        <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-10 md:py-24">
          <div className="max-w-2xl">
            <p
              className="mb-4 text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: COLORS.orange }}
            >
              Cuisine camerounaise · Douala & Yaoundé
            </p>
            <h1
              className="text-4xl font-bold leading-tight md:text-6xl"
              style={{
                color: COLORS.charcoal,
                fontFamily: "var(--font-montserrat), system-ui, sans-serif",
              }}
            >
              Le ndolè de mama,
              <br />
              <span style={{ color: COLORS.orange }}>livré chez toi.</span>
            </h1>
            <p
              className="mt-5 text-lg leading-relaxed"
              style={{ color: COLORS.muted }}
            >
              NYAMA connecte les meilleures cuisinières du Cameroun à ta porte.
              Des plats authentiques, préparés avec amour, livrés en moins de
              45 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* ── Spacer / future sections ────────────────────────── */}
      <section className="mx-auto w-full max-w-[1200px] px-5 py-16 md:px-10 md:py-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { emoji: "🍲", title: "100+ plats", desc: "Du poulet DG au eru, en passant par le ndolè." },
            { emoji: "🛵", title: "Livraison 45 min", desc: "Une flotte de livreurs partout dans Douala et Yaoundé." },
            { emoji: "📱", title: "Mobile Money", desc: "Paiement sécurisé via Orange Money ou MTN MoMo." },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6"
              style={{ backgroundColor: COLORS.creme }}
            >
              <div className="text-3xl">{f.emoji}</div>
              <h3
                className="mt-3 text-lg font-bold"
                style={{
                  color: COLORS.charcoal,
                  fontFamily: "var(--font-montserrat), system-ui, sans-serif",
                }}
              >
                {f.title}
              </h3>
              <p className="mt-1 text-sm" style={{ color: COLORS.muted }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Download App (Deliveroo-style) ──────────────────── */}
      <section className="mx-auto w-full max-w-[1200px] px-5 py-20 md:px-10 md:py-[80px]">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          {/* Left column ─ copy + buttons */}
          <div>
            <h2
              className="text-3xl font-bold leading-tight md:text-[36px]"
              style={{
                color: COLORS.charcoal,
                fontFamily: "var(--font-montserrat), system-ui, sans-serif",
              }}
            >
              {t("downloadApp.title")}
            </h2>
            <p
              className="mt-4 text-base md:text-[18px]"
              style={{ color: COLORS.muted }}
            >
              {t("downloadApp.subtitle")}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <StoreButton
                href="#"
                icon={<AppleIcon />}
                small={t("downloadApp.appStoreSmall")}
                large={t("downloadApp.appStoreLarge")}
              />
              <StoreButton
                href="#"
                icon={<GooglePlayIcon />}
                small={t("downloadApp.playStoreSmall")}
                large={t("downloadApp.playStoreLarge")}
              />
            </div>
          </div>

          {/* Right column ─ phone mockup */}
          <div className="flex justify-center md:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer
        className="mt-auto border-t py-8 text-center text-xs uppercase tracking-[0.18em]"
        style={{ color: COLORS.muted }}
      >
        {t("footer")}
      </footer>
    </div>
  );
}

// ── Store button ───────────────────────────────────────────────
function StoreButton({
  href,
  icon,
  small,
  large,
}: {
  href: string;
  icon: React.ReactNode;
  small: string;
  large: string;
}) {
  return (
    <a
      href={href}
      className="flex h-14 w-full items-center gap-3 rounded-[12px] bg-black px-5 text-white transition-transform hover:scale-[1.02] sm:w-auto"
      style={{ minWidth: 200 }}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[10px] font-medium opacity-90">{small}</span>
        <span
          className="text-lg font-semibold"
          style={{
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
          }}
        >
          {large}
        </span>
      </span>
    </a>
  );
}

// ── Apple icon ─────────────────────────────────────────────────
function AppleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="26"
      height="26"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M16.365 1.43c0 1.14-.46 2.23-1.21 3.03-.81.86-2.12 1.52-3.21 1.43-.13-1.1.42-2.27 1.16-3.03.83-.85 2.27-1.49 3.26-1.43zM20.5 17.36c-.55 1.27-.81 1.84-1.52 2.96-.99 1.56-2.39 3.5-4.13 3.52-1.55.02-1.95-1-4.05-1-2.1 0-2.54.98-4.09.99-1.74.02-3.06-1.74-4.05-3.3-2.78-4.36-3.07-9.48-1.36-12.21 1.21-1.94 3.13-3.07 4.93-3.07 1.84 0 3.0 1.01 4.52 1.01 1.48 0 2.38-1.01 4.52-1.01 1.61 0 3.32.88 4.55 2.4-4.0 2.19-3.34 7.92.68 9.71z" />
    </svg>
  );
}

// ── Google Play icon (multi-color triangle) ───────────────────
function GooglePlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width="24"
      height="24"
      aria-hidden="true"
    >
      <path
        d="M325.3 234.3L104.3 14.6c-7.2-7.2-18.4-7.5-26-1L320 256l-220-242c7.6-6.5 18.8-6.2 26 1l220 220 220-220c7.2-7.2 18.4-7.5 26-1L325.3 234.3z"
        fill="#00C2FF"
      />
      <path
        d="M48.9 13.6c-5.3 5.3-8.2 13.4-8.2 22.4v440c0 9 2.9 17.1 8.2 22.4L256 256 48.9 13.6z"
        fill="#00FFA0"
      />
      <path
        d="M413.1 209.4l-87.8-87.8L78.5 502.4c7.6 6.5 18.8 6.2 26-1l308.6-292z"
        fill="#FFCE00"
      />
      <path
        d="M413.1 209.4l-87.8 87.8 87.8 87.8 87.7-87.8c12.5-12.5 12.5-32.8 0-45.3l-87.7-42.5z"
        fill="#FF3D44"
      />
    </svg>
  );
}

// ── Phone mockup ──────────────────────────────────────────────
function PhoneMockup() {
  return (
    <div
      className="relative w-full max-w-[380px] overflow-hidden rounded-[32px] p-10"
      style={{
        background: `linear-gradient(135deg, ${COLORS.orangeLight}, ${COLORS.orange})`,
        boxShadow: "0 30px 60px -20px rgba(245, 124, 32, 0.45)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute -top-10 -right-8 h-40 w-40 rounded-full opacity-25"
        style={{ backgroundColor: "#fff" }}
      />
      <div
        className="absolute -bottom-12 -left-10 h-44 w-44 rounded-full opacity-15"
        style={{ backgroundColor: "#fff" }}
      />

      {/* Phone frame */}
      <div
        className="relative mx-auto flex h-[460px] w-[220px] flex-col rounded-[36px] border-[8px] p-3 shadow-2xl"
        style={{ backgroundColor: "#0F1115", borderColor: "#0F1115" }}
      >
        {/* Notch */}
        <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-black/60" />

        {/* App content */}
        <div
          className="flex flex-1 flex-col overflow-hidden rounded-[24px]"
          style={{ backgroundColor: "#FFFCF7" }}
        >
          {/* In-app top bar */}
          <div className="flex items-center justify-between px-3 py-2.5">
            <Image
              src="/nyama-logo.svg"
              alt="NYAMA"
              width={26}
              height={26}
            />
            <div
              className="rounded-full px-2 py-0.5 text-[8px] font-bold text-white"
              style={{ backgroundColor: COLORS.green }}
            >
              LIVE
            </div>
          </div>

          {/* Featured card */}
          <div
            className="mx-3 mb-2 rounded-xl p-3 text-white"
            style={{
              background: `linear-gradient(135deg, ${COLORS.orange}, #E06A10)`,
            }}
          >
            <p className="text-[9px] font-bold uppercase tracking-wider opacity-90">
              Plat du jour
            </p>
            <p className="mt-0.5 text-sm font-bold leading-tight">
              Ndolè crevettes
            </p>
            <p className="mt-2 text-[10px] font-semibold">3 500 FCFA</p>
          </div>

          {/* List rows */}
          <div className="space-y-1.5 px-3">
            {[
              { name: "Poulet DG", price: "4 200" },
              { name: "Eru complet", price: "2 800" },
              { name: "Poisson braisé", price: "5 500" },
            ].map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between rounded-lg px-2.5 py-2"
                style={{ backgroundColor: "#F5F2EC" }}
              >
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: COLORS.charcoal }}
                >
                  {row.name}
                </span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: COLORS.orange }}
                >
                  {row.price}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-auto px-3 pb-3">
            <div
              className="flex h-9 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: COLORS.green }}
            >
              Commander
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
