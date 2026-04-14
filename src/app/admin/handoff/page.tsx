"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminHandoffPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Authentification...");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const match = hash.match(/token=([^&]+)/);
    if (!match) {
      setStatus("Aucun jeton reçu. Redirection...");
      router.replace("/login");
      return;
    }
    const token = decodeURIComponent(match[1]);
    localStorage.setItem("nyama_admin_token", token);
    window.history.replaceState(null, "", window.location.pathname);
    setStatus("Connecté — redirection vers le dashboard...");
    router.replace("/dashboard");
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4" />
        <p className="text-gray-600">{status}</p>
      </div>
    </main>
  );
}
