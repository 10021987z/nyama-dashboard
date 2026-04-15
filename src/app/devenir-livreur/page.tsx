"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";

const COLORS = {
  orange: "#F57C20",
  green: "#1B4332",
  gold: "#D4A017",
  creme: "#F5F5F0",
  charcoal: "#3D3D3D",
  red: "#E8413C",
};

type Vehicle = "moto" | "velo" | "voiture";
type PhotoKey = "selfiePhoto" | "cniPhoto" | "permisPhoto" | "vehiclePhoto";

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  city: string;
  quarter: string;
  emergencyContact: string;
  emergencyPhone: string;
  vehicleType: Vehicle;
  vehicleBrand: string;
  vehicleColor: string;
  plateNumber: string;
  orangeMoney: string;
  mtnMomo: string;
  selfiePhoto: string;
  cniPhoto: string;
  permisPhoto: string;
  vehiclePhoto: string;
}

const INITIAL: FormState = {
  fullName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  city: "Douala",
  quarter: "",
  emergencyContact: "",
  emergencyPhone: "",
  vehicleType: "moto",
  vehicleBrand: "",
  vehicleColor: "",
  plateNumber: "",
  orangeMoney: "",
  mtnMomo: "",
  selfiePhoto: "",
  cniPhoto: "",
  permisPhoto: "",
  vehiclePhoto: "",
};

const PHOTO_TILES: Array<{
  key: PhotoKey;
  label: string;
  guide: "oval" | "rect";
  required: boolean;
  facing: "user" | "environment";
}> = [
  { key: "selfiePhoto", label: "Selfie", guide: "oval", required: true, facing: "user" },
  { key: "cniPhoto", label: "CNI (recto)", guide: "rect", required: true, facing: "environment" },
  { key: "permisPhoto", label: "Permis", guide: "rect", required: true, facing: "environment" },
  { key: "vehiclePhoto", label: "Véhicule", guide: "rect", required: false, facing: "environment" },
];

