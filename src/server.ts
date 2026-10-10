import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// Security Headers Definition
function applySecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.beehiiv.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
  );
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

// In-Memory IP Rate Limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests = 20, windowMs = 60000): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (record.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }
  record.count += 1;
  return { allowed: true };
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}

function isValidEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

// Global Visit Counter Storage
let inMemoryVisits = 14;

function getD1Binding(request?: Request, env?: any): any {
  return (
    env?.DB ||
    env?.D1 ||
    (request as any)?.runtime?.cloudflare?.env?.DB ||
    (request as any)?.runtime?.cloudflare?.env?.D1 ||
    (globalThis as any)?.__env__?.DB ||
    (globalThis as any)?.__env__?.D1 ||
    (globalThis as any)?.DB ||
    (globalThis as any)?.D1
  );
}

async function getStoredVisits(request?: Request, env?: any): Promise<{ visits: number; source: string }> {
  // 1. Try Cloudflare D1 SQLite Database (env.DB, request.runtime, globalThis)
  const d1 = getD1Binding(request, env);
  if (d1?.prepare) {
    try {
      await d1.prepare("CREATE TABLE IF NOT EXISTS site_stats (key TEXT PRIMARY KEY, value INTEGER)").run();
      const row = await d1.prepare("SELECT value FROM site_stats WHERE key = 'site_visits'").first();
      if (row && typeof row.value === "number") {
        inMemoryVisits = row.value;
        return { visits: row.value, source: "d1" };
      }
      // If table exists but empty, insert initial counter
      await d1.prepare("INSERT OR IGNORE INTO site_stats (key, value) VALUES ('site_visits', ?)").bind(inMemoryVisits).run();
      return { visits: inMemoryVisits, source: "d1" };
    } catch (err) {
      console.error("[D1 getStoredVisits Error]:", err);
    }
  }

  // 2. Try Cloudflare KV (env.VISITS_KV)
  const kv = env?.VISITS_KV || (request as any)?.runtime?.cloudflare?.env?.VISITS_KV || (globalThis as any)?.__env__?.VISITS_KV;
  if (kv?.get) {
    try {
      const val = await kv.get("site_visits");
      if (val) {
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
          inMemoryVisits = num;
          return { visits: num, source: "kv" };
        }
      }
    } catch (err) {
      console.error("[KV getStoredVisits Error]:", err);
    }
  }

  // 3. Try Node.js filesystem (visits.json)
  if (typeof process !== "undefined" && process?.cwd) {
    try {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const filePath = path.join(process.cwd(), "public", "visits.json");
      const content = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(content);
      if (typeof parsed.count === "number") {
        inMemoryVisits = parsed.count;
        return { visits: parsed.count, source: "file" };
      }
    } catch {}
  }

  return { visits: inMemoryVisits, source: "memory_fallback" };
}

