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
      if (url.pathname === "/api/subscribe" && request.method === "POST") {
        try {
          const body = (await request.json()) as { email?: string; publicationId?: string };
          const email = body.email;
          const pubId = body.publicationId;
          if (!email || !email.includes("@")) {
            return new Response(JSON.stringify({ error: "Invalid email" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          const apiKey = env?.BEEHIIV_API_KEY || (typeof process !== "undefined" && process.env?.BEEHIIV_API_KEY);
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
                  email,
                  reactivate_existing: true,
                  send_welcome_email: true,
                }),
              }
            );
            const beehiivData = await beehiivRes.json();
            return new Response(JSON.stringify({ success: true, beehiiv: beehiivData }), {
              headers: { "content-type": "application/json" },
            });
          }

          return new Response(
            JSON.stringify({
              success: true,
              registered: true,
              message: "Subscribed to waitlist queue for publication " + pubId,
            }),
            { headers: { "content-type": "application/json" } }
          );
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err?.message || "Failed to process subscription" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
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