export default function DevenirLivreurPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [cguAccepted, setCguAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    id: string;
    status: string;
    kycScore: number;
  } | null>(null);

  const [cameraKey, setCameraKey] = useState<PhotoKey | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canContinueStep1 =
    form.fullName.trim().length > 2 &&
    form.phone.trim().length >= 9 &&
    form.dateOfBirth &&
    form.city &&
    form.quarter.trim().length > 0;

  const canContinueStep2 = !!form.vehicleType;

  const canContinueStep3 =
    !!form.selfiePhoto && !!form.cniPhoto && !!form.permisPhoto;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/onboarding/rider/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || `Erreur HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        success: boolean;
        application: { id: string; status: string; kycScore: number };
      };
      setSuccess({
        id: data.application.id,
        status: data.application.status,
        kycScore: data.application.kycScore,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return <SuccessScreen result={success} />;
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundColor: COLORS.creme,
        fontFamily: "var(--font-nunito-sans), system-ui, sans-serif",
      }}
    >
      <header
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: "#fff", borderColor: "#e5e5e0" }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <p
              className="text-lg font-bold leading-tight"
              style={{
                fontFamily: "var(--font-montserrat), system-ui, sans-serif",
                color: COLORS.orange,
              }}
            >
              NYAMA
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em]" style={{ color: COLORS.charcoal }}>
              Devenir livreur
            </p>
          </div>
          <Stepper step={step} total={4} />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-32">
        {step === 1 && <Step1Identity form={form} update={update} />}
        {step === 2 && <Step2Vehicle form={form} update={update} />}
        {step === 3 && (
          <Step3Photos form={form} openCamera={(k) => setCameraKey(k)} update={update} />
        )}
        {step === 4 && (
          <Step4Review
            form={form}
            cguAccepted={cguAccepted}
            onCgu={setCguAccepted}
          />
        )}

        {error && (
          <div
            className="mt-4 rounded-xl border px-4 py-3 text-sm"
            style={{
              backgroundColor: "#FEECEC",
              borderColor: COLORS.red,
              color: COLORS.red,
            }}
          >
            {error}
          </div>
        )}
      </main>

      <footer
        className="fixed bottom-0 left-0 right-0 z-10 border-t"
        style={{ backgroundColor: "#fff", borderColor: "#e5e5e0" }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
            style={{ color: COLORS.charcoal }}
          >
            <ChevronLeft className="h-4 w-4" /> Retour
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={
                (step === 1 && !canContinueStep1) ||
                (step === 2 && !canContinueStep2) ||
                (step === 3 && !canContinueStep3)
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-[14px] px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: COLORS.green }}
            >
              Continuer <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!cguAccepted || submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-[14px] px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: COLORS.green }}
            >
              {submitting ? "Envoi en cours..." : "Soumettre ma candidature"}
            </button>
          )}
        </div>
      </footer>

      {cameraKey && (
        <CameraCapture
          tile={PHOTO_TILES.find((t) => t.key === cameraKey)!}
          onClose={() => setCameraKey(null)}
          onCapture={(dataUrl) => {
            update(cameraKey, dataUrl);
            setCameraKey(null);
          }}
        />
      )}
    </div>
  );
}

// ── Stepper ────────────────────────────────────────────────────────
function Stepper({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const idx = i + 1;
        const active = idx <= step;
        return (
          <div
            key={i}
            className="h-1.5 w-8 rounded-full transition-colors"
            style={{
              backgroundColor: active ? COLORS.orange : "#e5e5e0",
            }}
          />
        );
      })}
    </div>
  );
}

// ── Step 1 : Identité ──────────────────────────────────────────────
function Step1Identity({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <section>
      <h1
        className="text-2xl font-bold"
        style={{
          fontFamily: "var(--font-montserrat), system-ui, sans-serif",
          color: COLORS.green,
        }}
      >
        Parlons de toi
      </h1>
      <p className="mt-1 text-sm" style={{ color: COLORS.charcoal }}>
        Tes informations personnelles pour créer ton compte livreur.
      </p>

      <div className="mt-6 space-y-4">
        <Field label="Nom complet *">
          <Input
            value={form.fullName}
            onChange={(v) => update("fullName", v)}
            placeholder="Jean Mbarga"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Téléphone *">
            <Input
              value={form.phone}
              onChange={(v) => update("phone", v)}
              placeholder="+237 6 XX XX XX XX"
              inputMode="tel"
            />
          </Field>
          <Field label="Date de naissance *">
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(v) => update("dateOfBirth", v)}
            />
          </Field>
        </div>

        <Field label="Email (optionnel)">
          <Input
            value={form.email}
            onChange={(v) => update("email", v)}
            placeholder="jean@exemple.com"
            type="email"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Ville *">
            <select
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-[#F57C20]"
              style={{ borderColor: "#e5e5e0", backgroundColor: "#fff" }}
            >
              <option value="Douala">Douala</option>
              <option value="Yaoundé">Yaoundé</option>
            </select>
          </Field>
          <Field label="Quartier *">
            <Input
              value={form.quarter}
              onChange={(v) => update("quarter", v)}
              placeholder="Akwa, Bonapriso..."
            />
          </Field>
        </div>

        <div
          className="mt-2 rounded-2xl border p-4"
          style={{ backgroundColor: "#fff", borderColor: "#e5e5e0" }}
        >
          <p
            className="mb-3 text-xs font-bold uppercase tracking-wider"
            style={{ color: COLORS.gold }}
          >
            Contact d'urgence
          </p>
          <div className="space-y-3">
            <Field label="Nom">
              <Input
                value={form.emergencyContact}
                onChange={(v) => update("emergencyContact", v)}
                placeholder="Proche à contacter"
              />
            </Field>
            <Field label="Téléphone">
              <Input
                value={form.emergencyPhone}
                onChange={(v) => update("emergencyPhone", v)}
                placeholder="+237 ..."
                inputMode="tel"
              />
            </Field>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Step 2 : Véhicule & Paiement ───────────────────────────────────
function Step2Vehicle({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const vehicles: Array<{ key: Vehicle; label: string; emoji: string }> = [
    { key: "moto", label: "Moto", emoji: "🏍️" },
    { key: "velo", label: "Vélo", emoji: "🚲" },
    { key: "voiture", label: "Voiture", emoji: "🚗" },
  ];

  return (
    <section>
      <h1
        className="text-2xl font-bold"
        style={{
          fontFamily: "var(--font-montserrat), system-ui, sans-serif",
          color: COLORS.green,
        }}
      >
        Ton véhicule
      </h1>
      <p className="mt-1 text-sm" style={{ color: COLORS.charcoal }}>
        Comment vas-tu livrer ?
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {vehicles.map((v) => {
          const active = form.vehicleType === v.key;
          return (
            <button
              key={v.key}
              onClick={() => update("vehicleType", v.key)}
              className="flex flex-col items-center gap-2 rounded-2xl border py-5 transition-all"
              style={{
                backgroundColor: active ? COLORS.orange : "#fff",
                borderColor: active ? COLORS.orange : "#e5e5e0",
                color: active ? "#fff" : COLORS.charcoal,
              }}
            >
              <span className="text-3xl">{v.emoji}</span>
              <span className="text-sm font-semibold">{v.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        <Field label="Marque">
          <Input
            value={form.vehicleBrand}
            onChange={(v) => update("vehicleBrand", v)}
            placeholder="Honda, Yamaha..."
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Couleur">
            <Input
              value={form.vehicleColor}
              onChange={(v) => update("vehicleColor", v)}
              placeholder="Rouge, noir..."
            />
          </Field>
          <Field label="Plaque">
            <Input
              value={form.plateNumber}
              onChange={(v) => update("plateNumber", v)}
              placeholder="LT 1234"
            />
          </Field>
        </div>

        <div
          className="mt-2 rounded-2xl border p-4"
          style={{ backgroundColor: "#fff", borderColor: "#e5e5e0" }}
        >
          <p
            className="mb-3 text-xs font-bold uppercase tracking-wider"
            style={{ color: COLORS.gold }}
          >
            Paiement mobile (optionnel)
          </p>
          <div className="space-y-3">
            <Field label="Orange Money">
              <Input
                value={form.orangeMoney}
                onChange={(v) => update("orangeMoney", v)}
                placeholder="+237 69 ..."
                inputMode="tel"
              />
            </Field>
            <Field label="MTN MoMo">
              <Input
                value={form.mtnMomo}
                onChange={(v) => update("mtnMomo", v)}
                placeholder="+237 67 ..."
                inputMode="tel"
              />
            </Field>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Step 3 : Photos KYC ────────────────────────────────────────────
function Step3Photos({
  form,
  openCamera,
  update,
}: {
  form: FormState;
  openCamera: (k: PhotoKey) => void;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <section>
      <h1
        className="text-2xl font-bold"
        style={{
          fontFamily: "var(--font-montserrat), system-ui, sans-serif",
          color: COLORS.green,
        }}
      >
        Photos KYC
      </h1>
      <p className="mt-1 text-sm" style={{ color: COLORS.charcoal }}>
        Touche une tuile pour ouvrir la caméra.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {PHOTO_TILES.map((tile) => {
          const value = form[tile.key];
          return (
            <div
              key={tile.key}
              className="relative overflow-hidden rounded-2xl border"
              style={{
                aspectRatio: "1",
                backgroundColor: "#fff",
                borderColor: value ? COLORS.green : "#e5e5e0",
              }}
            >
              {value ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={value} alt={tile.label} className="h-full w-full object-cover" />
                  <button
                    onClick={() => update(tile.key, "")}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                    aria-label="Supprimer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => openCamera(tile.key)}
                    className="absolute bottom-2 left-2 right-2 rounded-lg bg-white/90 py-1.5 text-xs font-semibold"
                    style={{ color: COLORS.charcoal }}
                  >
                    Reprendre
                  </button>
                </>
              ) : (
                <button
                  onClick={() => openCamera(tile.key)}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 p-3"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: COLORS.creme }}
                  >
                    <Camera className="h-5 w-5" style={{ color: COLORS.orange }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: COLORS.charcoal }}>
                    {tile.label}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: tile.required ? COLORS.red : "#9a9a93" }}>
                    {tile.required ? "Obligatoire" : "Optionnel"}
                  </p>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="mt-5 flex items-start gap-2 rounded-xl px-3 py-2 text-xs"
        style={{ backgroundColor: "#fff", color: COLORS.charcoal }}
      >
        <ShieldCheck className="mt-0.5 h-4 w-4" style={{ color: COLORS.green }} />
        <span>
          Tes photos sont chiffrées et servent uniquement à vérifier ton identité.
        </span>
      </div>
    </section>
  );
}

// ── Step 4 : Récapitulatif ─────────────────────────────────────────
function Step4Review({
  form,
  cguAccepted,
  onCgu,
}: {
  form: FormState;
  cguAccepted: boolean;
  onCgu: (v: boolean) => void;
}) {
  const thumbs: Array<{ key: PhotoKey; label: string }> = [
    { key: "selfiePhoto", label: "Selfie" },
    { key: "cniPhoto", label: "CNI" },
    { key: "permisPhoto", label: "Permis" },
    { key: "vehiclePhoto", label: "Véhicule" },
  ];

  return (
    <section>
      <h1
        className="text-2xl font-bold"
        style={{
          fontFamily: "var(--font-montserrat), system-ui, sans-serif",
          color: COLORS.green,
        }}
      >
        Récapitulatif
      </h1>
      <p className="mt-1 text-sm" style={{ color: COLORS.charcoal }}>
        Vérifie les informations avant d'envoyer.
      </p>

      <div
        className="mt-5 space-y-3 rounded-2xl border p-4"
        style={{ backgroundColor: "#fff", borderColor: "#e5e5e0" }}
      >
        <ReviewRow label="Nom" value={form.fullName} />
        <ReviewRow label="Téléphone" value={form.phone} />
        {form.email && <ReviewRow label="Email" value={form.email} />}
        <ReviewRow label="Date de naissance" value={form.dateOfBirth} />
        <ReviewRow label="Ville" value={`${form.city} — ${form.quarter}`} />
        <ReviewRow label="Véhicule" value={`${form.vehicleType}${form.vehicleBrand ? ` · ${form.vehicleBrand}` : ""}${form.plateNumber ? ` · ${form.plateNumber}` : ""}`} />
        {(form.orangeMoney || form.mtnMomo) && (
          <ReviewRow
            label="Paiement"
            value={
              [form.orangeMoney && `Orange ${form.orangeMoney}`, form.mtnMomo && `MTN ${form.mtnMomo}`]
                .filter(Boolean)
                .join(" · ")
            }
          />
        )}
        {form.emergencyContact && (
          <ReviewRow
            label="Urgence"
            value={`${form.emergencyContact}${form.emergencyPhone ? ` · ${form.emergencyPhone}` : ""}`}
          />
        )}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {thumbs.map((t) => {
          const src = form[t.key];
          return (
            <div
              key={t.key}
              className="overflow-hidden rounded-xl border"
              style={{
                aspectRatio: "1",
                backgroundColor: COLORS.creme,
                borderColor: "#e5e5e0",
              }}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={t.label} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px]" style={{ color: "#9a9a93" }}>
                  {t.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <label
        className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border p-3"
        style={{ backgroundColor: "#fff", borderColor: cguAccepted ? COLORS.green : "#e5e5e0" }}
      >
        <input
          type="checkbox"
          checked={cguAccepted}
          onChange={(e) => onCgu(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#1B4332]"
        />
        <span className="text-xs" style={{ color: COLORS.charcoal }}>
          J'accepte les <b>conditions générales</b> NYAMA et je certifie que les
          informations fournies sont exactes.
        </span>
      </label>
    </section>
  );
}

// ── Camera Capture ─────────────────────────────────────────────────
function CameraCapture({
  tile,
  onClose,
  onCapture,
}: {
  tile: { key: PhotoKey; label: string; guide: "oval" | "rect"; facing: "user" | "environment" };
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(tile.facing);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      setReady(false);
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
          setReady(true);
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Impossible d'accéder à la caméra. Autorise l'accès dans ton navigateur.",
        );
      }
    };

    start();

    return () => {
      cancelled = true;
      const s = streamRef.current;
      if (s) {
        s.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode]);

  const capture = () => {
    if (countdown !== null) return;
    let n = 3;
    setCountdown(n);
    const interval = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(interval);
        setCountdown(null);
        snap();
      } else {
        setCountdown(n);
      }
    }, 800);
  };

  const snap = () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facingMode === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-white">
        <button onClick={onClose} className="rounded-full bg-white/10 p-2" aria-label="Fermer">
          <X className="h-5 w-5" />
        </button>
        <div className="text-sm font-semibold">{tile.label}</div>
        <button
          onClick={() => setFacingMode((f) => (f === "user" ? "environment" : "user"))}
          className="rounded-full bg-white/10 p-2"
          aria-label="Changer caméra"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-white/80">
            {error}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              style={facingMode === "user" ? { transform: "scaleX(-1)" } : undefined}
              playsInline
              muted
            />
            <GuideOverlay guide={tile.guide} />
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full text-5xl font-bold text-white"
                  style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                >
                  {countdown}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-center px-4 py-6">
        <button
          onClick={capture}
          disabled={!ready || countdown !== null || !!error}
          className="flex h-16 w-16 items-center justify-center rounded-full border-4 disabled:opacity-40"
          style={{ borderColor: COLORS.orange, backgroundColor: "#fff" }}
          aria-label="Capturer"
        >
          <div className="h-12 w-12 rounded-full" style={{ backgroundColor: COLORS.orange }} />
        </button>
      </div>
    </div>
  );
}

function GuideOverlay({ guide }: { guide: "oval" | "rect" }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div
        className="border-2 border-white/80"
        style={{
          width: guide === "oval" ? "60%" : "85%",
          aspectRatio: guide === "oval" ? "3 / 4" : "16 / 10",
          borderRadius: guide === "oval" ? "50%" : "18px",
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
        }}
      />
    </div>
  );
}

// ── Success screen ─────────────────────────────────────────────────
function SuccessScreen({
  result,
}: {
  result: { id: string; status: string; kycScore: number };
}) {
  const statusLabel =
    result.status === "pre_approved"
      ? "Pré-approuvé ✨"
      : result.status === "approved"
      ? "Approuvé"
      : result.status === "rejected"
      ? "Incomplet"
      : "En attente de validation";

  const statusColor =
    result.status === "pre_approved" || result.status === "approved"
      ? COLORS.green
      : result.status === "rejected"
      ? COLORS.red
      : COLORS.gold;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-10"
      style={{
        backgroundColor: COLORS.creme,
        fontFamily: "var(--font-nunito-sans), system-ui, sans-serif",
      }}
    >
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: COLORS.green }}
      >
        <CheckCircle2 className="h-10 w-10 text-white" />
      </div>
      <h1
        className="mt-6 text-3xl font-bold"
        style={{
          fontFamily: "var(--font-montserrat), system-ui, sans-serif",
          color: COLORS.green,
        }}
      >
        Candidature envoyée !
      </h1>
      <p className="mt-2 max-w-sm text-center text-sm" style={{ color: COLORS.charcoal }}>
        Nous avons bien reçu ta demande. Notre équipe revient vers toi sous 48h.
      </p>

      <div
        className="mt-6 w-full max-w-sm rounded-2xl border p-5"
        style={{ backgroundColor: "#fff", borderColor: "#e5e5e0" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider" style={{ color: "#9a9a93" }}>
              Statut
            </p>
            <p className="mt-1 text-base font-bold" style={{ color: statusColor }}>
              {statusLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider" style={{ color: "#9a9a93" }}>
              Score KYC
            </p>
            <p className="mt-1 text-2xl font-black" style={{ color: COLORS.orange }}>
              {result.kycScore}/100
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full"
            style={{
              width: `${Math.min(100, result.kycScore)}%`,
              backgroundColor: COLORS.orange,
            }}
          />
        </div>
        <p className="mt-4 text-[11px]" style={{ color: "#9a9a93" }}>
          Référence : <span className="font-mono">{result.id.slice(0, 12)}</span>
        </p>
      </div>

      <div
        className="mt-6 flex items-center gap-2 text-xs"
        style={{ color: COLORS.charcoal }}
      >
        <User className="h-3.5 w-3.5" />
        <span>Garde cet identifiant pour suivre ta candidature.</span>
      </div>
    </div>
  );
}

// ── Small building blocks ──────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.charcoal }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "tel" | "text" | "email" | "numeric";
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-[#F57C20]"
      style={{ borderColor: "#e5e5e0", backgroundColor: "#fff" }}
    />
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-xs uppercase tracking-wider" style={{ color: "#9a9a93" }}>
        {label}
      </span>
      <span className="text-right font-semibold" style={{ color: COLORS.charcoal }}>
        {value || "—"}
      </span>
    </div>
  );
}
