"use client";

import { useState } from "react";
import { X, Store, ChevronRight, UserPlus } from "lucide-react";
import { createUser, createRestaurant, type CreatedRestaurant, type CreatedUser } from "@/lib/admin-mutations";

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
  const [name, setName] = useState("");
  const [city, setCity] = useState<"Douala" | "Yaoundé">("Douala");
  const [neighborhood, setNeighborhood] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [hours, setHours] = useState("10h - 22h");
  const [phone, setPhone] = useState("+237");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setStep(1);
    setMode("new");
    setOwnerName("");
    setOwnerPhone("+237");
    setOwnerId("");
    setCreatedOwner(null);
    setName("");
    setNeighborhood("");
    setSpecialty("");
    setHours("10h - 22h");
    setPhone("+237");
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleNext = async () => {
    setError(null);
    if (mode === "new") {
      if (!ownerName.trim()) return setError("Nom du cuisinier requis");
      if (!/^\+237\d{9}$/.test(ownerPhone.replace(/\s/g, ""))) return setError("Téléphone cuisinier invalide");
      setSubmitting(true);
      try {
        const u = await createUser({ name: ownerName.trim(), phone: ownerPhone.replace(/\s/g, ""), role: "COOK" });
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
    if (!name.trim()) return setError("Nom du restaurant requis");
    if (!neighborhood.trim()) return setError("Quartier requis");
    setSubmitting(true);
    try {
      const r = await createRestaurant({
        ownerId,
        name: name.trim(),
        phone: phone.replace(/\s/g, ""),
        city,
        neighborhood: neighborhood.trim(),
        specialty: specialty.trim(),
        hours,
      });
      onCreated(r);
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur création restaurant");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(27,28,26,0.45)" }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl p-6"
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
              style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
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
                style={mode === "new" ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" } : { backgroundColor: "#f5f3ef", color: "#6B7280" }}
              >
                Nouveau cuisinier
              </button>
              <button
                onClick={() => setMode("existing")}
                className="flex-1 rounded-xl py-2.5 text-xs font-semibold"
                style={mode === "existing" ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" } : { backgroundColor: "#f5f3ef", color: "#6B7280" }}
              >
                Cuisinier existant
              </button>
            </div>

            {mode === "new" ? (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Nom complet</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ex : Mama Africa"
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Téléphone</label>
                  <input
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
                  />
                </div>
                <p className="text-[10px] flex items-center gap-1.5" style={{ color: "#6B7280" }}>
                  <UserPlus className="h-3 w-3" />
                  Un compte COOK sera créé automatiquement
                </p>
              </>
            ) : (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>ID utilisateur COOK existant</label>
                <input
                  type="text"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  placeholder="usr_xxxxxxxx"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
                />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {createdOwner && (
              <div className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                ✓ Cuisinier créé : <strong>{createdOwner.name}</strong>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Nom du restaurant</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex : Chez Mama Africa"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Ville</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value as "Douala" | "Yaoundé")}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer"
                  style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
                >
                  <option>Douala</option>
                  <option>Yaoundé</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Quartier</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex : Bonapriso"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Spécialités (séparées par virgules)</label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Ndolè, Poulet DG, Eru"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Horaires</label>
                <input
                  type="text"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Téléphone MoMo</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
                />
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-xs font-semibold" style={{ color: "#991b1b" }}>{error}</p>}

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
