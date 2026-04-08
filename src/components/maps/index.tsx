"use client";

import dynamic from "next/dynamic";
export type { MapMarker } from "./leaflet-map";

// Leaflet must not run on the server
export const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 500,
        width: "100%",
        borderRadius: 16,
        backgroundColor: "#f5f3ef",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#6B7280",
        fontSize: 13,
      }}
    >
      Chargement de la carte…
    </div>
  ),
});
