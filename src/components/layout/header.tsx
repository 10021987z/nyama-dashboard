"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Settings, Menu, Globe, Command } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth";
import { useLanguage } from "@/hooks/use-language";
import { apiClient } from "@/lib/api";
import type { AuthUser, Order, Restaurant, User, OrdersResponse, RestaurantsResponse, UsersResponse } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

const LANG_OPTIONS: { value: Locale; label: string; flag: string }[] = [
  { value: "fr", label: "FR", flag: "\uD83C\uDDEB\uD83C\uDDF7" },
  { value: "en", label: "EN", flag: "\uD83C\uDDEC\uD83C\uDDE7" },
  { value: "pidgin", label: "PID", flag: "\uD83C\uDDE8\uD83C\uDDF2" },
];

const SIMULATED_NOTIFICATIONS = [
  { id: 1, text: "Nouvelle commande #1042 recue", time: "Il y a 2 min" },
  { id: 2, text: "Le livreur Paul a termine sa livraison", time: "Il y a 15 min" },
  { id: 3, text: "Restaurant 'Chez Mama' a mis a jour son menu", time: "Il y a 1h" },
  { id: 4, text: "Nouveau client inscrit: Marie K.", time: "Il y a 3h" },
  { id: 5, text: "Alerte: 3 commandes en attente depuis 30 min", time: "Il y a 5h" },
];

interface HeaderProps {
  user: AuthUser | null;
  onMenuClick: () => void;
  onOpenPalette?: () => void;
}

