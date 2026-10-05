import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import CustomerSupportButton from "@/components/CustomerSupportButton";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://afriloan.com"),
  title: "AfriLoan | Vos projets, notre priorité - Prêt en ligne en Afrique",
  description: "Plateforme africaine de prêt en ligne rapide et sécurisée. Prêts à montant fixe et prêts personnalisés déboursés directement sur Orange Money, MTN MoMo, Wave et Airtel Money.",
  icons: {
    icon: "/icon.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "AfriLoan | Vos projets, notre priorité",
    description: "Accédez rapidement à des financements adaptés à vos besoins. Déboursement immédiat sur Mobile Money.",
    url: "https://afriloan.com",
    siteName: "AfriLoan",
    images: [
      {
        url: "/logo-tagline.png",
        width: 800,
        height: 800,
        alt: "AfriLoan Logo",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AfriLoan | Vos projets, notre priorité",
    description: "Financement en ligne simple, rapide et accessible en Afrique via Mobile Money.",
    images: ["/logo-tagline.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AfriLoan",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="afriloan" className="scroll-smooth">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>

        {/* Dynamic WhatsApp Customer Support Button (assigned agent vs global) */}
        <CustomerSupportButton />

        {/* PWA Mobile Installation Prompt */}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
