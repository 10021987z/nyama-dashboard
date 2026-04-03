"use client";

import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Admin profile */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">👤 Profil Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Téléphone</span>
            <span className="text-sm font-medium">{user?.phone ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Rôle</span>
            <Badge className="bg-purple-100 text-purple-700">ADMIN</Badge>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Pour modifier votre profil, contactez le support NYAMA.
          </p>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">🔧 Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">API Backend</span>
            <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
              http://localhost:3000/api/v1
            </code>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Base de données</span>
            <Badge variant="secondary">SQLite (développement)</Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Environnement</span>
            <Badge className="bg-yellow-100 text-yellow-800">
              Développement
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">ℹ️ À propos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">
              NYAMA Dashboard
            </span>{" "}
            v1.0.0
          </p>
          <p>Backend : NestJS + Prisma</p>
          <p>Frontend : Next.js 14 + Tailwind + shadcn/ui</p>
          <p className="pt-2 text-xs border-t">
            © 2026 NYAMA — La cuisine camerounaise, livrée chez vous
          </p>
        </CardContent>
      </Card>

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="w-full h-12 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
      >
        Se déconnecter
      </button>
    </div>
  );
}
