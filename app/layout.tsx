import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TransactionExtract - WhatsApp to CSV",
  description: "Extract financial transactions from WhatsApp exports into organized CSV files",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {/* FIX: Added overflow-x-hidden to prevent body scroll when fixed elements are positioned near the edge */}
      <body className={`font-sans antialiased overflow-x-hidden`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}