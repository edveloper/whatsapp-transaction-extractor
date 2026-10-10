/**
 * daftari stays out of search results until it has its own domain and is ready
 * to be found. Set NEXT_PUBLIC_ALLOW_INDEXING=true in Vercel (Production) to
 * open it up, and NEXT_PUBLIC_SITE_URL to the new domain when it moves.
 *
 * While hidden, crawling stays open on purpose: every response carries noindex,
 * and a crawler has to be able to read it for anything already indexed to drop.
 */
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true"

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://whatsapp-transaction-extractor.vercel.app"
).replace(/\/$/, "")
