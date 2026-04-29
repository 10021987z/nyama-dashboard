import type { Metadata } from "next";
import { DownloadPage } from "../_components/DownloadPage";
import { APPS } from "@/lib/apps";

export const metadata: Metadata = {
  title: "Télécharger NYAMA Pro — App cuisinière",
  description: "Téléchargez NYAMA Pro pour gérer vos commandes et votre menu.",
};

export default function Page() {
  return <DownloadPage app={APPS.pro} />;
}
