"use client";

import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { createUser, type CreatedUser, type CreateUserPayload } from "@/lib/admin-mutations";

interface Props {
  open: boolean;
  defaultRole?: CreateUserPayload["role"];
  lockRole?: boolean;
  onClose: () => void;
  onCreated: (user: CreatedUser) => void;
}

const ROLES: { value: CreateUserPayload["role"]; label: string }[] = [
  { value: "CLIENT", label: "Client" },
  { value: "COOK", label: "Cuisinier (COOK)" },
  { value: "RIDER", label: "Livreur (RIDER)" },
  { value: "ADMIN", label: "Admin" },
];

export function CreateUserDialog({ open, defaultRole = "CLIENT", lockRole, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+237");
  const [role, setRole] = useState<CreateUserPayload["role"]>(defaultRole);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setName("");
    setPhone("+237");
    setRole(defaultRole);
    setError(null);
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return setError("Le nom est requis");
    if (!/^\+237\d{9}$/.test(phone.replace(/\s/g, ""))) return setError("Téléphone invalide (format +237XXXXXXXXX)");
    setSubmitting(true);
    setError(null);
    try {
      const created = await createUser({ name: name.trim(), phone: phone.replace(/\s/g, ""), role });
      onCreated(created);
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setSubmitting(false);
    }
  };

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
            style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
          >
            <UserPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2
              className="text-lg font-semibold italic"
              style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
            >
              Ajouter un utilisateur
            </h2>
            <p className="text-xs" style={{ color: "#6B7280" }}>Création directe depuis l&apos;admin NYAMA</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Aïcha Mballa"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>
              Téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237699123456"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>
              Rôle
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CreateUserPayload["role"])}
              disabled={lockRole}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-xs font-semibold" style={{ color: "#991b1b" }}>{error}</p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
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
            {submitting ? "Création..." : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}
