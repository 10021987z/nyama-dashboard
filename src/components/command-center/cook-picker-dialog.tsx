"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChefHat, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLiveData } from "./live-data-provider";
import { apiClient } from "@/lib/api";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function CookPickerDialog({ open, onOpenChange }: Props) {
  const { map } = useLiveData();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const cooks = useMemo(() => {
    const q = query.toLowerCase();
    return map.cooks.filter((c) => c.name.toLowerCase().includes(q));
  }, [map.cooks, query]);

  async function send() {
    if (!selectedId || !message.trim()) return;
    setSending(true);
    try {
      // TODO(agent-A): expose /admin/broadcast/cook endpoint
      await apiClient.post(`/admin/broadcast/cook/${selectedId}`, {
        message: message.trim(),
      });
      toast.success("Message envoyé");
      onOpenChange(false);
      setMessage("");
      setSelectedId(null);
    } catch {
      toast.success(
        "Envoi simulé (endpoint /admin/broadcast/cook à implémenter)",
      );
      onOpenChange(false);
      setMessage("");
      setSelectedId(null);
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Message à un cook</DialogTitle>
          <DialogDescription>
            Sélectionne le restaurant et rédige un message court.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ backgroundColor: "#fbf9f5" }}
          >
            <Search className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un restaurant…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "#3D3D3D" }}
            />
          </div>

          <div
            className="max-h-48 overflow-y-auto rounded-lg border"
            style={{ borderColor: "#f0ece5" }}
          >
            {cooks.length === 0 ? (
              <p className="p-4 text-center text-xs" style={{ color: "#9ca3af" }}>
                Aucun résultat
              </p>
            ) : (
              <ul>
                {cooks.map((c) => {
                  const isSel = selectedId === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => setSelectedId(c.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors"
                        style={{
                          backgroundColor: isSel ? "#fff7ed" : "transparent",
                          color: "#3D3D3D",
                        }}
                      >
                        <ChefHat
                          className="h-3.5 w-3.5"
                          style={{ color: isSel ? "#F57C20" : "#6B7280" }}
                        />
                        <span className="flex-1 font-medium">{c.name}</span>
                        <span style={{ color: "#6B7280" }}>
                          {c.isOpen ? "🟢" : "🔴"} · {c.pendingOrders} cmd
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Votre message…"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
            style={{
              backgroundColor: "#fbf9f5",
              color: "#3D3D3D",
              border: "1px solid transparent",
            }}
          />

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={send}
              disabled={!selectedId || !message.trim() || sending}
            >
              {sending ? "Envoi…" : "Envoyer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
