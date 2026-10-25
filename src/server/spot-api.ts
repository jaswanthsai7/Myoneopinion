/**
 * HTTP API for the opinion spot: listing, opinion pages, checkout orders, avatars, admin, webhooks.
 * Returns null for paths it does not own so the caller can fall through to the app.
 */

import type {
  CheckoutResponse,
  HypeOrderPayload,
  Opinion,
  Order,
  OrderStatusResponse,
  PostOrderPayload,
  Supporter,
} from "../lib/spot-types";
import { POST_PRICE_USD, dollarsToPoints } from "../lib/pricing";
import {
  validateAvatar,
  validateHypeUsd,
  validateLink,
  validateName,
  validateOpinionText,
} from "../lib/spot-validation";
import {
  D1SpotStore,
  MemorySpotStore,
  type SpotStore,
  type StoredOpinion,
  type StoredSupporter,
} from "./spot-store";
import {
  PaymentsNotReadyError,
  beginCheckout,
  getPaymentsMode,
  readEnv,
  verifyPaddleSignature,
} from "./payments";

export type RateLimiter = (key: string, max: number, windowMs: number) => boolean;

const MAX_BODY_BYTES = 128 * 1024;
const LIST_LIMIT = 100;
const TOP_SUPPORTERS_PER_CARD = 3;
const SUPPORTERS_PAGE = 50;

let devStore: MemorySpotStore | null = null;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function resolveStore(d1: any): SpotStore | null {
  if (d1?.prepare && d1?.batch) return new D1SpotStore(d1);
  // Without D1 only local dev and tests may run, on an in-memory store with sample opinions.
  if (import.meta.env.DEV) {
    devStore ??= new MemorySpotStore({ withSamples: true });
    return devStore;
  }
  return null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

function fail(status: number, error: string): Response {
  return json({ success: false, error }, status);
}

async function readJson(request: Request): Promise<Record<string, unknown> | Response> {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) return fail(413, "Request is too large.");
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return fail(413, "Request is too large.");
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : fail(400, "Malformed JSON.");
  } catch {
    return fail(400, "Malformed JSON.");
  }
}

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

function avatarUrl(kind: "o" | "h", id: string, avatar: string | null): string | null {
  if (!avatar) return null;
  return `/api/spot/avatar/${kind}/${encodeURIComponent(id)}`;
}

function toSupporter(s: StoredSupporter): Supporter {
  return {
    name: s.name,
    avatar: avatarUrl("h", s.hypeId, s.avatar),
    points: s.points,
    lastHypedAt: s.lastHypedAt,
  };
}

