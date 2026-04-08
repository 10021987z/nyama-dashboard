"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Star, MessageSquare, ThumbsUp, AlertTriangle, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

interface Review {
  id: string;
  client: string;
  restaurant: string;
  rating: number;
  date: string;
  comment: string;
  status: "PUBLIÉ" | "À MODÉRER" | "SIGNALÉ";
  sentiment: "POSITIF" | "NEUTRE" | "NÉGATIF";
}

const REVIEWS: Review[] = [
  { id: "r1", client: "Aïcha Mballa", restaurant: "Chez Mama Africa", rating: 5, date: "2026-04-08", comment: "Le ndolè était absolument parfait, généreux en crevettes. Livraison rapide et le livreur très courtois. Je recommande !", status: "PUBLIÉ", sentiment: "POSITIF" },
  { id: "r2", client: "Patrick Etoundi", restaurant: "Le Saveurs du 237", rating: 5, date: "2026-04-08", comment: "Poulet DG au top, comme à la maison. Continuez !", status: "PUBLIÉ", sentiment: "POSITIF" },
  { id: "r3", client: "Marie Foe", restaurant: "Bantu Kitchen", rating: 2, date: "2026-04-07", comment: "Plat tiède à l'arrivée et pas assez assaisonné. Décevant pour le prix.", status: "À MODÉRER", sentiment: "NÉGATIF" },
  { id: "r4", client: "Jean Mvondo", restaurant: "Mboa Délices", rating: 4, date: "2026-04-07", comment: "Bobolo savoureux mais portion un peu petite.", status: "PUBLIÉ", sentiment: "NEUTRE" },
  { id: "r5", client: "Sandrine Kameni", restaurant: "Chez Mama Africa", rating: 5, date: "2026-04-07", comment: "Comme toujours impeccable. Mention spéciale au koki.", status: "PUBLIÉ", sentiment: "POSITIF" },
  { id: "r6", client: "Anonyme", restaurant: "Le Saveurs du 237", rating: 1, date: "2026-04-06", comment: "Service pourri, je vais porter plainte !!!", status: "SIGNALÉ", sentiment: "NÉGATIF" },
  { id: "r7", client: "Ngassam Eric", restaurant: "Bantu Kitchen", rating: 4, date: "2026-04-06", comment: "Eru excellent, livraison à l'heure.", status: "PUBLIÉ", sentiment: "POSITIF" },
  { id: "r8", client: "Carine Tchoumi", restaurant: "Mboa Délices", rating: 3, date: "2026-04-05", comment: "Correct sans plus.", status: "PUBLIÉ", sentiment: "NEUTRE" },
];

