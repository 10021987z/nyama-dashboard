"use client";

import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import type { FeedEvent } from "@/lib/command-center-mock";
import { formatFcfa, formatDateTime } from "@/lib/utils";

interface EventDrawerProps {
  event: FeedEvent | null;
  onClose: () => void;
}

export function EventDrawer({ event, onClose }: EventDrawerProps) {
  async function handleAction(key: string) {
    if (!event?.orderId) {
      toast.info("Pas d'ordre lié à cet événement");
      return;
    }
    try {
      await apiClient.post(`/admin/orders/${event.orderId}/intervene`, {
        action: key,
      });
      toast.success(`Action ${key} envoyée`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'action");
    }
  }

  return (
    <Sheet
      open={event !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent className="p-0 w-full sm:max-w-md">
        <SheetHeader className="p-5 border-b" style={{ borderColor: "#f0ece5" }}>
          <SheetTitle className="flex items-center gap-2">
            <span className="text-2xl">{event?.icon}</span>
            <span>Détail de l&apos;événement</span>
          </SheetTitle>
          <SheetDescription>
            {event ? formatDateTime(event.timestamp) : ""}
          </SheetDescription>
        </SheetHeader>

        {event && (
          <div className="p-5 space-y-4">
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "#fbf9f5" }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ color: "#6B7280" }}
              >
                Acteur
              </p>
              <p className="text-base font-semibold" style={{ color: "#3D3D3D" }}>
                {event.actor}
              </p>
              <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
                {event.action}
              </p>
              {event.amountXaf != null && (
                <p
                  className="mt-3 text-xl font-bold"
                  style={{
                    color: "#F57C20",
                    fontFamily: "var(--font-space-mono), monospace",
                  }}
                >
                  {formatFcfa(event.amountXaf)}
                </p>
              )}
            </div>

            {event.orderId && (
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-wider mb-2"
                  style={{ color: "#6B7280" }}
                >
                  Référence
                </p>
                <p
                  className="text-sm font-mono px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "#fbf9f5", color: "#3D3D3D" }}
                >
                  {event.orderId}
                </p>
              </div>
            )}

            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{ color: "#6B7280" }}
              >
                Actions rapides
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="default"
                  onClick={() => handleAction("notify_client")}
                  disabled={!event.orderId}
                >
                  Notifier le client
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction("escalate_support")}
                  disabled={!event.orderId}
                >
                  Escalader au support
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleAction("refund")}
                  disabled={!event.orderId}
                >
                  Rembourser
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