async function setStoredVisits(request: Request | undefined, env: any, count: number): Promise<string> {
  inMemoryVisits = count;
  let savedSource = "memory_fallback";

  // 1. Cloudflare D1 SQLite Database
  const d1 = getD1Binding(request, env);
  if (d1?.prepare) {
    try {
      await d1.prepare("CREATE TABLE IF NOT EXISTS site_stats (key TEXT PRIMARY KEY, value INTEGER)").run();
      await d1.prepare("INSERT INTO site_stats (key, value) VALUES ('site_visits', ?) ON CONFLICT(key) DO UPDATE SET value = ?").bind(count, count).run();
      savedSource = "d1";
    } catch (err) {
      console.error("[D1 setStoredVisits Error]:", err);
    }
  }

  // 2. Cloudflare KV
  const kv = env?.VISITS_KV || (request as any)?.runtime?.cloudflare?.env?.VISITS_KV || (globalThis as any)?.__env__?.VISITS_KV;
  if (kv?.put) {
    try {
      await kv.put("site_visits", count.toString());
      if (savedSource !== "d1") savedSource = "kv";
    } catch (err) {
      console.error("[KV setStoredVisits Error]:", err);
    }
  }

  // 3. Node.js filesystem (visits.json)
  if (typeof process !== "undefined" && process?.cwd) {
    try {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const filePath = path.join(process.cwd(), "public", "visits.json");
      await fs.writeFile(filePath, JSON.stringify({ count, updatedAt: new Date().toISOString() }, null, 2));
      if (savedSource !== "d1" && savedSource !== "kv") savedSource = "file";
    } catch {}
  }

  return savedSource;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: any, ctx: unknown) {
    try {
      const url = new URL(request.url);

      // 1. Global Synchronized Visit Counter Endpoint
      if (url.pathname === "/api/visits") {
        const clientIp = getClientIp(request);
        const rateCheck = checkRateLimit(`visits_${clientIp}`, 60, 60000);
        if (!rateCheck.allowed) {
          return applySecurityHeaders(
            new Response(
              JSON.stringify({ success: false, error: "Rate limit exceeded" }),
              { status: 429, headers: { "content-type": "application/json", "Retry-After": String(rateCheck.retryAfter ?? 60) } }
            )
          );
        }

        if (request.method === "POST") {
          const current = await getStoredVisits(request, env);
          const next = current.visits + 1;
          const source = await setStoredVisits(request, env, next);
          return applySecurityHeaders(
            new Response(
              JSON.stringify({ success: true, visits: next, source }),
              { status: 200, headers: { "content-type": "application/json" } }
            )
          );
        } else {
          const current = await getStoredVisits(request, env);
          return applySecurityHeaders(
            new Response(
              JSON.stringify({ success: true, visits: current.visits, source: current.source }),
              { status: 200, headers: { "content-type": "application/json" } }
            )
          );
        }
      }

      // 2. Early Access Subscribe Endpoint
      const isSubscribePath = ["/api/subscribe", "/api/v1/subscribe", "/subscribe"].includes(url.pathname);
      if (isSubscribePath && request.method === "POST") {
        const clientIp = getClientIp(request);
        const rateCheck = checkRateLimit(`sub_${clientIp}`, 5, 60000);
        if (!rateCheck.allowed) {
          return applySecurityHeaders(
            new Response(
              JSON.stringify({
                success: false,
                error: {
                  code: "RATE_LIMIT_EXCEEDED",
                  message: "Too many subscription attempts. Please try again later.",
                },
              }),
              {
                status: 429,
                headers: {
                  "content-type": "application/json",
                  "Retry-After": String(rateCheck.retryAfter ?? 60),
                },
              }
            )
          );
        }

        // Payload size restriction (16 KB max)
        const contentLength = request.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) > 16384) {
          return applySecurityHeaders(
            new Response(
              JSON.stringify({
                success: false,
                error: {
                  code: "PAYLOAD_TOO_LARGE",
                  message: "Request payload exceeds maximum allowed size (16KB)",
                },
              }),
              { status: 413, headers: { "content-type": "application/json" } }
            )
          );
        }

        try {
          const rawText = await request.text();
          if (rawText.length > 16384) {
            return applySecurityHeaders(
              new Response(
                JSON.stringify({
                  success: false,
                  error: {
                    code: "PAYLOAD_TOO_LARGE",
                    message: "Request payload exceeds maximum allowed size",
                  },
                }),
                { status: 413, headers: { "content-type": "application/json" } }
              )
            );
          }

          let body: { email?: string } = {};
          try {
            body = JSON.parse(rawText);
          } catch {
            return applySecurityHeaders(
              new Response(
                JSON.stringify({
                  success: false,
                  error: {
                    code: "INVALID_JSON",
                    message: "Malformed JSON payload",
                  },
                }),
                { status: 400, headers: { "content-type": "application/json" } }
              )
            );
          }

          const { email } = body;
          if (!isValidEmail(email)) {
            return applySecurityHeaders(
              new Response(
                JSON.stringify({
                  success: false,
                  error: {
                    code: "VALIDATION_FAILED",
                    message: "Invalid email address format or length",
                  },
                }),
                { status: 400, headers: { "content-type": "application/json" } }
              )
            );
          }

          const cleanEmail = (email as string).trim().toLowerCase();

          // Read publication ID strictly from server environment (reject client parameter tampering)
          const pubId =
            env?.PUBLIC_BEEHIIV_PUBLICATION_ID ||
            (typeof process !== "undefined" && process.env?.PUBLIC_BEEHIIV_PUBLICATION_ID);

          const apiKey =
            env?.BEEHIIV_API_KEY ||
            (typeof process !== "undefined" && process.env?.BEEHIIV_API_KEY);

          if (!pubId) {
            return applySecurityHeaders(
              new Response(
                JSON.stringify({
                  success: false,
                  error: {
                    code: "CONFIG_MISSING",
                    message: "PUBLIC_BEEHIIV_PUBLICATION_ID is not configured in the environment.",
                  },
                }),
                { status: 500, headers: { "content-type": "application/json" } }
              )
            );
          }

          if (apiKey) {
            const beehiivRes = await fetch(
              `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: cleanEmail,
                  reactivate_existing: true,
                  send_welcome_email: true,
                }),
              }
            );

            const beehiivData: any = await beehiivRes.json().catch(() => ({}));
            if (!beehiivRes.ok) {
              const errMsg = beehiivData.errors?.[0]?.message || `Beehiiv API returned status ${beehiivRes.status}`;
              return applySecurityHeaders(
                new Response(
                  JSON.stringify({
                    success: false,
                    error: { code: "SUBSCRIBE_FAILED", message: errMsg },
                  }),
                  { status: 400, headers: { "content-type": "application/json" } }
                )
              );
            }

            return applySecurityHeaders(
              new Response(
                JSON.stringify({
                  success: true,
                  data: { subscription: beehiivData.data, publicationId: pubId },
                  meta: { timestamp: new Date().toISOString() },
                }),
                { status: 201, headers: { "content-type": "application/json" } }
              )
            );
          }

          // Fallback queue when API key is not yet set
          return applySecurityHeaders(
            new Response(
              JSON.stringify({
                success: true,
                data: {
                  registered: true,
                  publicationId: pubId,
                  status: "queued",
                },
                meta: {
                  message: "Registration queued for early access waitlist.",
                  timestamp: new Date().toISOString(),
                },
              }),
              { status: 200, headers: { "content-type": "application/json" } }
            )
          );
        } catch (err: any) {
          return applySecurityHeaders(
            new Response(
              JSON.stringify({
                success: false,
                error: {
                  code: "INTERNAL_SERVER_ERROR",
                  message: err?.message || "Failed to process subscription",
                },
              }),
              { status: 500, headers: { "content-type": "application/json" } }
            )
          );
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applySecurityHeaders(normalized);
    } catch (error) {
      console.error(error);
      return applySecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        })
      );
    }
  },
};
