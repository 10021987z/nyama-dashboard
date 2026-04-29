"use client";

// Cette route reste accessible pour rétrocompatibilité (anciens bookmarks).
// Le contenu vit désormais dans /dashboard/disputes (onglet "Mode crise").
import { CrisisPanel } from "@/components/disputes/crisis-panel";

export default function CrisisPage() {
  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            color: "#3D3D3D",
          }}
        >
          Mode Crise
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cette page est désormais intégrée au{" "}
          <a
            href="/dashboard/disputes?tab=crisis"
            className="underline font-medium"
          >
            Centre Litiges &amp; Crise
          </a>
          .
        </p>
      </div>
      <CrisisPanel />
    </div>
  );
}
