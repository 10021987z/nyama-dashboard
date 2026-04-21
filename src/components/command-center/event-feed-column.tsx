"use client";

import { useMemo, useState } from "react";
import { Activity, AlertCircle, CreditCard, Package, UserPlus } from "lucide-react";
import { useLiveData } from "./live-data-provider";
import { EventDrawer } from "./event-drawer";
import { formatFcfa } from "@/lib/utils";
import type { FeedEvent } from "@/lib/command-center-mock";

const FILTERS = [
  { key: "all", label: "Toutes", icon: Activity },
  { key: "error", label: "Erreurs", icon: AlertCircle },
  { key: "transaction", label: "Transactions", icon: CreditCard },
  { key: "signup", label: "Inscriptions", icon: UserPlus },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EventFeedColumn() {
  const { feed } = useLiveData();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<FeedEvent | null>(null);

  const visible = useMemo(() => {
    if (filter === "all") return feed;
    return feed.filter((e) => e.category === filter);
  }, [feed, filter]);

  return (
    <div
      className="flex h-full flex-col rounded-2xl"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 24px rgba(160,60,0,0.05)",
        maxHeight: "100%",
      }}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: "#f0ece5" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: "#F57C20" }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: "#F57C20" }}
              />
            </span>
            <h2
              className="text-base font-semibold"
              style={{
                fontFamily: "var(--font-montserrat), system-ui, sans-serif",
                color: "#3D3D3D",
              }}
            >
              Flux temps réel
            </h2>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold"
            style={{ backgroundColor: "#fff7ed", color: "#F57C20" }}
          >
            {feed.length}
          </span>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all"
              style={
                filter === f.key
                  ? {
                      background: "linear-gradient(135deg, #F57C20, #E06A10)",
                      color: "#fff",
                    }
                  : { backgroundColor: "#f5f3ef", color: "#6B7280" }
              }
            >
              <f.icon className="h-3 w-3" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event list */}
      <ul className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "#f7f4ef" }}>
        {visible.length === 0 && (
          <li className="py-12 text-center text-xs" style={{ color: "#9ca3af" }}>
            <Package className="h-5 w-5 mx-auto mb-2 opacity-40" />
            Aucun événement pour ce filtre.
          </li>
        )}
        {visible.map((e) => (
          <li key={e.id}>
            <button
              onClick={() => setSelected(e)}
              className="w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[#fbf9f5]"
            >
              <span
                className="shrink-0 text-[10px] font-mono tabular-nums pt-0.5"
                style={{ color: "#9ca3af" }}
              >
                {formatTime(e.timestamp)}
              </span>
              <span className="shrink-0 text-base leading-none pt-0.5">{e.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-snug" style={{ color: "#3D3D3D" }}>
                  <span className="font-semibold">{e.actor}</span>{" "}
                  <span style={{ color: "#6B7280" }}>{e.action}</span>
                  {e.amountXaf != null && (
                    <>
                      {" "}—{" "}
                      <span
                        className="font-bold"
                        style={{
                          color: "#D4A017",
                          fontFamily: "var(--font-space-mono), monospace",
                        }}
                      >
                        {formatFcfa(e.amountXaf)}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <EventDrawer event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
