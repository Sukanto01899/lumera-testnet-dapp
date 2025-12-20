import type { Metadata } from "next";

import "./globals.css";
import { WalletProviders } from "@/providers/wallet-providers";

import { Archivo_Black, Space_Grotesk } from "next/font/google";
import AppShell from "@/components/layout/AppShell";

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-head",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumera Lend",
  description: "Stake, manage, and interact with Lumera Lend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${archivoBlack.variable} ${space.variable}`}>
        <WalletProviders>
          <AppShell>{children}</AppShell>
        </WalletProviders>
      </body>
    </html>
  );
}
