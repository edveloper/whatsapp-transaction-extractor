import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/indexing"

/** One page: the extractor itself. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/`, lastModified: new Date("2026-10-10"), changeFrequency: "monthly", priority: 1 }]
}
