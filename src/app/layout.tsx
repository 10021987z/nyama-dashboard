import type { Metadata } from "next";
import { Montserrat, Nunito_Sans, Space_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NYAMA Dashboard — Administration",
  description: "Tableau de bord de la marketplace NYAMA · Cuisine camerounaise",
  icons: {
    icon: [
      { url: "/nyama-logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/nyama-logo.svg",
    apple: "/nyama-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${montserrat.variable} ${nunitoSans.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