export function Header({ user, onMenuClick, onOpenPalette }: HeaderProps) {
  const { locale, setLocale, t } = useLanguage();
  const router = useRouter();

  // ── Search state ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    orders: Order[];
    restaurants: Restaurant[];
    users: User[];
  }>({ orders: [], restaurants: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── Notifications state ──────────────────────────────────────────────────
  const [unreadCount, setUnreadCount] = useState(5);

  // ── Debounced search ─────────────────────────────────────────────────────
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ orders: [], restaurants: [], users: [] });
      setSearchOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const [ordersRes, restaurantsRes, usersRes] = await Promise.all([
        apiClient.get<OrdersResponse>("/admin/orders", { search: query, limit: 5 }),
        apiClient.get<RestaurantsResponse>("/admin/restaurants", { search: query, limit: 5 }),
        apiClient.get<UsersResponse>("/admin/users", { search: query, limit: 5 }),
      ]);

      setSearchResults({
        orders: ordersRes.data ?? [],
        restaurants: restaurantsRes.data ?? [],
        users: usersRes.data ?? [],
      });
      setSearchOpen(true);
    } catch {
      setSearchResults({ orders: [], restaurants: [], users: [] });
      setSearchOpen(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    },
    [performSearch]
  );

  // ── Close search on outside click or Escape ──────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const totalResults =
    searchResults.orders.length +
    searchResults.restaurants.length +
    searchResults.users.length;

  return (
    <header
      className="flex h-14 items-center gap-4 px-4 lg:px-6"
      style={{ backgroundColor: "#fbf9f5" }}
    >
      {/* Burger -- mobile only */}
      <button
        className="lg:hidden flex items-center justify-center rounded-xl p-2 transition-colors"
        style={{ backgroundColor: "rgba(27,28,26,0.04)" }}
        onClick={onMenuClick}
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" style={{ color: "#3D3D3D" }} />
      </button>

      {/* Search bar -- centered */}
      <div className="flex-1 max-w-sm lg:max-w-md relative" ref={searchRef}>
        <div
          className="flex items-center gap-2.5 rounded-full px-3.5 py-2"
          style={{ backgroundColor: "#f5f3ef" }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "#6B7280" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchQuery.trim()) setSearchOpen(true);
            }}
            placeholder={t("common.search")}
            className="text-sm bg-transparent border-none outline-none w-full placeholder:text-[#6B7280]"
            style={{ color: "#3D3D3D" }}
          />
          {onOpenPalette && (
            <button
              type="button"
              onClick={onOpenPalette}
              className="hidden md:flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition-colors hover:bg-white"
              style={{ borderColor: "rgba(27,28,26,0.08)", color: "#6B7280" }}
              title="Recherche globale (⌘K)"
            >
              <Command className="h-3 w-3" />K
            </button>
          )}
        </div>

        {/* Search dropdown */}
        {searchOpen && searchQuery.trim() && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg border overflow-hidden z-50"
            style={{ backgroundColor: "#ffffff", borderColor: "#f5f3ef" }}
          >
            {isSearching ? (
              <div className="px-4 py-3 text-sm" style={{ color: "#6B7280" }}>
                Recherche en cours...
              </div>
            ) : totalResults === 0 ? (
              <div className="px-4 py-3 text-sm" style={{ color: "#6B7280" }}>
                Aucun resultat pour &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {/* Orders */}
                {searchResults.orders.length > 0 && (
                  <div>
                    <div
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "#6B7280", backgroundColor: "#fbf9f5" }}
                    >
                      Commandes
                    </div>
                    {searchResults.orders.map((order) => (
                      <button
                        key={order.id}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-[#f5f3ef] transition-colors flex items-center justify-between"
                        style={{ color: "#3D3D3D" }}
                        onClick={() => {
                          router.push("/dashboard/orders");
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <span>#{order.id} - {order.clientName}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "#f5f3ef", color: "#6B7280" }}
                        >
                          {order.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Restaurants */}
                {searchResults.restaurants.length > 0 && (
                  <div>
                    <div
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "#6B7280", backgroundColor: "#fbf9f5" }}
                    >
                      Restaurants
                    </div>
                    {searchResults.restaurants.map((restaurant) => (
                      <button
                        key={restaurant.id}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-[#f5f3ef] transition-colors"
                        style={{ color: "#3D3D3D" }}
                        onClick={() => {
                          router.push("/dashboard/restaurants");
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        {restaurant.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Users */}
                {searchResults.users.length > 0 && (
                  <div>
                    <div
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "#6B7280", backgroundColor: "#fbf9f5" }}
                    >
                      Utilisateurs
                    </div>
                    {searchResults.users.map((u) => (
                      <button
                        key={u.id}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-[#f5f3ef] transition-colors flex items-center justify-between"
                        style={{ color: "#3D3D3D" }}
                        onClick={() => {
                          router.push("/dashboard/customers");
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <span>{u.name}</span>
                        <span className="text-xs" style={{ color: "#6B7280" }}>
                          {u.phone}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-[#f5f3ef] outline-none">
            <Globe className="h-4 w-4" style={{ color: "#6B7280" }} />
            <span className="text-xs font-semibold" style={{ color: "#3D3D3D" }}>
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
        <DropdownMenu>
          <DropdownMenuTrigger className="relative flex items-center justify-center rounded-xl p-2 transition-colors hover:bg-[#f5f3ef] outline-none">
            <Bell className="h-5 w-5" style={{ color: "#6B7280" }} />
            {unreadCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: "#ef4444" }}
              >
                {unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: "#3D3D3D" }}>
                Notifications
              </span>
              <button
                className="text-[10px] font-medium hover:underline"
                style={{ color: "#F57C20" }}
                onClick={() => setUnreadCount(0)}
              >
                Tout marquer comme lu
              </button>
            </div>
            <DropdownMenuSeparator />
            {SIMULATED_NOTIFICATIONS.map((notif) => (
              <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-0.5 cursor-pointer px-3 py-2">
                <span className="text-xs" style={{ color: "#3D3D3D" }}>
                  {notif.text}
                </span>
                <span className="text-[10px]" style={{ color: "#6B7280" }}>
                  {notif.time}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs justify-center cursor-pointer"
              style={{ color: "#F57C20" }}
              onClick={() => alert("Fonctionnalite complete bientot disponible")}
            >
              Voir toutes les notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Settings shortcut */}
        <button
          className="hidden sm:flex items-center justify-center rounded-xl p-2 transition-colors hover:bg-[#f5f3ef]"
          aria-label={t("nav.settings")}
          onClick={() => router.push("/dashboard/settings")}
        >
          <Settings className="h-5 w-5" style={{ color: "#6B7280" }} />
        </button>

        {/* User avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-[#f5f3ef] outline-none">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: "#F57C20" }}
            >
              A
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold leading-none" style={{ color: "#3D3D3D" }}>
                Admin
              </p>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: "#6B7280" }}>
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
