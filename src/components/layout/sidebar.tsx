"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  UtensilsCrossed,
  BookOpen,
  Package,
  Truck,
  Bike,
  Users,
  Megaphone,
  MessageSquare,
  Settings,
  DollarSign,
  Star,
  Bell,
  FileText,
  Download,
  ChevronsLeft,
  ChevronsRight,
  Scale,
  UserCheck,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { apiClient } from "@/lib/api";
import type { DashboardData, PartnershipStats } from "@/lib/types";
import { useSidebar } from "./sidebar-context";

const NAV_ITEMS = [
  { href: "/dashboard", icon: BarChart3, labelKey: "nav.dashboard" },
  { href: "/dashboard/restaurants", icon: UtensilsCrossed, labelKey: "nav.restaurants" },
  { href: "/dashboard/menu", icon: BookOpen, labelKey: "nav.menu" },
  { href: "/dashboard/orders", icon: Package, labelKey: "nav.orders" },
  { href: "/dashboard/deliveries", icon: Truck, labelKey: "nav.deliveries" },
  { href: "/dashboard/fleet", icon: Bike, labelKey: "nav.fleet" },
  { href: "/dashboard/customers", icon: Users, labelKey: "nav.customers" },
  { href: "/dashboard/marketing", icon: Megaphone, labelKey: "nav.marketing" },
  { href: "/dashboard/finances", icon: DollarSign, labelKey: "nav.finances" },
  { href: "/dashboard/reviews", icon: Star, labelKey: "nav.reviews" },
  { href: "/dashboard/communications", icon: Bell, labelKey: "nav.communications" },
  { href: "/dashboard/reports", icon: FileText, labelKey: "nav.reports" },
  { href: "/dashboard/disputes", icon: Scale, labelKey: "nav.disputes" },
  { href: "/dashboard/partners", icon: UserCheck, labelKey: "nav.partners" },
  {
    href: "/dashboard/partnerships",
    icon: ClipboardList,
    labelKey: "nav.partnerships",
    badgeKey: "partnerships" as const,
  },
  { href: "/dashboard/support", icon: MessageSquare, labelKey: "nav.support" },
  { href: "/dashboard/settings", icon: Settings, labelKey: "nav.settings" },
];

interface SidebarProps {
  onNavigate?: () => void;
  forceExpanded?: boolean;
}

export function Sidebar({ onNavigate, forceExpanded = false }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { collapsed: ctxCollapsed, toggle } = useSidebar();
  const collapsed = forceExpanded ? false : ctxCollapsed;
  const [pendingPartnerships, setPendingPartnerships] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const s = await apiClient.get<PartnershipStats>(
          "/admin/partnerships/stats"
        );
        if (!cancelled) setPendingPartnerships(s?.pending ?? 0);
      } catch {
        // silent — badge stays at 0
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const badgeCount = (key?: "partnerships") =>
    key === "partnerships" ? pendingPartnerships : 0;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div
      className="flex h-full flex-col transition-all duration-200"
      style={{ backgroundColor: "#3D3D3D" }}
    >
      {/* Logo + collapse */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed ? (
          <div>
            <p
              className="text-xl font-bold leading-tight"
              style={{
                fontFamily: "var(--font-montserrat), system-ui, sans-serif",
                color: "#F57C20",
              }}
            >
              Nyama Admin
            </p>
            <p
              className="text-[9px] tracking-[0.15em] uppercase leading-none mt-0.5"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Cuisine camerounaise
            </p>
          </div>
        ) : (
          <div
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: "#F57C20" }}
          >
            N
          </div>
        )}
        {!forceExpanded && (
          <button
            onClick={toggle}
            className={cn(
              "flex items-center justify-center rounded-lg p-1.5 transition-colors hover:bg-white/10",
              collapsed && "absolute top-3 right-2"
            )}
            aria-label={collapsed ? "Déplier" : "Replier"}
            title={collapsed ? "Déplier" : "Replier"}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4 text-white/60" />
            ) : (
              <ChevronsLeft className="h-4 w-4 text-white/60" />
            )}
          </button>
        )}
      </div>

      <div className="mx-4 h-px" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const { href, icon: Icon, labelKey } = item;
          const badge = badgeCount(
            "badgeKey" in item ? item.badgeKey : undefined
          );
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={collapsed ? t(labelKey) : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                collapsed && "justify-center px-2",
                active ? "text-[#F57C20] font-semibold" : "text-white/60 hover:text-white/90"
              )}
              style={
                active ? { backgroundColor: "rgba(245, 124, 32, 0.15)" } : undefined
              }
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                  style={{ backgroundColor: "#F57C20" }}
                />
              )}
              <span className="relative shrink-0">
                <Icon
                  className="h-4 w-4"
                  strokeWidth={active ? 2.5 : 2}
                  style={{ color: active ? "#F57C20" : "rgba(255,255,255,0.5)" }}
                />
                {collapsed && badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[8px] font-bold text-white"
                    style={{ backgroundColor: "#ef4444" }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{t(labelKey)}</span>
                  {badge > 0 && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: "#ef4444" }}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </>
              )}

              {/* Tooltip when collapsed */}
              {collapsed && (
                <span
                  className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50"
                  style={{ backgroundColor: "#1a1a1a" }}
                >
                  {t(labelKey)}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 h-px" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />

      {/* Bottom: Export + Avatar */}
      <div className="px-3 py-4 space-y-3">
        <button
          onClick={() => {
            if (typeof window === "undefined") return;
            window.open(
              "https://nyama-web.vercel.app/admin/login",
              "_blank",
              "noopener,noreferrer",
            );
          }}
          title={collapsed ? "Ouvrir le portail web" : undefined}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-full text-xs font-semibold transition-colors",
            collapsed ? "p-2" : "py-2"
          )}
          style={{
            border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {!collapsed && "Ouvrir le portail web"}
        </button>

        <button
          onClick={async () => {
            try {
              const d = await apiClient.get<DashboardData>("/admin/dashboard");
              const rows = [
                ["Métrique", "Valeur"],
                ["Commandes aujourd'hui", String(d.ordersToday ?? 0)],
                ["Commandes semaine", String(d.ordersThisWeek ?? 0)],
                ["CA du jour", String(d.revenueToday ?? 0)],
                ["CA mois", String(d.revenueThisMonth ?? 0)],
                ["Utilisateurs totaux", String(d.totalUsers ?? 0)],
                ["Cuisinières actives", String(d.totalCooks ?? 0)],
                ["Panier moyen", String(d.avgBasketXaf ?? 0)],
                ["Taux succès paiement", `${d.paymentSuccessRate ?? 0}%`],
              ];
              const csv = rows.map((r) => r.join(",")).join("\n");
              const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              const date = new Date().toISOString().slice(0, 10);
              a.href = url;
              a.download = `nyama-rapport-${date}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              window.alert("Rapport exporté avec succès !");
            } catch {
              window.alert("Erreur lors de l'export du rapport.");
            }
          }}
          title={collapsed ? t("nav.exportReport") : undefined}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90",
            collapsed ? "p-2" : "py-2.5"
          )}
          style={{
            background: "linear-gradient(135deg, #F57C20, #E06A10)",
          }}
        >
          <Download className="h-3.5 w-3.5" />
          {!collapsed && t("nav.exportReport")}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2.5 px-1">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: "#F57C20" }}
            >
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                Administrateur
              </p>
              <p className="text-[10px] text-white/50 truncate">Super Admin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
