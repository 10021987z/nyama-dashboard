"use client";

import { useState, useEffect } from "react";
import type { FleetRider } from "@/lib/types";
import { X, ShieldCheck, Bike, MapPin, Phone, Check } from "lucide-react";
import { patchFleetRider } from "@/lib/admin-mutations";

interface Props {
  rider: FleetRider | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function VerifyRiderDialog({ rider, onClose, onApprove, onReject }: Props) {
  const [cni, setCni] = useState(true);
  const [permit, setPermit] = useState(true);
  const [vehicle, setVehicle] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (rider) {
      setCni(true); setPermit(true); setVehicle(true); setSubmitting(false);
    }
  }, [rider]);

  if (!rider) return null;

  const allOk = cni && permit && vehicle;

  const handleApprove = async () => {
    setSubmitting(true);
    await patchFleetRider(rider.id, { isVerified: true });
    onApprove(rider.id);
    setSubmitting(false);
    onClose();
  };

  const handleReject = async () => {
    setSubmitting(true);
    await patchFleetRider(rider.id, { status: "SUSPENDED" });
    onReject(rider.id);
    setSubmitting(false);
    onClose();
  };

  const Check2 = ({ value, label, onToggle }: { value: boolean; label: string; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
      style={{ backgroundColor: value ? "#dcfce7" : "#f5f3ef" }}
    >
      <div
        className="flex h-6 w-6 items-center justify-center rounded-md"
        style={{ backgroundColor: value ? "#16a34a" : "#e5e7eb" }}
      >
        {value && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </div>
      <span className="text-sm font-semibold" style={{ color: value ? "#166534" : "#6B7280" }}>
        {label}
      </span>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(27,28,26,0.45)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{ backgroundColor: "#fff", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#f5f3ef]"
        >
          <X className="h-4 w-4" style={{ color: "#6B7280" }} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "linear-gradient(135deg, #166534, #14532d)" }}
          >
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2
              className="text-lg font-semibold italic"
              style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
            >
              Vérification livreur
            </h2>
            <p className="text-xs" style={{ color: "#6B7280" }}>Validation des documents et conformité</p>
          </div>
        </div>

        {/* Rider info */}
        <div className="rounded-xl p-4 mb-4 space-y-2" style={{ backgroundColor: "#fbf9f5" }}>
          <p className="text-base font-bold" style={{ color: "#3D3D3D" }}>{rider.name}</p>
          <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
            <Phone className="h-3 w-3" /> {rider.phone}
          </div>
          {(rider.vehicleType || rider.plateNumber) && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
              <Bike className="h-3 w-3" /> {[rider.vehicleType, rider.plateNumber].filter(Boolean).join(" · ")}
            </div>
          )}
          {(rider.city || rider.neighborhood) && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
              <MapPin className="h-3 w-3" /> {rider.neighborhood ? `${rider.neighborhood}, ${rider.city}` : rider.city}
            </div>
          )}
        </div>

        {/* Checklist */}
        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>
          Checklist de validation
        </p>
        <div className="space-y-2 mb-5">
          <Check2 value={cni} label="CNI vérifiée" onToggle={() => setCni((v) => !v)} />
          <Check2 value={permit} label="Permis de conduire vérifié" onToggle={() => setPermit((v) => !v)} />
          <Check2 value={vehicle} label="Véhicule conforme & assuré" onToggle={() => setVehicle((v) => !v)} />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReject}
            disabled={submitting}
            className="flex-1 rounded-full py-2.5 text-sm font-semibold disabled:opacity-60"
            style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
          >
            Rejeter
          </button>
          <button
            onClick={handleApprove}
            disabled={submitting || !allOk}
            className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #166534, #14532d)" }}
          >
            {submitting ? "..." : "Approuver le livreur"}
          </button>
        </div>
      </div>
    </div>
  );
}
