"use client";

import { LiveDataProvider } from "@/components/command-center/live-data-provider";
import { TopBar } from "@/components/command-center/top-bar";
import { MetricsColumn } from "@/components/command-center/metrics-column";
import { MapColumn } from "@/components/command-center/map-column";
import { EventFeedColumn } from "@/components/command-center/event-feed-column";

/**
 * Executive Command Center — the main dashboard.
 *
 * Layout:
 *   ┌──────────────────── top bar (actions + connection) ────────────────────┐
 *   │                                                                        │
 *   ├───── metrics (30%) ───┬────── live map (40%) ───────┬── feed (30%) ───┤
 *   │                       │                             │                   │
 *
 * All three columns are powered by a single `LiveDataProvider` that handles
 * the socket connection + HTTP polling fallback against Agent A's
 * /admin/live/* endpoints.
 */
export default function DashboardPage() {
  return (
    <LiveDataProvider>
      <div className="flex flex-col gap-4 pb-6">
        <TopBar />

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-10">
          {/* LEFT — metrics (30%) */}
          <div className="lg:col-span-3">
            <MetricsColumn />
          </div>

          {/* CENTER — map (40%) */}
          <div className="lg:col-span-4 min-h-[560px]">
            <MapColumn />
          </div>

          {/* RIGHT — feed (30%) */}
          <div className="lg:col-span-3 min-h-[560px] lg:max-h-[calc(100vh-9rem)]">
            <EventFeedColumn />
          </div>
        </div>
      </div>
    </LiveDataProvider>
  );
}
