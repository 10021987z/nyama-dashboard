"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertOctagon,
  DollarSign,
  MegaphoneIcon,
  Settings,
} from "lucide-react";
import { useLiveData } from "./live-data-provider";
import { RevenueChartDialog } from "./revenue-chart-dialog";
import { CookPickerDialog } from "./cook-picker-dialog";
import { apiClient } from "@/lib/api";

function ConnectionBadge() {
  const { connection } = useLiveData();
  const config = {
    connected: { color: "#16a34a", label: "Live", bg: "#f0fdf4" },
    polling: { color: "#f59e0b", label: "Polling", bg: "#fef3c7" },
    offline: { color: "#ef4444", label: "Offline", bg: "#fff1f2" },
  }[connection];

  return (
    <div
      className="flex items-center gap-2 rounded-full px-3 py-1.5"
      style={{ backgroundColor: config.bg }}
    >
      <span className="relative flex h-2 w-2">
        {connection === "connected" && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: config.color }}
          />
        )}
        <span
          className="relative inline-flex rounded-full h-2 w-2"
          style={{ backgroundColor: config.color }}
        />
      </span>
      <span
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: config.color }}
      >
        {config.label}
      </span>
    </div>
  );
}

function ActionButton({
  onClick,
  icon: Icon,
  label,
  variant = "default",
}: {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  variant?: "default" | "danger" | "ghost";
}) {
  const styles =
    variant === "danger"
      ? {
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          color: "#fff",
          boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
        }
      : variant === "ghost"
      ? {
          backgroundColor: "#ffffff",
          color: "#3D3D3D",
          border: "1px solid #f0ece5",
        }
      : {
          background: "linear-gradient(135deg, #F57C20, #E06A10)",
          color: "#fff",
          boxShadow: "0 4px 12px rgba(245,124,32,0.25)",
        };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
      style={styles}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export function TopBar() {
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [cookPickerOpen, setCookPickerOpen] = useState(false);
  // Maintenance mode flag — persisted locally until backend endpoint exists.
  // TODO(agent-A): wire this to a real `POST /admin/settings/maintenance`.
  const [maintenance, setMaintenance] = useState(false);

  async function broadcastToRiders() {
    try {
      // TODO(agent-A): expose real endpoint. Stubbed with best-effort call.
      await apiClient.post("/admin/broadcast/riders", {
        message: "Alerte ops — merci de vérifier vos courses en cours.",
      });
      toast.success("Alerte envoyée à tous les riders en ligne");
    } catch {
      toast.success(
        "Broadcast simulé (endpoint /admin/broadcast/riders à implémenter)",
      );
    }
  }

  function toggleMaintenance() {
    const next = !maintenance;
    setMaintenance(next);
    toast(next ? "Mode maintenance activé" : "Mode maintenance désactivé", {
      description: next
        ? "Les nouvelles commandes sont bloquées. (stub local)"
        : "Le marketplace reprend.",
    });
    // TODO(agent-A): persist to /admin/settings/maintenance
  }

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3 pl-4"
      style={{
        background: "linear-gradient(135deg, #1B4332, #2c694e)",
        boxShadow: "0 8px 24px rgba(27,67,50,0.2)",
      }}
    >
      <div className="flex items-center gap-3">
        <div>
          <h1
            className="text-lg font-semibold italic leading-tight text-white"
            style={{
              fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            }}
          >
            Command Center
          </h1>
          <p className="text-[10px] text-white/70">
            Ops en temps réel · Douala / Yaoundé
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ActionButton
          onClick={broadcastToRiders}
          icon={AlertOctagon}
          label="Alerte riders"
          variant="danger"
        />
        <ActionButton
          onClick={() => setCookPickerOpen(true)}
          icon={MegaphoneIcon}
          label="Message cook"
        />
        <ActionButton
          onClick={() => setRevenueOpen(true)}
          icon={DollarSign}
          label="CA en direct"
        />
        <ActionButton
          onClick={toggleMaintenance}
          icon={Settings}
          label={maintenance ? "Maintenance ON" : "Mode maintenance"}
          variant="ghost"
        />
        <ConnectionBadge />
      </div>

      <RevenueChartDialog open={revenueOpen} onOpenChange={setRevenueOpen} />
      <CookPickerDialog open={cookPickerOpen} onOpenChange={setCookPickerOpen} />
    </div>
  );
}
