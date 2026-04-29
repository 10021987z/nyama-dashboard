import type { Metadata } from "next";
import { DownloadPage } from "../_components/DownloadPage";
import { APPS } from "@/lib/apps";

export const metadata: Metadata = {
  title: "Télécharger NYAMA — App client",
  description: "Téléchargez l'application Android NYAMA pour commander votre cuisine camerounaise.",
};

export default function Page() {
  return <DownloadPage app={APPS.client} />;
}
