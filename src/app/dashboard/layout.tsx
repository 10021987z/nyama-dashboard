"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CommandPalette } from "@/components/layout/command-palette";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context";
import { useAuth } from "@/hooks/use-auth";
import { LanguageProvider } from "@/lib/i18n";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { collapsed } = useSidebar();

  // Cmd+K / Ctrl+K to open palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "#fbf9f5" }}
    >
      <aside
        className={`hidden lg:flex lg:flex-col lg:shrink-0 transition-all duration-200 ${
          collapsed ? "lg:w-[72px]" : "lg:w-60"
        }`}
      >
        <Sidebar />
      </aside>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={user}
          onMenuClick={() => setMobileOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <div className="px-4 lg:px-6 pt-3">
          <Breadcrumbs />
        </div>
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <SidebarProvider>
        <DashboardShell>{children}</DashboardShell>
      </SidebarProvider>
    </LanguageProvider>
  );
}
