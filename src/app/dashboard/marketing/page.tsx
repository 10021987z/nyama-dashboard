"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type {
  MarketingOverview, Influencer, Promotion, Campaign, CalendarEvent,
} from "@/lib/types";
import { formatFcfa, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useLanguage } from "@/hooks/use-language";
import {
  TrendingUp, Ticket, Bell, DollarSign, Plus, Users, Calendar,
  Tag, Megaphone, Flame,
} from "lucide-react";

// -- Helpers ------------------------------------------------------------------

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("fr-FR");
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

const AVATAR_COLORS = ["#a03c00", "#2c694e", "#8b4c11", "#c94d00", "#b45309", "#2563eb", "#7c3aed", "#db2777"];
function avatarColor(id?: string | null): string {
  if (!id) return AVATAR_COLORS[0];
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

// -- StatCard -----------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  sub,
  badge,
  badgeColor,
  highlight,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
  loading: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4"
      style={
        highlight
          ? { background: "linear-gradient(135deg, #a03c00, #c94d00)" }
          : { backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)" }
      }
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: highlight ? "rgba(255,255,255,0.2)" : "#fdf3ee" }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {loading ? (
            <Skeleton className="h-7 w-16 mb-1" />
          ) : (
            <p
              className="text-[1.6rem] font-bold leading-tight"
              style={{
                fontFamily: "var(--font-newsreader), Georgia, serif",
                color: highlight ? "#ffffff" : "#1b1c1a",
              }}
            >
              {value}
            </p>
          )}
          {badge && !loading && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: badgeColor ?? "#dcfce7", color: badgeColor === "#dcfce7" ? "#166534" : "#166534" }}
            >
              {badge}
            </span>
          )}
        </div>
        <p
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: highlight ? "rgba(255,255,255,0.7)" : "#7c7570" }}
        >
          {label}
        </p>
        {sub && (
          <p className="text-[10px] mt-0.5" style={{ color: highlight ? "rgba(255,255,255,0.5)" : "#b8b3ad" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// -- InfluencerCard -----------------------------------------------------------

function InfluencerCard({ inf }: { inf: Influencer }) {
  const { t } = useLanguage();
  const color = avatarColor(inf.id);
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {initials(inf.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "#1b1c1a" }}>{inf.name}</p>
          <p className="text-[10px]" style={{ color: "#7c7570" }}>{inf.type}</p>
        </div>
        {inf.trend > 0 && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
            +{inf.trend}%
          </span>
        )}
      </div>
      <div className="rounded-xl px-3 py-2" style={{ backgroundColor: "#f5f3ef" }}>
        <p className="text-[10px] font-mono font-bold tracking-wider" style={{ color: "#a03c00" }}>
          CODE: {inf.code}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "#7c7570" }}>{inf.uses} {t("marketing.uses")}</span>
        <span className="text-xs font-bold" style={{ color: "#1b1c1a" }}>{formatFcfa(inf.revenue)}</span>
      </div>
    </div>
  );
}

// -- CalendarCard -------------------------------------------------------------

function CalendarCard({ event }: { event: CalendarEvent }) {
  const d = new Date(event.date);
  const month = d.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase();
  const day = d.getDate();

  return (
    <div className="flex items-start gap-3">
      <div
        className="flex flex-col items-center justify-center rounded-xl px-3 py-2 shrink-0"
        style={{ background: "linear-gradient(135deg, #a03c00, #c94d00)" }}
      >
        <span className="text-[10px] font-bold uppercase" style={{ color: "rgba(255,255,255,0.7)" }}>{month}</span>
        <span className="text-lg font-bold leading-none text-white">{day}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: "#1b1c1a" }}>{event.title}</p>
        {event.code && (
          <p className="text-[10px] font-mono mt-0.5" style={{ color: "#a03c00" }}>CODE: {event.code}</p>
        )}
        {event.action && (
          <p className="text-[10px] mt-0.5" style={{ color: "#7c7570" }}>{event.action}</p>
        )}
      </div>
    </div>
  );
}

