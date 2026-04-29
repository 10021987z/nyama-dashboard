export type AppRole = "client" | "pro" | "rider";

export interface AppInfo {
  role: AppRole;
  name: string;
  tagline: string;
  description: string;
  apkUrl: string;
  apkSizeMB: number;
  webUrl: string;
  version: string;
  primaryColor: string;
  primaryColorRgba: string;
  accentColor: string;
  testAccount: { phone: string; otp: string; name: string };
}

const BLOB_BASE = "https://lxeznc26nrvudkyq.public.blob.vercel-storage.com/apks";

export const APPS: Record<AppRole, AppInfo> = {
  client: {
    role: "client",
    name: "NYAMA",
    tagline: "Commandez votre cuisine camerounaise",
    description:
      "Découvrez les meilleures cuisinières du Cameroun, suivez votre commande en temps réel et payez en mobile money.",
    apkUrl: `${BLOB_BASE}/nyama-client.apk`,
    apkSizeMB: 66,
    webUrl: "https://nyama-client-web.vercel.app",
    version: "1.0.0",
    primaryColor: "#F57C20",
    primaryColorRgba: "rgba(245, 124, 32, 0.12)",
    accentColor: "#1B4332",
    testAccount: { phone: "+237 6 80 00 00 01", otp: "000000", name: "Fabrice (test)" },
  },
  pro: {
    role: "pro",
    name: "NYAMA Pro",
    tagline: "L'app des cuisinières NYAMA",
    description:
      "Gérez vos commandes, votre menu et vos revenus. Recevez des alertes sonores fortes pour ne rater aucune commande.",
    apkUrl: `${BLOB_BASE}/nyama-pro.apk`,
    apkSizeMB: 61,
    webUrl: "https://nyama-pro-web.vercel.app",
    version: "1.0.0",
    primaryColor: "#1B4332",
    primaryColorRgba: "rgba(27, 67, 50, 0.12)",
    accentColor: "#F57C20",
    testAccount: { phone: "+237 6 80 00 00 02", otp: "000000", name: "Catherine (test)" },
  },
  rider: {
    role: "rider",
    name: "NYAMA Rider",
    tagline: "L'app des livreurs benskineurs",
    description:
      "Acceptez les courses près de vous, naviguez vers le restaurant puis le client, et suivez vos gains au jour le jour.",
    apkUrl: `${BLOB_BASE}/nyama-rider.apk`,
    apkSizeMB: 63,
    webUrl: "https://nyama-rider-web.vercel.app",
    version: "1.0.0",
    primaryColor: "#D4A017",
    primaryColorRgba: "rgba(212, 160, 23, 0.12)",
    accentColor: "#1B4332",
    testAccount: { phone: "+237 6 80 00 00 03", otp: "000000", name: "Kevin (test)" },
  },
};
