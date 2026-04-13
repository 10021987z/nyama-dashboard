"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

const LABEL_KEYS: Record<string, string> = {
  dashboard: "nav.dashboard",
  restaurants: "nav.restaurants",
  orders: "nav.orders",
  deliveries: "nav.deliveries",
  fleet: "nav.fleet",
  customers: "nav.customers",
  marketing: "nav.marketing",
  support: "nav.support",
  settings: "nav.settings",
  analytics: "nav.dashboard",
  cooks: "nav.restaurants",
  riders: "nav.fleet",
  users: "nav.customers",
  disputes: "nav.disputes",
  partners: "nav.partners",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const labelKey = LABEL_KEYS[seg];
    const label = labelKey ? t(labelKey) : seg.charAt(0).toUpperCase() + seg.slice(1);
    return { href, label, isLast: i === segments.length - 1 };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-xs"
      style={{ color: "#6B7280" }}
    >
      <Home className="h-3.5 w-3.5" />
      {crumbs.map((c) => (
        <span key={c.href} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 opacity-60" />
          {c.isLast ? (
            <span className="font-semibold" style={{ color: "#3D3D3D" }}>
              {c.label}
            </span>
          ) : (
            <Link href={c.href} className="hover:underline">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
