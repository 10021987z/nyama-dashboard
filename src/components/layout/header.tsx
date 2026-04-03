"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PAGE_TITLES } from "@/lib/constants";
import { logout } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";

interface HeaderProps {
  user: AuthUser | null;
  onMenuClick: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  const initials = user?.phone
    ? user.phone.slice(-4).toUpperCase()
    : "AD";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
      {/* Left: burger (mobile) + page title */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden rounded-md p-2 hover:bg-gray-100 transition-colors"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      </div>

      {/* Right: notifications + user menu */}
      <div className="flex items-center gap-2">
        <button className="relative rounded-md p-2 hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-100 transition-colors outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback
                className="text-white text-xs font-bold"
                style={{ backgroundColor: "#1B4332" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium leading-none">Administrateur</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user?.phone ?? ""}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
