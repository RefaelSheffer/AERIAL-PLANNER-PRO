import { describe, it, expect, beforeEach } from "vitest";

// ── checkRateLimit ─────────────────────────────────────────────────

// rate_limit.ts uses a module-level Map, so we need a fresh import for
// isolation. We can use dynamic import + vi.resetModules, but since the
// Map is shared per module instance, we test the exported function directly
// and rely on unique keys per test.

import { checkRateLimit } from "@shared/rate_limit.ts";

describe("checkRateLimit", () => {
  it("allows the first request", () => {
    const key = `test-first-${Date.now()}`;
    const result = checkRateLimit(key, 5, 60_000);
    expect(result.allowed).toBe(true);
  });

  it("allows requests within the limit", () => {
    const key = `test-within-${Date.now()}`;
    checkRateLimit(key, 5, 60_000); // 1
    checkRateLimit(key, 5, 60_000); // 2
    checkRateLimit(key, 5, 60_000); // 3
    const result = checkRateLimit(key, 5, 60_000); // 4
    expect(result.allowed).toBe(true);
  });

  it("blocks requests exceeding the limit within the window", () => {
    const key = `test-exceed-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60_000);
    }
    const result = checkRateLimit(key, 5, 60_000); // 6th — should be blocked
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("allows requests after the window resets", () => {
    const key = `test-reset-${Date.now()}`;
    // Use a tiny window so it resets immediately
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 1); // 1ms window
    }
    // Wait for window to expire
    const start = Date.now();
    while (Date.now() - start < 5) {
      // busy-wait 5ms
    }
    const result = checkRateLimit(key, 5, 1);
    expect(result.allowed).toBe(true);
  });
});

// ── getClientIp ────────────────────────────────────────────────────

// security.ts calls Deno.env.get at module scope, so we need to provide
// a Deno shim before importing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).Deno = {
  env: {
    get: () => "",
  },
};

// Now we can import — the module-level parseAllowedOrigins() will run
// with our shim and produce an empty allowed-origins list.
const { getClientIp } = await import("@shared/security.ts");

describe("getClientIp", () => {
  it("extracts first IP from X-Forwarded-For header", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it('returns "unknown" when no forwarding headers are present', () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("unknown");
  });
});

// ── buildCorsHeaders ───────────────────────────────────────────────

import { buildCorsHeaders } from "@shared/cors.ts";

describe("buildCorsHeaders", () => {
  it("returns the correct origin in the header", () => {
    const headers = buildCorsHeaders("https://example.com");
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://example.com");
  });

  it("includes Vary: Origin", () => {
    const headers = buildCorsHeaders("https://example.com");
    expect(headers.Vary).toBe("Origin");
  });
});
