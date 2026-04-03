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

function CalendarCard({ event, onClick }: { event: CalendarEvent; onClick?: () => void }) {
  const d = new Date(event.date);
  const month = d.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase();
  const day = d.getDate();

  return (
    <div
      className="flex items-start gap-3 cursor-pointer rounded-xl p-2 -m-2 transition-colors hover:bg-[#fbf9f5]"
      onClick={onClick}
    >
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

// -- Toast --------------------------------------------------------------------

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg animate-in fade-in slide-in-from-bottom-4"
      style={{ background: "linear-gradient(135deg, #a03c00, #c94d00)" }}
    >
      {message}
    </div>
  );
}

// -- Dialog Overlay -----------------------------------------------------------

function DialogOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "#ffffff" }}
      >
        {children}
      </div>
    </div>
  );
}

function DialogTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-xl font-semibold italic"
      style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
    >
      {children}
    </h3>
  );
}

function DialogInput({
  label, value, onChange, type = "text", placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold" style={{ color: "#7c7570" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border-0"
        style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
      />
    </div>
  );
}

function DialogTextarea({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold" style={{ color: "#7c7570" }}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border-0 resize-none"
        style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
      />
    </div>
  );
}

function DialogSelect({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold" style={{ color: "#7c7570" }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border-0 appearance-none"
        style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function DialogButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
      style={{ background: "linear-gradient(135deg, #a03c00, #c94d00)" }}
    >
      {children}
    </button>
  );
}

// -- Main page ----------------------------------------------------------------

