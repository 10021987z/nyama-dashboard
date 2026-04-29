"use client";

import { useState } from "react";
import {
  Smartphone,
  Globe,
  Download,
  Copy,
  Check,
  ExternalLink,
  Send,
  QrCode,
  Users,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { APPS, type AppInfo, type AppRole } from "@/lib/apps";

const ROLES: AppRole[] = ["client", "pro", "rider"];
const ROLE_LABEL: Record<AppRole, string> = {
  client: "Client",
  pro: "Pro (cuisinière)",
  rider: "Rider (livreur)",
};

export default function AppsDistributionPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" style={{ color: "#F57C20" }} />
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-montserrat), system-ui, sans-serif",
              color: "#1B4332",
            }}
          >
            Distribution Apps
          </h1>
        </div>
        <p className="max-w-2xl text-sm text-black/60">
          Centre de distribution NYAMA — partagez les liens de téléchargement Android,
          envoyez la version web aux testeurs, et générez les QR codes prêts à coller dans
          WhatsApp.
        </p>
      </header>

      <Tabs defaultValue="apk" className="w-full">
        <TabsList>
          <TabsTrigger value="apk">
            <Smartphone className="mr-1 h-4 w-4" /> Android (APK)
          </TabsTrigger>
          <TabsTrigger value="web">
            <Globe className="mr-1 h-4 w-4" /> Versions Web
          </TabsTrigger>
          <TabsTrigger value="testers">
            <Users className="mr-1 h-4 w-4" /> Testeurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apk">
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {ROLES.map((role) => (
              <ApkAppCard key={role} app={APPS[role]} roleLabel={ROLE_LABEL[role]} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="web">
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {ROLES.map((role) => (
              <WebAppCard key={role} app={APPS[role]} roleLabel={ROLE_LABEL[role]} />
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-black/50">
            ⚠️ Les versions web ont des limites : pas de notifications push, GPS dégradé,
            pas de capture photo. Pour la meilleure expérience, partagez l&apos;APK.
          </p>
        </TabsContent>

        <TabsContent value="testers">
          <TestersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApkAppCard({ app, roleLabel }: { app: AppInfo; roleLabel: string }) {
  const [copied, setCopied] = useState(false);
  const downloadPageUrl = `https://nyama-dashboard.vercel.app/download/${app.role}`;

  const onCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copié dans le presse-papier`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge
              variant="secondary"
              className="mb-2"
              style={{ backgroundColor: app.primaryColorRgba, color: app.primaryColor }}
            >
              {roleLabel}
            </Badge>
            <CardTitle
              className="text-lg"
              style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif" }}
            >
              {app.name}
            </CardTitle>
            <p className="mt-1 text-xs text-black/55">{app.tagline}</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-[10px] text-black/40">
            <span>v{app.version}</span>
            <span>{app.apkSizeMB} MB</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex justify-center">
          <div
            className="rounded-xl p-2.5"
            style={{ backgroundColor: app.primaryColorRgba }}
          >
            <div className="rounded-lg bg-white p-2.5">
              <QRCodeCanvas
                value={downloadPageUrl}
                size={120}
                level="M"
                fgColor={app.primaryColor}
                bgColor="#ffffff"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-black/40">
              <QrCode className="h-3 w-3" /> Page de téléchargement
            </label>
            <div className="flex gap-1.5">
              <Input
                readOnly
                value={downloadPageUrl}
                className="h-8 flex-1 text-xs"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onCopy(downloadPageUrl, "Lien")}
                aria-label="Copier le lien"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-black/40">
              <Download className="h-3 w-3" /> APK direct
            </label>
            <div className="flex gap-1.5">
              <Input
                readOnly
                value={app.apkUrl}
                className="h-8 flex-1 text-xs"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onCopy(app.apkUrl, "Lien APK")}
                aria-label="Copier l'APK"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <a
            href={downloadPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonVariants({ size: "sm" })} w-full text-white`}
            style={{
              background: `linear-gradient(135deg, ${app.primaryColor}, ${app.primaryColor}dd)`,
            }}
          >
            <ExternalLink className="mr-1 h-3.5 w-3.5" /> Voir la page publique
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Salut ! Voici l'app NYAMA ${roleLabel} à installer : ${downloadPageUrl}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonVariants({ size: "sm", variant: "outline" })} w-full`}
          >
            <Send className="mr-1 h-3.5 w-3.5" /> Partager via WhatsApp
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function WebAppCard({ app, roleLabel }: { app: AppInfo; roleLabel: string }) {
  const onCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("URL web copiée");
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <Badge
          variant="secondary"
          className="mb-2 w-fit"
          style={{ backgroundColor: app.primaryColorRgba, color: app.primaryColor }}
        >
          {roleLabel}
        </Badge>
        <CardTitle
          className="flex items-center gap-2 text-lg"
          style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif" }}
        >
          <Globe className="h-4 w-4" style={{ color: app.primaryColor }} />
          {app.name} Web
        </CardTitle>
        <p className="mt-1 text-xs text-black/55">{app.tagline}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
            URL
          </label>
          <div className="flex gap-1.5">
            <Input
              readOnly
              value={app.webUrl}
              className="h-8 flex-1 text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onCopy(app.webUrl)}
              aria-label="Copier l'URL"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div
          className="rounded-lg border border-dashed p-3 text-[11px] leading-relaxed text-black/55"
          style={{ borderColor: `${app.primaryColor}40` }}
        >
          <p className="font-semibold text-black/70">Compte test</p>
          <p>{app.testAccount.name}</p>
          <p className="font-mono">{app.testAccount.phone}</p>
          <p className="font-mono">OTP : {app.testAccount.otp}</p>
        </div>

        <a
          href={app.webUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonVariants({ size: "sm" })} mt-auto w-full text-white`}
          style={{
            background: `linear-gradient(135deg, ${app.primaryColor}, ${app.primaryColor}dd)`,
          }}
        >
          <ExternalLink className="mr-1 h-3.5 w-3.5" /> Tester en ligne
        </a>
      </CardContent>
    </Card>
  );
}

function TestersTab() {
  return (
    <div className="mt-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comptes de test</CardTitle>
          <p className="text-xs text-black/55">
            Identifiants partageables avec vos testeurs Cameroun (Phase 1 pilote).
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {ROLES.map((role) => {
              const a = APPS[role];
              return (
                <div
                  key={role}
                  className="rounded-lg border border-black/5 p-3"
                  style={{ backgroundColor: a.primaryColorRgba }}
                >
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: "#ffffff", color: a.primaryColor }}
                  >
                    {ROLE_LABEL[role]}
                  </Badge>
                  <p className="mt-2 text-sm font-semibold text-black/80">
                    {a.testAccount.name}
                  </p>
                  <p className="mt-1 font-mono text-[12px] text-black/65">
                    {a.testAccount.phone}
                  </p>
                  <p className="font-mono text-[12px] text-black/65">
                    OTP : {a.testAccount.otp}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statistiques de distribution</CardTitle>
          <p className="text-xs text-black/55">
            En attente de l&apos;endpoint <code>/admin/apps/stats</code> (V2).
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-black/15 p-6 text-center text-xs text-black/40">
            Le suivi du nombre de téléchargements et de testeurs actifs sera affiché ici
            une fois l&apos;endpoint backend disponible.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
