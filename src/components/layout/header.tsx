"use client";

import { Bell, Search, Settings, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";

interface HeaderProps {
  user: AuthUser | null;
  onMenuClick: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  return (
    <header
      className="flex h-14 items-center gap-4 px-4 lg:px-6"
      style={{ backgroundColor: "#fbf9f5" }}
    >
      {/* Burger — mobile only */}
      <button
        className="lg:hidden flex items-center justify-center rounded-xl p-2 transition-colors"
        style={{ backgroundColor: "rgba(27,28,26,0.04)" }}
        onClick={onMenuClick}
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" style={{ color: "#1b1c1a" }} />
      </button>

      {/* Search bar — centered */}
      <div className="flex-1 max-w-sm lg:max-w-md">
        <div
          className="flex items-center gap-2.5 rounded-full px-3.5 py-2"
          style={{ backgroundColor: "#f5f3ef" }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "#7c7570" }} />
          <span className="text-sm" style={{ color: "#7c7570" }}>
            Rechercher des données...
          </span>
        </div>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <button
          className="relative flex items-center justify-center rounded-xl p-2 transition-colors hover:bg-[#f5f3ef]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" style={{ color: "#7c7570" }} />
          <span
            className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "#ef4444" }}
          />
        </button>

        {/* Settings shortcut */}
        <button
          className="hidden sm:flex items-center justify-center rounded-xl p-2 transition-colors hover:bg-[#f5f3ef]"
          aria-label="Paramètres"
        >
          <Settings className="h-5 w-5" style={{ color: "#7c7570" }} />
        </button>

        {/* User avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-[#f5f3ef] outline-none">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: "#a03c00" }}
            >
              A
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold leading-none" style={{ color: "#1b1c1a" }}>
                Admin
              </p>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: "#7c7570" }}>
                {user?.phone ?? "Super Admin"}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="text-xs">
              {user?.phone ?? "Administrateur"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 text-xs"
              onClick={() => logout()}
            >
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
