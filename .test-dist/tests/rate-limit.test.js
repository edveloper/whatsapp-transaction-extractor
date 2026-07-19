"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const rate_limit_1 = require("../lib/rate-limit");
(0, node_test_1.default)("isRateLimited allows up to the limit then blocks the next request", () => {
    const key = `test-allow-${Math.random()}`;
    const results = Array.from({ length: 6 }, () => (0, rate_limit_1.isRateLimited)(key));
    strict_1.default.deepEqual(results, [false, false, false, false, false, true]);
});
(0, node_test_1.default)("isRateLimited tracks distinct keys independently", () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;
    for (let i = 0; i < 5; i++)
        strict_1.default.equal((0, rate_limit_1.isRateLimited)(keyA), false);
    strict_1.default.equal((0, rate_limit_1.isRateLimited)(keyB), false, "a fresh key should not inherit another key's count");
});
(0, node_test_1.default)("getClientKey reads the first address from x-forwarded-for", () => {
    const request = new Request("https://example.com", { headers: { "x-forwarded-for": "203.0.113.4, 10.0.0.1" } });
    strict_1.default.equal((0, rate_limit_1.getClientKey)(request), "203.0.113.4");
});
(0, node_test_1.default)("getClientKey falls back when no forwarding header is present", () => {
    const request = new Request("https://example.com");
    strict_1.default.equal((0, rate_limit_1.getClientKey)(request), "unknown");
});
