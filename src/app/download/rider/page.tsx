import type { Metadata } from "next";
import { DownloadPage } from "../_components/DownloadPage";
import { APPS } from "@/lib/apps";

export const metadata: Metadata = {
  title: "Télécharger NYAMA Rider — App livreur",
  description: "Téléchargez NYAMA Rider pour accepter des courses et livrer.",
};

export default function Page() {
  return <DownloadPage app={APPS.rider} />;
}
