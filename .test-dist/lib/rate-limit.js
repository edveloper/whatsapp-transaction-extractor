"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRateLimited = isRateLimited;
exports.getClientKey = getClientKey;
// In-memory, per-instance rate limiting. This resets on cold start and isn't shared across
// serverless instances, so it's a best-effort speed bump, not a hard guarantee -- a real
// guarantee needs a shared store (Vercel KV / Upstash Redis) keyed by client IP. Still worth
// having: it stops a single warm instance from being hammered, and each request here can trigger
// up to 10 paid Gemini calls, so even partial protection matters.
const WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 5;
const hits = new Map();
function isRateLimited(key) {
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    hits.set(key, recent);
    // Cheap, occasional sweep so long-lived warm instances don't accumulate an unbounded number of
    // stale per-IP entries -- runs on a small fraction of requests rather than every one.
    if (Math.random() < 0.01) {
        for (const [k, timestamps] of hits) {
            if (timestamps.every((t) => now - t >= WINDOW_MS))
                hits.delete(k);
        }
    }
    return recent.length > MAX_REQUESTS_PER_WINDOW;
}
function getClientKey(request) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    return forwardedFor?.split(",")[0]?.trim() || "unknown";
}
