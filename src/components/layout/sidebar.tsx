"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  UtensilsCrossed,
  Package,
  Truck,
  Bike,
  Users,
  Megaphone,
  MessageSquare,
  Settings,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";

const NAV_ITEMS = [
  { href: "/dashboard", icon: BarChart3, labelKey: "nav.dashboard" },
  { href: "/dashboard/restaurants", icon: UtensilsCrossed, labelKey: "nav.restaurants" },
  { href: "/dashboard/orders", icon: Package, labelKey: "nav.orders" },
  { href: "/dashboard/deliveries", icon: Truck, labelKey: "nav.deliveries" },
  { href: "/dashboard/fleet", icon: Bike, labelKey: "nav.fleet" },
  { href: "/dashboard/customers", icon: Users, labelKey: "nav.customers" },
  { href: "/dashboard/marketing", icon: Megaphone, labelKey: "nav.marketing" },
  { href: "/dashboard/support", icon: MessageSquare, labelKey: "nav.support" },
  { href: "/dashboard/settings", icon: Settings, labelKey: "nav.settings" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div
      className="flex h-full flex-col"
      style={{ backgroundColor: "#f5f3ef" }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-5">
        <div>
          <p
            className="text-xl font-bold leading-tight"
            style={{
              fontFamily: "var(--font-newsreader), Georgia, serif",
              color: "#a03c00",
            }}
          >
            Nyama Admin
          </p>
          <p
            className="text-[9px] tracking-[0.15em] uppercase leading-none mt-0.5"
            style={{ color: "#7c7570" }}
          >
            The Modern Griot&apos;s Table
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px" style={{ backgroundColor: "#e8e4de" }} />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "text-[#a03c00] font-semibold"
                  : "text-[#7c7570] hover:text-[#1b1c1a]"
              )}
              style={
                active
                  ? { backgroundColor: "rgba(160, 60, 0, 0.08)" }
                  : undefined
              }
            >
              {/* Left accent bar */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                  style={{ backgroundColor: "#a03c00" }}
                />
              )}
              <Icon
                className="h-4 w-4 shrink-0"
                strokeWidth={active ? 2.5 : 2}
                style={{ color: active ? "#a03c00" : "#7c7570" }}
              />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px" style={{ backgroundColor: "#e8e4de" }} />

      {/* Bottom: Export + Avatar */}
      <div className="px-3 py-4 space-y-3">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #a03c00, #c94d00)",
          }}
        >
          <Download className="h-3.5 w-3.5" />
          {t("nav.exportReport")}
        </button>

        <div className="flex items-center gap-2.5 px-1">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: "#a03c00" }}
          >
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1b1c1a] truncate">
              Administrateur
            </p>
            <p className="text-[10px] text-[#7c7570] truncate">Super Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
