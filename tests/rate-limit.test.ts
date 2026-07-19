import test from "node:test"
import assert from "node:assert/strict"
import { getClientKey, isRateLimited } from "../lib/rate-limit"

test("isRateLimited allows up to the limit then blocks the next request", () => {
  const key = `test-allow-${Math.random()}`
  const results = Array.from({ length: 6 }, () => isRateLimited(key))
  assert.deepEqual(results, [false, false, false, false, false, true])
})

test("isRateLimited tracks distinct keys independently", () => {
  const keyA = `test-a-${Math.random()}`
  const keyB = `test-b-${Math.random()}`
  for (let i = 0; i < 5; i++) assert.equal(isRateLimited(keyA), false)
  assert.equal(isRateLimited(keyB), false, "a fresh key should not inherit another key's count")
})

test("getClientKey reads the first address from x-forwarded-for", () => {
  const request = new Request("https://example.com", { headers: { "x-forwarded-for": "203.0.113.4, 10.0.0.1" } })
  assert.equal(getClientKey(request), "203.0.113.4")
})

test("getClientKey falls back when no forwarding header is present", () => {
  const request = new Request("https://example.com")
  assert.equal(getClientKey(request), "unknown")
})
