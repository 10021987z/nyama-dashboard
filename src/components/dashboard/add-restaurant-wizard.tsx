"use client";

import { useState, useEffect } from "react";
import { X, Store, ChevronRight, UserPlus } from "lucide-react";
import {
  createUser,
  createRestaurant,
  getQuarters,
  type CreatedRestaurant,
  type CreatedUser,
  type Quarter,
} from "@/lib/admin-mutations";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (r: CreatedRestaurant) => void;
}

export function AddRestaurantWizard({ open, onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 — owner
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("+237");
  const [ownerId, setOwnerId] = useState("");
  const [createdOwner, setCreatedOwner] = useState<CreatedUser | null>(null);

  // Step 2 — restaurant
  const [displayName, setDisplayName] = useState("");
  const [specialty, setSpecialty] = useState(""); // comma-separated
  const [description, setDescription] = useState("");
  const [quarterId, setQuarterId] = useState("");
  const [momoPhone, setMomoPhone] = useState("+237");
  const [momoProvider, setMomoProvider] = useState<"mtn" | "orange">("mtn");
  const [locationLat, setLocationLat] = useState("");
  const [locationLng, setLocationLng] = useState("");
  const [landmark, setLandmark] = useState("");

  // Quarters
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loadingQuarters, setLoadingQuarters] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoadingQuarters(true);
    getQuarters()
      .then((qs) => {
        setQuarters(qs);
        if (qs.length > 0 && !quarterId) setQuarterId(qs[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur chargement quartiers"))
      .finally(() => setLoadingQuarters(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const reset = () => {
    setStep(1);
    setMode("new");
    setOwnerName("");
    setOwnerPhone("+237");
    setOwnerId("");
    setCreatedOwner(null);
    setDisplayName("");
    setSpecialty("");
    setDescription("");
    setQuarterId(quarters[0]?.id ?? "");
    setMomoPhone("+237");
    setMomoProvider("mtn");
    setLocationLat("");
    setLocationLng("");
    setLandmark("");
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleNext = async () => {
    setError(null);
    if (mode === "new") {
      if (!ownerName.trim()) return setError("Nom du cuisinier requis");
      if (!/^\+237\d{9}$/.test(ownerPhone.replace(/\s/g, "")))
        return setError("Téléphone cuisinier invalide (format +237XXXXXXXXX)");
      setSubmitting(true);
      try {
        const u = await createUser({
          name: ownerName.trim(),
          phone: ownerPhone.replace(/\s/g, ""),
          role: "COOK",
        });
        setCreatedOwner(u);
        setOwnerId(u.id);
        setStep(2);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur création cuisinier");
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!ownerId.trim()) return setError("ID utilisateur requis");
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!displayName.trim()) return setError("Nom du restaurant requis");
    if (!quarterId) return setError("Quartier requis");
    const lat = parseFloat(locationLat);
    const lng = parseFloat(locationLng);
    if (Number.isNaN(lat) || lat < -90 || lat > 90)
      return setError("Latitude invalide");
    if (Number.isNaN(lng) || lng < -180 || lng > 180)
      return setError("Longitude invalide");

    const specialtyArr = specialty
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (specialtyArr.length === 0) return setError("Au moins une spécialité requise");

    setSubmitting(true);
    try {
      const r = await createRestaurant({
        userId: ownerId,
        displayName: displayName.trim(),
        specialty: specialtyArr,
        description: description.trim() || undefined,
        quarterId,
        momoPhone: momoPhone.replace(/\s/g, "") || undefined,
        momoProvider,
        locationLat: lat,
        locationLng: lng,
        landmark: landmark.trim() || undefined,
      });
      onCreated(r);
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur création restaurant");
      setSubmitting(false);
    }
  };

  const inputStyle = { backgroundColor: "#f5f3ef", color: "#3D3D3D" } as const;
  const labelCls =
    "block text-[10px] font-bold uppercase tracking-wider mb-1.5";

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(27,28,26,0.45)" }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 max-h-[92vh] overflow-y-auto"
        style={{ backgroundColor: "#fff", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#f5f3ef]"
        >
          <X className="h-4 w-4" style={{ color: "#6B7280" }} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "linear-gradient(135deg, #1B4332, #14532d)" }}
          >
            <Store className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2
              className="text-lg font-semibold italic"
              style={{
                fontFamily: "var(--font-montserrat), system-ui, sans-serif",
                color: "#3D3D3D",
              }}
            >
              Nouveau restaurant
            </h2>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Étape {step}/2 · {step === 1 ? "Cuisinier propriétaire" : "Informations restaurant"}
            </p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-5">
          {[1, 2].map((s) => (
            <div
              key={s}
              className="flex-1 h-1 rounded-full"
              style={{ backgroundColor: step >= s ? "#F57C20" : "#f5f3ef" }}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setMode("new")}
                className="flex-1 rounded-xl py-2.5 text-xs font-semibold"
                style={
                  mode === "new"
                    ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }
                    : { backgroundColor: "#f5f3ef", color: "#6B7280" }
                }
              >
                Nouveau cuisinier
              </button>
              <button
                onClick={() => setMode("existing")}
                className="flex-1 rounded-xl py-2.5 text-xs font-semibold"
                style={
                  mode === "existing"
                    ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }
                    : { backgroundColor: "#f5f3ef", color: "#6B7280" }
                }
              >
                Cuisinier existant
              </button>
            </div>

            {mode === "new" ? (
              <>
                <div>
                  <label className={labelCls} style={{ color: "#6B7280" }}>
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ex : Mama Africa"
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelCls} style={{ color: "#6B7280" }}>
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
                <p
                  className="text-[10px] flex items-center gap-1.5"
                  style={{ color: "#6B7280" }}
                >
                  <UserPlus className="h-3 w-3" />
                  Un compte COOK sera créé automatiquement
                </p>
              </>
            ) : (
              <div>
                <label className={labelCls} style={{ color: "#6B7280" }}>
                  ID utilisateur COOK existant
                </label>
                <input
                  type="text"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  placeholder="uuid de l'utilisateur"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {createdOwner && (
              <div
                className="rounded-xl px-3 py-2 text-xs"
                style={{ backgroundColor: "#dcfce7", color: "#166534" }}
              >
                ✓ Cuisinier créé : <strong>{createdOwner.name}</strong>
              </div>
            )}
            <div>
              <label className={labelCls} style={{ color: "#6B7280" }}>
                Nom du restaurant
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex : Chez Mama Africa"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#6B7280" }}>
                Spécialités (séparées par virgules)
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Ndolè, Poulet DG, Eru"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#6B7280" }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Courte description (facultatif)"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#6B7280" }}>
                Quartier
              </label>
              <select
                value={quarterId}
                onChange={(e) => setQuarterId(e.target.value)}
                disabled={loadingQuarters || quarters.length === 0}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer disabled:opacity-60"
                style={inputStyle}
              >
                {loadingQuarters && <option>Chargement...</option>}
                {!loadingQuarters && quarters.length === 0 && (
                  <option value="">Aucun quartier disponible</option>
                )}
                {quarters.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.city} — {q.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "#6B7280" }}>
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={locationLat}
                  onChange={(e) => setLocationLat(e.target.value)}
                  placeholder="4.0511"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelCls} style={{ color: "#6B7280" }}>
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={locationLng}
                  onChange={(e) => setLocationLng(e.target.value)}
                  placeholder="9.7679"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label className={labelCls} style={{ color: "#6B7280" }}>
                Point de repère
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Ex : en face du marché central"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "#6B7280" }}>
                  Téléphone MoMo
                </label>
                <input
                  type="tel"
                  value={momoPhone}
                  onChange={(e) => setMomoPhone(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelCls} style={{ color: "#6B7280" }}>
                  Opérateur
                </label>
                <select
                  value={momoProvider}
                  onChange={(e) => setMomoProvider(e.target.value as "mtn" | "orange")}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer"
                  style={inputStyle}
                >
                  <option value="mtn">MTN MoMo</option>
                  <option value="orange">Orange Money</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 text-xs font-semibold" style={{ color: "#991b1b" }}>
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
            >
              Retour
            </button>
          )}
          <button
            onClick={step === 1 ? handleNext : handleSubmit}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
          >
            {submitting ? "..." : step === 1 ? "Continuer" : "Créer le restaurant"}
            {!submitting && step === 1 && <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
