import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { AmbientGlow } from "@/components/site/ambient-glow";
import { SITE } from "@/content/copy";
import { AnalyticsProvider } from "@/lib/analytics/client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Trace - Content from proof, not prompts.",
    template: "%s | Trace",
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: "Trace",
    title: "Trace - Content from proof, not prompts.",
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Trace - Content from proof, not prompts.",
    description: SITE.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AnalyticsProvider>
          <AmbientGlow />
          <Header />
          <main>{children}</main>
          <Footer />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