const RATING_DIST = [
  { stars: "5★", count: 312 }, { stars: "4★", count: 142 }, { stars: "3★", count: 48 }, { stars: "2★", count: 18 }, { stars: "1★", count: 9 },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className="h-3.5 w-3.5" style={{ color: i <= rating ? "#b45309" : "#e8e4de", fill: i <= rating ? "#b45309" : "transparent" }} />
      ))}
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl p-5 flex items-start gap-4" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
      <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: "#fdf3ee" }}>{icon}</div>
      <div>
        <p className="text-[1.6rem] font-bold leading-tight" style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: accent ?? "#3D3D3D" }}>{value}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>{label}</p>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "PUBLIÉ" | "À MODÉRER" | "SIGNALÉ">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return REVIEWS.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (q && !r.client.toLowerCase().includes(q) && !r.restaurant.toLowerCase().includes(q) && !r.comment.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, filter]);

  const avgRating = (REVIEWS.reduce((a, r) => a + r.rating, 0) / REVIEWS.length).toFixed(1);
  const total = RATING_DIST.reduce((a, r) => a + r.count, 0);
  const positiveRate = Math.round(((RATING_DIST[0].count + RATING_DIST[1].count) / total) * 100);

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-[1.8rem] font-semibold italic leading-tight" style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}>
          Avis & Qualité
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>Modération des avis clients · sentiment · qualité plateforme</p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Star className="h-5 w-5" style={{ color: "#b45309" }} />} label="Note moyenne" value={`${avgRating}/5`} accent="#b45309" />
        <StatCard icon={<MessageSquare className="h-5 w-5" style={{ color: "#F57C20" }} />} label="Avis 30j" value={total.toLocaleString("fr-FR")} />
        <StatCard icon={<ThumbsUp className="h-5 w-5" style={{ color: "#166534" }} />} label="Taux positif" value={`${positiveRate}%`} accent="#166534" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" style={{ color: "#991b1b" }} />} label="À modérer" value={REVIEWS.filter((r) => r.status !== "PUBLIÉ").length.toString()} accent="#991b1b" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 rounded-2xl p-5" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "#3D3D3D" }}>Distribution des notes</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={RATING_DIST} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ef" />
              <XAxis type="number" stroke="#9ca3af" fontSize={10} />
              <YAxis dataKey="stars" type="category" stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f5f3ef" }} />
              <Bar dataKey="count" fill="#F57C20" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 rounded-2xl p-5 flex flex-col gap-3" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
          <h3 className="text-sm font-bold" style={{ color: "#3D3D3D" }}>Insight sentiment IA</h3>
          <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
            Sur les 30 derniers jours, <strong style={{ color: "#3D3D3D" }}>{positiveRate}% des avis sont positifs</strong>. Les mots-clés
            les plus fréquents : <span className="font-semibold" style={{ color: "#F57C20" }}>« généreux »</span>,{" "}
            <span className="font-semibold" style={{ color: "#F57C20" }}>« rapide »</span>,{" "}
            <span className="font-semibold" style={{ color: "#F57C20" }}>« assaisonné »</span>. Les motifs récurrents de plainte :
            plat tiède (8%), portion (5%), retard livraison (3%).
          </p>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { l: "Positifs", v: positiveRate, c: "#166534", bg: "#dcfce7" },
              { l: "Neutres", v: 11, c: "#b45309", bg: "#fef3c7" },
              { l: "Négatifs", v: 5, c: "#991b1b", bg: "#fee2e2" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl p-3" style={{ backgroundColor: s.bg }}>
                <p className="text-2xl font-bold" style={{ color: s.c, fontFamily: "var(--font-montserrat), system-ui, sans-serif" }}>{s.v}%</p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.c }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4 flex flex-wrap items-center gap-3" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-full px-3.5 py-2" style={{ backgroundColor: "#f5f3ef" }}>
          <Search className="h-4 w-4 shrink-0" style={{ color: "#6B7280" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Chercher un avis, un client, un restaurant…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#3D3D3D" }}
          />
        </div>
        <div className="flex gap-1 rounded-full p-1" style={{ backgroundColor: "#f5f3ef" }}>
          {(["all", "PUBLIÉ", "À MODÉRER", "SIGNALÉ"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
              style={
                filter === f
                  ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }
                  : { color: "#6B7280" }
              }
            >
              {f === "all" ? "Tous" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-2xl p-4 flex flex-col gap-2" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: "#3D3D3D" }}>{r.client}</p>
                  <span className="text-xs" style={{ color: "#9ca3af" }}>· {r.restaurant}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <StarRow rating={r.rating} />
                  <span className="text-xs" style={{ color: "#9ca3af" }}>{r.date}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
                  style={
                    r.status === "PUBLIÉ" ? { backgroundColor: "#dcfce7", color: "#166534" }
                    : r.status === "À MODÉRER" ? { backgroundColor: "#fef3c7", color: "#b45309" }
                    : { backgroundColor: "#fee2e2", color: "#991b1b" }
                  }>
                  {r.status}
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#3D3D3D" }}>{r.comment}</p>
            {r.status !== "PUBLIÉ" && (
              <div className="flex gap-2 pt-1">
                <button className="rounded-full px-3 py-1 text-[10px] font-semibold text-white" style={{ background: "linear-gradient(135deg, #166534, #14532d)" }}>Approuver</button>
                <button className="rounded-full px-3 py-1 text-[10px] font-semibold" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>Supprimer</button>
                <button className="rounded-full px-3 py-1 text-[10px] font-semibold" style={{ backgroundColor: "#f5f3ef", color: "#6B7280" }}>Répondre</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2" style={{ color: "#b8b3ad" }}>
        {t("footer")}
      </p>
    </div>
  );
}