// -- PromotionCard ------------------------------------------------------------

function PromotionCard({ promo }: { promo: Promotion }) {
  const { t } = useLanguage();
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)" }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: "#fdf3ee" }}
      >
        <Tag className="h-5 w-5" style={{ color: "#a03c00" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "#1b1c1a" }}>{promo.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-mono font-bold"
            style={{ backgroundColor: "#fdf3ee", color: "#a03c00" }}
          >
            {promo.code}
          </span>
          <span className="text-[10px]" style={{ color: "#7c7570" }}>
            {t("marketing.expire")}: {formatDate(promo.expiresAt)}
          </span>
        </div>
      </div>
      <span className="text-xs font-semibold shrink-0" style={{ color: "#7c7570" }}>
        {promo.uses} {t("marketing.uses")}
      </span>
    </div>
  );
}

// -- CampaignRow --------------------------------------------------------------

function CampaignRow({ c }: { c: Campaign }) {
  return (
    <tr className="hover:bg-[#fbf9f5] transition-colors">
      <td className="px-4 py-3">
        <span className="text-xs" style={{ color: "#7c7570" }}>{formatDate(c.date)}</span>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm truncate max-w-[250px]" style={{ color: "#1b1c1a" }}>{c.message}</p>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold" style={{ color: "#1b1c1a" }}>{formatNumber(c.audience)}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f5f3ef" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(100, c.openRate)}%`, backgroundColor: c.openRate > 50 ? "#16a34a" : "#b45309" }}
            />
          </div>
          <span className="text-xs font-bold shrink-0" style={{ color: "#1b1c1a" }}>{c.openRate}%</span>
        </div>
      </td>
    </tr>
  );
}

// -- Main page ----------------------------------------------------------------

