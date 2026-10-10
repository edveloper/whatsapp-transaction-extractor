import type React from "react"
import type { Metadata } from "next"
import { Fredoka, Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { ALLOW_INDEXING, SITE_URL } from "@/lib/indexing"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })
// .variable (not .className): this only needs to make the "Geist Mono" face available for the
// font-mono utility (used selectively, e.g. the Amount column) -- it must not set body's default
// font-family, which .className would do and silently override Geist Sans below.
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
// Chunky, rounded display face for headings only, via the font-display utility -- body copy stays
// on Geist for readability.
const fredoka = Fredoka({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-fredoka" })

// "daftari" is lowercase on purpose; everything after it is Title Case.
const title = "daftari - WhatsApp Money, Kept Properly"
const description = "Every shilling, written down. Extract financial transactions from WhatsApp exports into a clean ledger."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  applicationName: "daftari",
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: "/",
    type: "website",
    siteName: "daftari",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  // icon.svg, apple-icon.png and favicon.ico in app/ are picked up by Next on their own.
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "daftari", statusBarStyle: "default" },
  robots: ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false },
}

// What daftari is, for search engines, once it may be indexed.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "daftari",
  url: `${SITE_URL}/`,
  description,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KES" },
  author: { "@type": "Person", name: "Eddie Ezekiel Ochieng", url: "https://eddie-ezekiel.com" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {/* overflow-x-hidden: the sticky header and analytics cards can render fixed elements
          slightly past the viewport edge on narrow screens without it. */}
      <body className={`${geist.className} ${geistMono.variable} ${fredoka.variable} antialiased overflow-x-hidden`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