export default function MarketingPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<MarketingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local state arrays
  const [localCampaigns, setLocalCampaigns] = useState<Campaign[]>([]);
  const [localInfluencers, setLocalInfluencers] = useState<Influencer[]>([]);
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([]);

  // Dialog visibility
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showNewInfluencer, setShowNewInfluencer] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // New campaign form
  const [campName, setCampName] = useState("");
  const [campMessage, setCampMessage] = useState("");
  const [campAudience, setCampAudience] = useState("Tous");
  const [campDate, setCampDate] = useState("");
  const [campType, setCampType] = useState("Push");

  // New influencer form
  const [infName, setInfName] = useState("");
  const [infCode, setInfCode] = useState(() => `INF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
  const [infCommission, setInfCommission] = useState("");
  const [infDuration, setInfDuration] = useState("");

  // New event form
  const [evTitle, setEvTitle] = useState("");
  const [evDate, setEvDate] = useState("");
  const [evCode, setEvCode] = useState("");
  const [evDescription, setEvDescription] = useState("");

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

  // Merged data
  const allCampaigns = [...(data?.campaigns ?? []), ...localCampaigns];
  const allInfluencers = [...(data?.influencers ?? []), ...localInfluencers];
  const allEvents = [...(data?.calendarEvents ?? []), ...localEvents];

  // Handlers
  const handleCreateCampaign = () => {
    if (!campName.trim() || !campMessage.trim()) return;
    const audienceMap: Record<string, number> = { Tous: 15000, Douala: 8500, "Yaound\u00e9": 6500 };
    const newCampaign: Campaign = {
      id: `local-camp-${Date.now()}`,
      date: campDate || new Date().toISOString(),
      message: `[${campType}] ${campName}: ${campMessage}`,
      audience: audienceMap[campAudience] ?? 10000,
      openRate: 0,
    };
    setLocalCampaigns((prev) => [...prev, newCampaign]);
    setShowNewCampaign(false);
    setCampName(""); setCampMessage(""); setCampAudience("Tous"); setCampDate(""); setCampType("Push");
    setToast("Campagne cr\u00e9\u00e9e \u2705");
  };

  const handleCreateInfluencer = () => {
    if (!infName.trim()) return;
    const newInf: Influencer = {
      id: `local-inf-${Date.now()}`,
      name: infName,
      type: "Influenceur",
      code: infCode,
      uses: 0,
      revenue: 0,
      trend: 0,
    };
    setLocalInfluencers((prev) => [...prev, newInf]);
    setShowNewInfluencer(false);
    setInfName(""); setInfCode(`INF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
    setInfCommission(""); setInfDuration("");
    setToast("Code influenceur cr\u00e9\u00e9 \u2705");
  };

  const handleCreateEvent = () => {
    if (!evTitle.trim() || !evDate) return;
    const newEvent: CalendarEvent = {
      id: `local-ev-${Date.now()}`,
      date: evDate,
      title: evTitle,
      code: evCode || undefined,
      action: evDescription || undefined,
    };
    setLocalEvents((prev) => [...prev, newEvent]);
    setShowNewEvent(false);
    setEvTitle(""); setEvDate(""); setEvCode(""); setEvDescription("");
    setToast("\u00c9v\u00e9nement ajout\u00e9 \u2705");
  };

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
          onClick={() => setShowNewCampaign(true)}
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
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
              onClick={() => setShowNewInfluencer(true)}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors hover:opacity-80"
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
              {allInfluencers.map((inf) => (
                <InfluencerCard key={inf.code} inf={inf} />
              ))}
              {allInfluencers.length === 0 && (
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
            ) : allEvents.length > 0 ? (
              allEvents.map((ev, i) => (
                <CalendarCard key={i} event={ev} onClick={() => setSelectedEvent(ev)} />
              ))
            ) : (
              <div className="flex flex-col items-center py-8">
                <Calendar className="h-8 w-8 mb-2" style={{ color: "#e8e4de" }} />
                <p className="text-sm" style={{ color: "#7c7570" }}>{t("marketing.noEvent")}</p>
              </div>
            )}
            <button
              onClick={() => setShowNewEvent(true)}
              className="w-full rounded-full py-2 text-xs font-semibold transition-colors hover:opacity-80"
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
              <PromotionCard key={p.code} promo={p} />
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
            ) : allCampaigns.length > 0 ? (
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
                    {allCampaigns.map((c, i) => (
                      <CampaignRow key={i} c={c} />
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

      {/* -- New Campaign Dialog -- */}
      {showNewCampaign && (
        <DialogOverlay onClose={() => setShowNewCampaign(false)}>
          <DialogTitle>Nouvelle Campagne</DialogTitle>
          <DialogInput label="Nom campagne" value={campName} onChange={setCampName} placeholder="Ex: Promo Ramadan" />
          <DialogTextarea label="Message" value={campMessage} onChange={setCampMessage} placeholder="Contenu du message..." />
          <DialogSelect
            label="Audience cible"
            value={campAudience}
            onChange={setCampAudience}
            options={[
              { value: "Tous", label: "Tous" },
              { value: "Douala", label: "Douala" },
              { value: "Yaound\u00e9", label: "Yaound\u00e9" },
            ]}
          />
          <DialogInput label="Date d'envoi" value={campDate} onChange={setCampDate} type="date" />
          <DialogSelect
            label="Type"
            value={campType}
            onChange={setCampType}
            options={[
              { value: "Push", label: "Push" },
              { value: "SMS", label: "SMS" },
              { value: "Email", label: "Email" },
            ]}
          />
          <DialogButton onClick={handleCreateCampaign} disabled={!campName.trim() || !campMessage.trim()}>
            Cr\u00e9er
          </DialogButton>
        </DialogOverlay>
      )}

      {/* -- New Influencer Code Dialog -- */}
      {showNewInfluencer && (
        <DialogOverlay onClose={() => setShowNewInfluencer(false)}>
          <DialogTitle>Nouveau Code Influenceur</DialogTitle>
          <DialogInput label="Nom influenceur" value={infName} onChange={setInfName} placeholder="Ex: Chef Awa" />
          <DialogInput label="Code promo" value={infCode} onChange={setInfCode} />
          <DialogInput label="Commission (%)" value={infCommission} onChange={setInfCommission} type="number" placeholder="10" />
          <DialogInput label="Dur\u00e9e validit\u00e9 (jours)" value={infDuration} onChange={setInfDuration} type="number" placeholder="30" />
          <DialogButton onClick={handleCreateInfluencer} disabled={!infName.trim()}>
            Cr\u00e9er
          </DialogButton>
        </DialogOverlay>
      )}

      {/* -- New Event Dialog -- */}
      {showNewEvent && (
        <DialogOverlay onClose={() => setShowNewEvent(false)}>
          <DialogTitle>Ajouter un \u00e9v\u00e9nement</DialogTitle>
          <DialogInput label="Titre \u00e9v\u00e9nement" value={evTitle} onChange={setEvTitle} placeholder="Ex: Festival du Ndol\u00e9" />
          <DialogInput label="Date" value={evDate} onChange={setEvDate} type="date" />
          <DialogInput label="Code promo (optionnel)" value={evCode} onChange={setEvCode} placeholder="Ex: NDOLE25" />
          <DialogTextarea label="Description" value={evDescription} onChange={setEvDescription} placeholder="D\u00e9tails de l'\u00e9v\u00e9nement..." />
          <DialogButton onClick={handleCreateEvent} disabled={!evTitle.trim() || !evDate}>
            Ajouter
          </DialogButton>
        </DialogOverlay>
      )}

      {/* -- Event Detail Dialog -- */}
      {selectedEvent && (
        <DialogOverlay onClose={() => setSelectedEvent(null)}>
          <DialogTitle>{selectedEvent.title}</DialogTitle>
          <div className="space-y-3">
            <div className="rounded-xl px-3 py-2" style={{ backgroundColor: "#f5f3ef" }}>
              <p className="text-[10px] font-semibold uppercase" style={{ color: "#7c7570" }}>Date</p>
              <p className="text-sm font-semibold" style={{ color: "#1b1c1a" }}>
                {new Date(selectedEvent.date).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            {selectedEvent.code && (
              <div className="rounded-xl px-3 py-2" style={{ backgroundColor: "#f5f3ef" }}>
                <p className="text-[10px] font-semibold uppercase" style={{ color: "#7c7570" }}>Code promo</p>
                <p className="text-sm font-mono font-bold" style={{ color: "#a03c00" }}>{selectedEvent.code}</p>
              </div>
            )}
            {selectedEvent.action && (
              <div className="rounded-xl px-3 py-2" style={{ backgroundColor: "#f5f3ef" }}>
                <p className="text-[10px] font-semibold uppercase" style={{ color: "#7c7570" }}>Description</p>
                <p className="text-sm" style={{ color: "#1b1c1a" }}>{selectedEvent.action}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSelectedEvent(null)}
            className="w-full rounded-full py-2.5 text-sm font-semibold transition-colors"
            style={{ border: "1.5px solid #e8e4de", color: "#7c7570" }}
          >
            Fermer
          </button>
        </DialogOverlay>
      )}

      {/* -- Toast -- */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
