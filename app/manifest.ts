import type { MetadataRoute } from "next"

/** Lets daftari be added to a phone's home screen and open like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "daftari",
    short_name: "daftari",
    description: "Every shilling, written down. Extract financial transactions from WhatsApp exports into a clean ledger.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5EFDD",
    theme_color: "#1F7A4D",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
