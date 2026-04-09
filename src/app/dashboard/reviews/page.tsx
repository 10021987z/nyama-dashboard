"use client";

import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useApi } from "@/hooks/use-api";
import { Star, MessageSquare, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

interface Review {
  id: string;
  cookRating: number;
  riderRating: number;
  cookComment?: string;
  riderComment?: string;
  createdAt: string;
  author?: { id: string; name: string };
}

interface ReviewsResponse {
  data: Review[];
  total: number;
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5" fill={i < n ? "#D4A017" : "none"} stroke="#D4A017" />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const { data, loading, error, refetch } = useApi<ReviewsResponse>("/reviews");

  const reviews = data?.data ?? [];
  const filtered = reviews.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (r.author?.name ?? "").toLowerCase().includes(q) ||
      (r.cookComment ?? "").toLowerCase().includes(q) ||
      (r.riderComment ?? "").toLowerCase().includes(q)
    );
  });

  const avgCook = reviews.length ? reviews.reduce((a, r) => a + (r.cookRating ?? 0), 0) / reviews.length : 0;
  const avgRider = reviews.length ? reviews.reduce((a, r) => a + (r.riderRating ?? 0), 0) / reviews.length : 0;

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-[1.8rem] font-semibold italic leading-tight" style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}>
          Avis & Notes
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
          {reviews.length} avis · Note cuisinières: {avgCook.toFixed(1)}★ · Note livreurs: {avgRider.toFixed(1)}★
        </p>
      </div>

      {error && <ErrorState message={error} onRetry={refetch} />}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#6B7280" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un avis…"
          className="w-full rounded-full pl-10 pr-4 py-2.5 text-sm outline-none"
          style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
        />
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-2xl p-5" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-bold" style={{ color: "#3D3D3D" }}>{r.author?.name ?? "Client anonyme"}</p>
                  <p className="text-[10px]" style={{ color: "#6B7280" }}>{new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-[10px]" style={{ color: "#6B7280" }}>
                  <div className="flex items-center gap-2">Cuisinière <Stars n={r.cookRating} /></div>
                  <div className="flex items-center gap-2">Livreur <Stars n={r.riderRating} /></div>
                </div>
              </div>
              {r.cookComment && (
                <div className="flex items-start gap-2 text-xs mt-2" style={{ color: "#3D3D3D" }}>
                  <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#F57C20" }} />
                  <p>{r.cookComment}</p>
                </div>
              )}
              {r.riderComment && (
                <div className="flex items-start gap-2 text-xs mt-2" style={{ color: "#6B7280" }}>
                  <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#1B4332" }} />
                  <p>{r.riderComment}</p>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm py-8" style={{ color: "#6B7280" }}>Aucun avis trouvé.</p>
          )}
        </div>
      )}

      <p className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2" style={{ color: "#b8b3ad" }}>
        {t("footer")}
      </p>
    </div>
  );
}
