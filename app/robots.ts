import type { MetadataRoute } from "next"
import { ALLOW_INDEXING, SITE_URL } from "@/lib/indexing"

export default function robots(): MetadataRoute.Robots {
  const rules = { userAgent: "*", allow: "/", disallow: ["/api/"] }
  // The sitemap is only advertised once the site may be indexed; see lib/indexing.ts.
  if (!ALLOW_INDEXING) return { rules }
  return { rules, sitemap: `${SITE_URL}/sitemap.xml` }
}
