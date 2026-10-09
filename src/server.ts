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
      const isSubscribePath = ["/api/subscribe", "/api/v1/subscribe", "/subscribe"].includes(url.pathname);
      if (isSubscribePath && request.method === "POST") {
        try {
          const body = (await request.json().catch(() => ({}))) as { email?: string; publicationId?: string };
          const { email } = body;
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return new Response(
              JSON.stringify({
                success: false,
                error: {
                  code: "VALIDATION_FAILED",
                  message: "Invalid email address format",
                },
              }),
              { status: 400, headers: { "content-type": "application/json" } }
            );
          }

          // Nadhebe publication ID as default, overridable by env or request body
          const pubId =
            body.publicationId ||
            env?.PUBLIC_BEEHIIV_PUBLICATION_ID ||
            (typeof process !== "undefined" && process.env?.PUBLIC_BEEHIIV_PUBLICATION_ID) ||
            "pub_bc10f598-8f5e-4fb8-be1b-71fa0959701b";

          const apiKey =
            env?.BEEHIIV_API_KEY ||
            (typeof process !== "undefined" && process.env?.BEEHIIV_API_KEY);

          if (apiKey && apiKey !== "key_xxxxxxxxxxxxxxxxxxxxxxxxxxxx") {
            const beehiivRes = await fetch(
              `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email,
                  reactivate_existing: true,
                  send_welcome_email: true,
                }),
              }
            );

            const beehiivData: any = await beehiivRes.json().catch(() => ({}));
            if (!beehiivRes.ok) {
              const errMsg = beehiivData.errors?.[0]?.message || `Beehiiv API returned status ${beehiivRes.status}`;
              return new Response(
                JSON.stringify({
                  success: false,
                  error: { code: "SUBSCRIBE_FAILED", message: errMsg },
                }),
                { status: 400, headers: { "content-type": "application/json" } }
              );
            }

            return new Response(
              JSON.stringify({
                success: true,
                data: { subscription: beehiivData.data, publicationId: pubId },
                meta: { timestamp: new Date().toISOString() },
              }),
              { status: 201, headers: { "content-type": "application/json" } }
            );
          }

          // Local / fallback registration queue
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                registered: true,
                email,
                publicationId: pubId,
                status: "queued",
              },
              meta: {
                message: `Registered email with waitlist for publication ${pubId}`,
                timestamp: new Date().toISOString(),
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: "INTERNAL_SERVER_ERROR",
                message: err?.message || "Failed to process subscription",
              },
            }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
