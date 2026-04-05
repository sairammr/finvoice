import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import { SmoothScroll } from "@/components/smooth-scroll";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const melodrame = localFont({
  src: "./fonts/melodrame/melodrame.ttf",
  variable: "--font-melodrame",
  display: "swap",
});

/** Social / link-preview image (`public/banner.png`) */
const embedImage = {
  url: "/banner.png",
  width: 2856,
  height: 1774,
  alt: "Finvoice — Turn unpaid invoices into instant capital",
} as const;

export const metadata: Metadata = {
  title: "Finvoice - Private Invoice Factoring on Flare + Hedera",
  description:
    "One click turns invoices into yield. Suppliers create invoices, debtors approve via PDF, AI scores them on a sovereign chain, and funders earn yield on a public marketplace. Private data never leaks.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Finvoice - Private Invoice Factoring on Flare + Hedera",
    description:
      "One click turns invoices into yield. Private invoice factoring with AI risk scoring on sovereign chains.",
    images: [embedImage],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Finvoice - Private Invoice Factoring on Flare + Hedera",
    description:
      "One click turns invoices into yield. Private data never leaks.",
    images: [embedImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${melodrame.variable} antialiased`}
    >
      <body className="flex flex-col font-sans">
        <Providers>
          <SmoothScroll>{children}</SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}
