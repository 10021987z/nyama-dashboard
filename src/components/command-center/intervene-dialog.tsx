"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";

interface InterveneDialogProps {
  orderId: string | null;
  onClose: () => void;
}

type Action = {
  key: string;
  label: string;
  description: string;
  variant: "default" | "destructive" | "outline";
};

const ACTIONS: Action[] = [
  {
    key: "reassign_rider",
    label: "Réassigner le rider",
    description: "Libère le rider actuel et propose un nouveau candidat.",
    variant: "default",
  },
  {
    key: "contact_client",
    label: "Contacter le client",
    description: "Envoie une notification au client.",
    variant: "outline",
  },
  {
    key: "contact_cook",
    label: "Contacter le resto",
    description: "Appelle ou notifie la cuisinière.",
    variant: "outline",
  },
  {
    key: "refund",
    label: "Rembourser",
    description: "Déclenche un remboursement intégral + ticket support.",
    variant: "destructive",
  },
  {
    key: "cancel",
    label: "Annuler la commande",
    description: "Marque la commande en CANCELLED. Irréversible.",
    variant: "destructive",
  },
];

export function InterveneDialog({ orderId, onClose }: InterveneDialogProps) {
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function doAction(action: string) {
    if (!orderId) return;
    setSubmitting(action);
    try {
      await apiClient.post(`/admin/orders/${orderId}/intervene`, {
        action,
      });
      toast.success(`Action "${action}" envoyée pour ${orderId}`);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de l'intervention",
      );
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Dialog
      open={orderId !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Intervenir sur {orderId}</DialogTitle>
          <DialogDescription>
            Choisis une action admin. L&apos;événement sera logué côté backend.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              disabled={submitting !== null}
              onClick={() => doAction(a.key)}
              className="flex items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-[#fbf9f5] disabled:opacity-50"
              style={{
                border: "1px solid #f0ece5",
              }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold"
                  style={{
                    color:
                      a.variant === "destructive" ? "#ef4444" : "#3D3D3D",
                  }}
                >
                  {a.label}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>
                  {a.description}
                </p>
              </div>
              {submitting === a.key && (
                <span
                  className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"
                  style={{ borderColor: "#F57C20", borderTopColor: "transparent" }}
                />
              )}
            </button>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
