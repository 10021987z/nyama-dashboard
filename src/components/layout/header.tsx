"use client";

import { Bell, Search, Settings, Menu, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth";
import { useLanguage } from "@/hooks/use-language";
import type { AuthUser } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

const LANG_OPTIONS: { value: Locale; label: string; flag: string }[] = [
  { value: "fr", label: "FR", flag: "\uD83C\uDDEB\uD83C\uDDF7" },
  { value: "en", label: "EN", flag: "\uD83C\uDDEC\uD83C\uDDE7" },
  { value: "pidgin", label: "PID", flag: "\uD83C\uDDE8\uD83C\uDDF2" },
];

interface HeaderProps {
  user: AuthUser | null;
  onMenuClick: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const { locale, setLocale, t } = useLanguage();

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
            {t("common.search")}
          </span>
        </div>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-[#f5f3ef] outline-none">
            <Globe className="h-4 w-4" style={{ color: "#7c7570" }} />
            <span className="text-xs font-semibold" style={{ color: "#1b1c1a" }}>
              {LANG_OPTIONS.find((l) => l.value === locale)?.flag}{" "}
              {LANG_OPTIONS.find((l) => l.value === locale)?.label}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {LANG_OPTIONS.map((lang) => (
              <DropdownMenuItem
                key={lang.value}
                className="text-xs gap-2 cursor-pointer"
                onClick={() => setLocale(lang.value)}
              >
                <span>{lang.flag}</span>
                <span className={locale === lang.value ? "font-bold" : ""}>
                  {lang.label}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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
          aria-label={t("nav.settings")}
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
              {t("common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