function toOpinion(
  op: StoredOpinion,
  summary?: { count: number; top: StoredSupporter[] },
): Opinion {
  return {
    id: op.id,
    authorName: op.authorName,
    authorAvatar: avatarUrl("o", op.id, op.authorAvatar),
    text: op.text,
    linkUrl: op.linkUrl,
    hypePoints: op.hypePoints,
    supporterCount: summary?.count ?? 0,
    topSupporters: (summary?.top ?? []).map(toSupporter),
    createdAt: op.createdAt,
    ...(op.isSample ? { isSample: true } : {}),
  };
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function startCheckout(store: SpotStore, env: unknown, order: Order): Promise<Response> {
  const mode = getPaymentsMode(env);
  try {
    const checkout = await beginCheckout(mode, order);
    await store.createOrder(order);
    const body: CheckoutResponse = { orderId: order.id, amountCents: order.amountCents, checkout };
    return json({ success: true, data: body }, 201);
  } catch (err) {
    if (err instanceof PaymentsNotReadyError) return fail(503, err.message);
    throw err;
  }
}

export async function handleSpotApi(
  request: Request,
  env: unknown,
  d1: unknown,
  clientIp: string,
  rateLimit: RateLimiter,
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith("/api/spot/") && path !== "/api/payments/paddle/webhook") return null;

  const store = resolveStore(d1);
  if (!store) return fail(503, "The database is not configured.");

  // GET /api/spot/opinions?sort=top|new
  if (path === "/api/spot/opinions" && request.method === "GET") {
    const sort = url.searchParams.get("sort") === "new" ? "new" : "top";
    const opinions = await store.listOpinions(sort, LIST_LIMIT);
    const summaries = await store.summarizeSupporters(
      opinions.map((o) => o.id),
      TOP_SUPPORTERS_PER_CARD,
    );
    return json({
      success: true,
      data: { opinions: opinions.map((o) => toOpinion(o, summaries.get(o.id))) },
    });
  }

  // GET /api/spot/opinions/:id
  const opinionMatch = path.match(/^\/api\/spot\/opinions\/([A-Za-z0-9_-]{1,64})$/);
  if (opinionMatch && request.method === "GET") {
    const id = opinionMatch[1]!;
    const op = await store.getOpinion(id);
    if (!op) return fail(404, "Opinion not found.");
    const [summaries, supporters, leader] = await Promise.all([
      store.summarizeSupporters([id], TOP_SUPPORTERS_PER_CARD),
      store.listSupporters(id, SUPPORTERS_PAGE),
      store.listOpinions("top", 1),
    ]);
    return json({
      success: true,
      data: {
        opinion: toOpinion(op, summaries.get(id)),
        supporters: supporters.map(toSupporter),
        leader: leader[0] ? toOpinion(leader[0]) : null,
      },
    });
  }

  // GET /api/spot/avatar/:kind/:id
  const avatarMatch = path.match(/^\/api\/spot\/avatar\/(o|h)\/([A-Za-z0-9_-]{1,80})$/);
  if (avatarMatch && request.method === "GET") {
    const dataUrl = await store.getAvatar(avatarMatch[1] as "o" | "h", avatarMatch[2]!);
    const parsed = dataUrl?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    if (!parsed) return new Response("Not found", { status: 404 });
    const bytes = Uint8Array.from(atob(parsed[2]!), (c) => c.charCodeAt(0));
    return new Response(bytes, {
      headers: {
        "content-type": parsed[1]!,
        // Avatar ids are never reused, so the image at a URL never changes.
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }

  // POST /api/spot/checkout/post
  if (path === "/api/spot/checkout/post" && request.method === "POST") {
    if (!rateLimit(`checkout_${clientIp}`, 20, 60_000))
      return fail(429, "Too many attempts. Please wait a minute.");
    const body = await readJson(request);
    if (body instanceof Response) return body;

    const name = validateName(body["name"]);
    if (!name.ok) return fail(400, name.error);
    const text = validateOpinionText(body["text"]);
    if (!text.ok) return fail(400, text.error);
    const link = validateLink(body["linkUrl"]);
    if (!link.ok) return fail(400, link.error);
    const avatar = validateAvatar(body["avatar"]);
    if (!avatar.ok) return fail(400, avatar.error);

    const payload: PostOrderPayload = {
      name: name.value,
      avatar: avatar.value,
      text: text.value,
      linkUrl: link.value,
    };
    return startCheckout(store, env, {
      id: newId("ord"),
      kind: "post",
      status: "pending",
      amountCents: Math.round(POST_PRICE_USD * 100),
      currency: "USD",
      payload,
      opinionId: newId("op"),
      providerRef: null,
      createdAt: new Date().toISOString(),
      paidAt: null,
    });
  }

  // POST /api/spot/checkout/hype
  if (path === "/api/spot/checkout/hype" && request.method === "POST") {
    if (!rateLimit(`checkout_${clientIp}`, 20, 60_000))
      return fail(429, "Too many attempts. Please wait a minute.");
    const body = await readJson(request);
    if (body instanceof Response) return body;

    const name = validateName(body["name"]);
    if (!name.ok) return fail(400, name.error);
    const avatar = validateAvatar(body["avatar"]);
    if (!avatar.ok) return fail(400, avatar.error);
    const usd = validateHypeUsd(body["amountUsd"]);
    if (!usd.ok) return fail(400, usd.error);
    const opinionId = typeof body["opinionId"] === "string" ? body["opinionId"] : "";
    const target = opinionId ? await store.getOpinion(opinionId) : null;
    if (!target) return fail(404, "That opinion is no longer available.");

    const payload: HypeOrderPayload = {
      opinionId,
      name: name.value,
      avatar: avatar.value,
      points: dollarsToPoints(usd.value),
    };
    return startCheckout(store, env, {
      id: newId("ord"),
      kind: "hype",
      status: "pending",
      amountCents: usd.value * 100,
      currency: "USD",
      payload,
      opinionId,
      providerRef: null,
      createdAt: new Date().toISOString(),
      paidAt: null,
    });
  }

  // GET /api/spot/orders/:id
  const orderMatch = path.match(/^\/api\/spot\/orders\/(ord_[A-Za-z0-9]{1,40})$/);
  if (orderMatch && request.method === "GET") {
    const order = await store.getOrder(orderMatch[1]!);
    if (!order) return fail(404, "Order not found.");
    const body: OrderStatusResponse = {
      orderId: order.id,
      status: order.status,
      kind: order.kind,
      opinionId: order.opinionId,
    };
    return json({ success: true, data: body });
  }

  // POST /api/spot/orders/:id/test-complete (PAYMENTS_MODE=test only)
  const testMatch = path.match(/^\/api\/spot\/orders\/(ord_[A-Za-z0-9]{1,40})\/test-complete$/);
  if (testMatch && request.method === "POST") {
    if (getPaymentsMode(env) !== "test") return fail(403, "Test payments are turned off.");
    const order = await store.fulfillOrder(testMatch[1]!, "test");
    if (!order) return fail(404, "Order not found.");
    const body: OrderStatusResponse = {
      orderId: order.id,
      status: order.status,
      kind: order.kind,
      opinionId: order.opinionId,
    };
    return json({ success: true, data: body });
  }

  // POST /api/spot/admin/opinions/:id/hide  { hidden: boolean }
  const hideMatch = path.match(/^\/api\/spot\/admin\/opinions\/([A-Za-z0-9_-]{1,64})\/hide$/);
  if (hideMatch && request.method === "POST") {
    const adminToken = readEnv(env, "ADMIN_TOKEN");
    const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    if (!adminToken || adminToken.length < 24 || !constantTimeEqual(given, adminToken)) {
      return fail(401, "Unauthorized.");
    }
    const body = await readJson(request);
    if (body instanceof Response) return body;
    const changed = await store.setHidden(hideMatch[1]!, body["hidden"] !== false);
    return changed ? json({ success: true }) : fail(404, "Opinion not found.");
  }

  // POST /api/payments/paddle/webhook
  if (path === "/api/payments/paddle/webhook" && request.method === "POST") {
    const secret = readEnv(env, "PADDLE_WEBHOOK_SECRET");
    if (getPaymentsMode(env) !== "paddle" || !secret) return fail(404, "Not found.");
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return fail(413, "Request is too large.");
    const valid = await verifyPaddleSignature(raw, request.headers.get("paddle-signature"), secret);
    if (!valid) return fail(401, "Invalid signature.");

    const event = JSON.parse(raw) as {
      event_type?: string;
      data?: { id?: string; custom_data?: { orderId?: string } | null };
    };
    const orderId = event.data?.custom_data?.orderId;
    const transactionId = event.data?.id ?? null;
    if (!orderId) return json({ success: true, ignored: true });

    // Failed attempts are not final (the buyer can retry in the same checkout), so only success matters.
    if (event.event_type === "transaction.completed" || event.event_type === "transaction.paid") {
      await store.fulfillOrder(orderId, transactionId);
    }
    return json({ success: true });
  }

  return fail(404, "Not found.");
}
