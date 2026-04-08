"use client";

import { useState } from "react";
import { X, Bike } from "lucide-react";
import {
  createUser,
  createFleetRider,
  type CreatedFleetRider,
} from "@/lib/admin-mutations";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (r: CreatedFleetRider, name: string) => void;
}

export function AddRiderDialog({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+237");
  const [vehicleType, setVehicleType] = useState<"MOTO" | "VELO" | "VOITURE">("MOTO");
  const [plateNumber, setPlateNumber] = useState("");
  const [momoPhone, setMomoPhone] = useState("");
  const [momoProvider, setMomoProvider] = useState<"mtn" | "orange">("mtn");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setName("");
    setPhone("+237");
    setVehicleType("MOTO");
    setPlateNumber("");
    setMomoPhone("");
    setMomoProvider("mtn");
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) return setError("Le nom est requis");
    if (!/^\+237\d{9}$/.test(phone.replace(/\s/g, "")))
      return setError("Téléphone invalide (format +237XXXXXXXXX)");

    setSubmitting(true);
    try {
      const user = await createUser({
        name: name.trim(),
        phone: phone.replace(/\s/g, ""),
        role: "RIDER",
      });
      const rider = await createFleetRider({
        userId: user.id,
        vehicleType,
        plateNumber: plateNumber.trim() || undefined,
        momoPhone: momoPhone.replace(/\s/g, "") || undefined,
        momoProvider: momoPhone ? momoProvider : undefined,
      });
      onCreated(rider, user.name);
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur création livreur");
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
        className="relative w-full max-w-md rounded-2xl p-6 max-h-[92vh] overflow-y-auto"
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
            style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
          >
            <Bike className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2
              className="text-lg font-semibold italic"
              style={{
                fontFamily: "var(--font-montserrat), system-ui, sans-serif",
                color: "#3D3D3D",
              }}
            >
              Nouveau livreur
            </h2>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Création du compte + profil livreur
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className={labelCls} style={{ color: "#6B7280" }}>
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Jean Tchouante"
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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237699123456"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ color: "#6B7280" }}>
                Véhicule
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as "MOTO" | "VELO" | "VOITURE")}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer"
                style={inputStyle}
              >
                <option value="MOTO">Moto</option>
                <option value="VELO">Vélo</option>
                <option value="VOITURE">Voiture</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: "#6B7280" }}>
                Plaque
              </label>
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="Ex : LT 1234"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={inputStyle}
              />
            </div>
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
                placeholder="+237..."
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

        {error && (
          <p className="mt-3 text-xs font-semibold" style={{ color: "#991b1b" }}>
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 rounded-full py-2.5 text-sm font-semibold"
            style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
          >
            {submitting ? "Création..." : "Créer le livreur"}
          </button>
        </div>
      </div>
    </div>
  );
}
