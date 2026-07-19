import type React from "react"
import type { Metadata } from "next"
import { Fredoka, Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })
// .variable (not .className): this only needs to make the "Geist Mono" face available for the
// font-mono utility (used selectively, e.g. the Amount column) -- it must not set body's default
// font-family, which .className would do and silently override Geist Sans below.
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
// Chunky, rounded display face for headings only, via the font-display utility -- body copy stays
// on Geist for readability.
const fredoka = Fredoka({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-fredoka" })

const title = "daftari - WhatsApp money, kept properly"
const description = "Every shilling, written down. Extract financial transactions from WhatsApp exports into a clean ledger."

export const metadata: Metadata = {
  metadataBase: new URL("https://whatsapp-transaction-extractor.vercel.app"),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "daftari",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
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
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
