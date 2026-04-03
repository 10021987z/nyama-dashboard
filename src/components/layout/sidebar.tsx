"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Package,
  Users,
  ChefHat,
  Bike,
  TrendingUp,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: BarChart3, label: "Vue d'ensemble" },
  { href: "/dashboard/orders", icon: Package, label: "Commandes" },
  { href: "/dashboard/users", icon: Users, label: "Utilisateurs" },
  { href: "/dashboard/cooks", icon: ChefHat, label: "Cuisinières" },
  { href: "/dashboard/riders", icon: Bike, label: "Livreurs" },
  { href: "/dashboard/analytics", icon: TrendingUp, label: "Analytics" },
  { href: "/dashboard/settings", icon: Settings, label: "Paramètres" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: "#1B4332" }}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <span className="text-2xl font-black text-white tracking-tight">
          🍽️ NYAMA
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-white/15 text-white font-semibold"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-xs text-white/40">NYAMA Dashboard v1.0</p>
        <p className="text-xs text-white/40">Douala · Yaoundé</p>
      </div>
    </div>
  );
}