export default function MarketingPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<MarketingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<MarketingOverview>("/admin/marketing/overview");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de contacter le serveur NYAMA");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketing();
  }, [fetchMarketing]);

  const stats = data?.stats;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-[2rem] font-semibold italic leading-tight"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            {t("marketing.title")}
          </h1>
          <p
            className="mt-1 text-sm italic"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#7c7570" }}
          >
            {t("marketing.subtitle")}
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all"
          style={{ background: "linear-gradient(135deg, #a03c00, #c94d00)" }}
        >
          <Plus className="h-4 w-4" />
          {t("marketing.newCampaign")}
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={fetchMarketing} />}

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-5 w-5" style={{ color: "#a03c00" }} />}
          label={t("marketing.conversionRate")}
          value={stats ? `${stats.conversionRate}%` : "\u2014"}
          sub="+3.2% vs last month"
          loading={loading}
        />
        <StatCard
          icon={<Ticket className="h-5 w-5" style={{ color: "#b45309" }} />}
          label={t("marketing.activeCoupons")}
          value={stats?.activeCoupons ?? "\u2014"}
          sub={`12 ${t("marketing.expiresSoon")}`}
          loading={loading}
        />
        <StatCard
          icon={<Bell className="h-5 w-5" style={{ color: "#2c694e" }} />}
          label={t("marketing.pushReach")}
          value={stats ? formatNumber(stats.pushReach) : "\u2014"}
          badge="68% Open Rate"
          badgeColor="#dcfce7"
          loading={loading}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" style={{ color: "#ffffff" }} />}
          label={t("marketing.marketingRevenue")}
          value={stats ? formatFcfa(stats.marketingRevenue) : "\u2014"}
          sub="15% ROI"
          highlight
          loading={loading}
        />
      </div>

      {/* Influenceurs + Calendrier */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Influenceurs (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className="text-lg font-semibold italic"
              style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
            >
              {t("marketing.influencers")}
            </h2>
            <button
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors"
              style={{ border: "1.5px solid #a03c00", color: "#a03c00" }}
            >
              <Plus className="h-3.5 w-3.5" />
              {t("marketing.newInfluencerCode")}
            </button>
          </div>
          {loading ? (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {(data?.influencers ?? []).map((inf) => (
                <InfluencerCard key={inf.id} inf={inf} />
              ))}
              {(!data?.influencers || data.influencers.length === 0) && (
                <div className="col-span-2 flex flex-col items-center py-12">
                  <Users className="h-8 w-8 mb-2" style={{ color: "#e8e4de" }} />
                  <p className="text-sm" style={{ color: "#7c7570" }}>{t("marketing.noInfluencer")}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calendrier Gastronomique (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className="text-lg font-semibold italic"
              style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
            >
              {t("marketing.calendar")}
            </h2>
            <Calendar className="h-4 w-4" style={{ color: "#7c7570" }} />
          </div>
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
          >
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : data?.calendarEvents && data.calendarEvents.length > 0 ? (
              (data.calendarEvents ?? []).map((ev) => (
                <CalendarCard key={ev.id} event={ev} />
              ))
            ) : (
              <div className="flex flex-col items-center py-8">
                <Calendar className="h-8 w-8 mb-2" style={{ color: "#e8e4de" }} />
                <p className="text-sm" style={{ color: "#7c7570" }}>{t("marketing.noEvent")}</p>
              </div>
            )}
            <button
              className="w-full rounded-full py-2 text-xs font-semibold transition-colors"
              style={{ border: "1.5px solid #e8e4de", color: "#7c7570" }}
            >
              {t("marketing.addEvent")}
            </button>
          </div>
        </div>
      </div>

      {/* Promotions Actives */}
      <div className="space-y-4">
        <h2
          className="text-lg font-semibold italic"
          style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
        >
          {t("marketing.activePromos")}
        </h2>
        {loading ? (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : data?.promotions && data.promotions.length > 0 ? (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {(data.promotions ?? []).map((p) => (
              <PromotionCard key={p.id} promo={p} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl p-8 flex flex-col items-center"
            style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
          >
            <Tag className="h-8 w-8 mb-2" style={{ color: "#e8e4de" }} />
            <p className="text-sm" style={{ color: "#7c7570" }}>{t("marketing.noPromo")}</p>
          </div>
        )}
      </div>

      {/* Campaigns + Spice Analytics */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Campaigns table (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <h2
            className="text-lg font-semibold italic"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            {t("marketing.campaigns")}
          </h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
          >
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-xl" />
                ))}
              </div>
            ) : data?.campaigns && data.campaigns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#fbf9f5" }}>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>Date</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>{t("marketing.message")}</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>{t("marketing.audience")}</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>{t("marketing.openRate")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.campaigns ?? []).map((c) => (
                      <CampaignRow key={c.id} c={c} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center">
                <Megaphone className="h-8 w-8 mb-2" style={{ color: "#e8e4de" }} />
                <p className="text-sm" style={{ color: "#7c7570" }}>{t("marketing.noCampaign")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Spice Analytics (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2
            className="text-lg font-semibold italic"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            {t("marketing.spiceAnalytics")}
          </h2>
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: "linear-gradient(135deg, #a03c00, #c94d00)" }}
          >
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-white" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                {t("marketing.hotInsight")}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/90">
              {t("marketing.insightText")}{" "}
              <span className="font-bold text-white">{t("marketing.insightHighlight")}</span>{" "}
              {t("marketing.insightSuffix")}
            </p>
            <div className="flex gap-2">
              <span className="rounded-full px-2.5 py-1 text-[10px] font-bold bg-white/20 text-white">
                {t("marketing.hotInsight")}
              </span>
              <span className="rounded-full px-2.5 py-1 text-[10px] font-bold bg-white/20 text-white">
                LITTORAL REGION
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p
        className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2"
        style={{ color: "#b8b3ad" }}
      >
        {t("footer")}
      </p>
    </div>
  );
}
