import { beforeEach, describe, expect, it } from "vitest";
import server from "../server";
import { D1SpotStore, MemorySpotStore } from "../server/spot-store";
import { verifyPaddleSignature } from "../server/payments";
import {
  validateAvatar,
  validateHypeUsd,
  validateLink,
  validateName,
  validateOpinionText,
} from "../lib/spot-validation";
import { dollarsToTakeSpot } from "../lib/pricing";
import { createSqliteD1 } from "./sqlite-d1";

const ADMIN_TOKEN = "admin-token-for-tests-0123456789";
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

let ipCounter = 0;

function makeEnv(overrides: Record<string, unknown> = {}) {
  return { DB: createSqliteD1(), PAYMENTS_MODE: "test", ADMIN_TOKEN, ...overrides };
}

async function call(env: unknown, path: string, init: RequestInit = {}) {
  // A fresh client IP per request keeps the shared rate limiter out of the way.
  ipCounter += 1;
  const res = await server.fetch(
    new Request(`http://localhost${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": `203.0.113.${ipCounter % 250}`,
        ...init.headers,
      },
    }),
    env,
    {},
  );
  const body = res.headers.get("content-type")?.includes("json") ? await res.json() : null;
  return { res, body };
}

async function postOpinion(env: unknown, input: Record<string, unknown>) {
  const checkout = await call(env, "/api/spot/checkout/post", {
    method: "POST",
    body: JSON.stringify(input),
  });
  expect(checkout.res.status).toBe(201);
  const done = await call(env, `/api/spot/orders/${checkout.body.data.orderId}/test-complete`, {
    method: "POST",
  });
  expect(done.body.data.status).toBe("paid");
  return done.body.data.opinionId as string;
}

async function hype(env: unknown, input: Record<string, unknown>) {
  const checkout = await call(env, "/api/spot/checkout/hype", {
    method: "POST",
    body: JSON.stringify(input),
  });
  expect(checkout.res.status).toBe(201);
  return call(env, `/api/spot/orders/${checkout.body.data.orderId}/test-complete`, {
    method: "POST",
  });
}

describe("input validation", () => {
  it("accepts names and opinions within limits and rejects empty or long ones", () => {
    expect(validateName("  Silver  ")).toEqual({ ok: true, value: "Silver" });
    expect(validateName("").ok).toBe(false);
    expect(validateName("x".repeat(41)).ok).toBe(false);
    expect(validateOpinionText("A".repeat(280)).ok).toBe(true);
    expect(validateOpinionText("A".repeat(281)).ok).toBe(false);
    expect(validateOpinionText("   ").ok).toBe(false);
  });

  it("only allows http(s) links and small image data URLs", () => {
    expect(validateLink("")).toEqual({ ok: true, value: null });
    expect(validateLink("https://example.com/a").ok).toBe(true);
    expect(validateLink("javascript:alert(1)").ok).toBe(false);
    expect(validateLink("data:text/html,hi").ok).toBe(false);
    expect(validateAvatar(TINY_PNG).ok).toBe(true);
    expect(validateAvatar("https://example.com/me.png").ok).toBe(false);
    expect(validateAvatar("data:image/svg+xml;base64,PHN2Zz4=").ok).toBe(false);
  });

  it("only allows whole-dollar hype amounts from $1 to $1000", () => {
    expect(validateHypeUsd(5)).toEqual({ ok: true, value: 5 });
    expect(validateHypeUsd("25").ok).toBe(true);
    expect(validateHypeUsd(0).ok).toBe(false);
    expect(validateHypeUsd(1.5).ok).toBe(false);
    expect(validateHypeUsd(1001).ok).toBe(false);
  });

  it("prices the spot as just enough whole dollars to pass the leader", () => {
    expect(dollarsToTakeSpot(840, 1240)).toBe(41);
    expect(dollarsToTakeSpot(1239, 1240)).toBe(1);
    expect(dollarsToTakeSpot(1240, 1240)).toBe(1);
    expect(dollarsToTakeSpot(1300, 1240)).toBe(0);
  });
});

describe("spot API on D1", () => {
  let env: ReturnType<typeof makeEnv>;

  beforeEach(() => {
    env = makeEnv();
  });

  it("starts empty, and a paid post goes live with 100 Hype Points", async () => {
    const empty = await call(env, "/api/spot/opinions?sort=top");
    expect(empty.body.data.opinions).toEqual([]);

    const id = await postOpinion(env, {
      name: "Silver",
      text: "Pineapple belongs on pizza.",
      linkUrl: "https://example.com/pizza",
      avatar: TINY_PNG,
    });

    const list = await call(env, "/api/spot/opinions?sort=top");
    expect(list.body.data.opinions).toHaveLength(1);
    const op = list.body.data.opinions[0];
    expect(op).toMatchObject({
      id,
      authorName: "Silver",
      text: "Pineapple belongs on pizza.",
      linkUrl: "https://example.com/pizza",
      hypePoints: 100,
      supporterCount: 0,
    });
    expect(op.authorAvatar).toBe(`/api/spot/avatar/o/${id}`);

    const avatar = await call(env, op.authorAvatar);
    expect(avatar.res.status).toBe(200);
    expect(avatar.res.headers.get("content-type")).toBe("image/png");
  });

  it("does not publish anything until the order is paid", async () => {
    const checkout = await call(env, "/api/spot/checkout/post", {
      method: "POST",
      body: JSON.stringify({ name: "Ana", text: "Unpaid opinion" }),
    });
    expect(checkout.body.data.checkout).toEqual({ mode: "test" });
    expect(checkout.body.data.amountCents).toBe(199);

    const status = await call(env, `/api/spot/orders/${checkout.body.data.orderId}`);
    expect(status.body.data.status).toBe("pending");
    const list = await call(env, "/api/spot/opinions?sort=new");
    expect(list.body.data.opinions).toEqual([]);
  });

  it("hypes add points, build a supporters board, and move the top spot", async () => {
    const first = await postOpinion(env, { name: "First", text: "Opinion one" });
    const second = await postOpinion(env, { name: "Second", text: "Opinion two" });

    // $3 from Maya and $2 from "maya" again (same supporter), plus $1 from Leo.
    await hype(env, { opinionId: second, name: "Maya", amountUsd: 3, avatar: TINY_PNG });
    await hype(env, { opinionId: second, name: "maya", amountUsd: 2 });
    await hype(env, { opinionId: second, name: "Leo", amountUsd: 1 });

    const top = await call(env, "/api/spot/opinions?sort=top");
    const [leader, runnerUp] = top.body.data.opinions;
    expect(leader.id).toBe(second);
    expect(leader.hypePoints).toBe(160);
    expect(leader.supporterCount).toBe(2);
    expect(leader.topSupporters.map((s: { name: string }) => s.name)).toEqual(["maya", "Leo"]);
    expect(runnerUp.id).toBe(first);

    const page = await call(env, `/api/spot/opinions/${second}`);
    expect(page.body.data.supporters).toEqual([
      expect.objectContaining({ name: "maya", points: 50, avatar: null }),
      expect.objectContaining({ name: "Leo", points: 10 }),
    ]);
    expect(page.body.data.leader.id).toBe(second);
  });

  it("applies a paid order only once, however many times it is confirmed", async () => {
    const id = await postOpinion(env, { name: "Once", text: "Count me once" });
    const checkout = await call(env, "/api/spot/checkout/hype", {
      method: "POST",
      body: JSON.stringify({ opinionId: id, name: "Fan", amountUsd: 10 }),
    });
    const orderId = checkout.body.data.orderId;
    await Promise.all(
      [1, 2, 3].map(() =>
        call(env, `/api/spot/orders/${orderId}/test-complete`, { method: "POST" }),
      ),
    );
    const page = await call(env, `/api/spot/opinions/${id}`);
    expect(page.body.data.opinion.hypePoints).toBe(200);
    expect(page.body.data.supporters).toHaveLength(1);
  });

  it("rejects bad input with a clear error", async () => {
    const badLink = await call(env, "/api/spot/checkout/post", {
      method: "POST",
      body: JSON.stringify({ name: "X", text: "hi", linkUrl: "javascript:alert(1)" }),
    });
    expect(badLink.res.status).toBe(400);
    expect(badLink.body.error).toContain("http");

    const missingOpinion = await call(env, "/api/spot/checkout/hype", {
      method: "POST",
      body: JSON.stringify({ opinionId: "op_missing", name: "X", amountUsd: 1 }),
    });
    expect(missingOpinion.res.status).toBe(404);

    const malformed = await call(env, "/api/spot/checkout/post", { method: "POST", body: "{" });
    expect(malformed.res.status).toBe(400);
  });

  it("never completes orders without a payment provider", async () => {
    const disabled = makeEnv({ PAYMENTS_MODE: undefined });
    const checkout = await call(disabled, "/api/spot/checkout/post", {
      method: "POST",
      body: JSON.stringify({ name: "Ana", text: "Hello" }),
    });
    expect(checkout.body.data.checkout).toEqual({ mode: "disabled" });
    const attempt = await call(
      disabled,
      `/api/spot/orders/${checkout.body.data.orderId}/test-complete`,
      { method: "POST" },
    );
    expect(attempt.res.status).toBe(403);
  });

  it("lets an admin hide an opinion, and nobody else", async () => {
    const id = await postOpinion(env, { name: "Troll", text: "Something abusive" });
    const denied = await call(env, `/api/spot/admin/opinions/${id}/hide`, {
      method: "POST",
      headers: { authorization: "Bearer wrong" },
      body: JSON.stringify({ hidden: true }),
    });
    expect(denied.res.status).toBe(401);

    const hidden = await call(env, `/api/spot/admin/opinions/${id}/hide`, {
      method: "POST",
      headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
      body: JSON.stringify({ hidden: true }),
    });
    expect(hidden.res.status).toBe(200);
    expect((await call(env, "/api/spot/opinions?sort=top")).body.data.opinions).toEqual([]);
    expect((await call(env, `/api/spot/opinions/${id}`)).res.status).toBe(404);
  });
});

describe("Paddle webhook", () => {
  const secret = "pdl_ntfset_test_secret";

  async function sign(body: string, ts: number) {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${ts}:${body}`));
    const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `ts=${ts};h1=${hex}`;
  }

  it("verifies signatures and rejects tampered or stale ones", async () => {
    const now = 1_760_000_000;
    const header = await sign('{"a":1}', now);
    expect(await verifyPaddleSignature('{"a":1}', header, secret, now)).toBe(true);
    expect(await verifyPaddleSignature('{"a":2}', header, secret, now)).toBe(false);
    expect(await verifyPaddleSignature('{"a":1}', header, "other", now)).toBe(false);
    expect(await verifyPaddleSignature('{"a":1}', header, secret, now + 3600)).toBe(false);
    expect(await verifyPaddleSignature('{"a":1}', null, secret, now)).toBe(false);
  });

  it("fulfills the order named in a signed transaction.completed event, once", async () => {
    const env = makeEnv({ PAYMENTS_MODE: "paddle", PADDLE_WEBHOOK_SECRET: secret });
    // Creating Paddle transactions is the next step, so checkout is refused for now...
    const refused = await call(env, "/api/spot/checkout/post", {
      method: "POST",
      body: JSON.stringify({ name: "Ana", text: "Hello" }),
    });
    expect(refused.res.status).toBe(503);

    // ...and the pending order is seeded straight into the database.
    await new D1SpotStore(env.DB).createOrder({
      id: "ord_paddle1",
      kind: "post",
      status: "pending",
      amountCents: 199,
      currency: "USD",
      payload: { name: "Ana", avatar: null, text: "Paid through Paddle", linkUrl: null },
      opinionId: "op_paddle1",
      providerRef: null,
      createdAt: new Date().toISOString(),
      paidAt: null,
    });

    const body = JSON.stringify({
      event_type: "transaction.completed",
      data: { id: "txn_123", custom_data: { orderId: "ord_paddle1" } },
    });
    const unsigned = await call(env, "/api/payments/paddle/webhook", { method: "POST", body });
    expect(unsigned.res.status).toBe(401);

    for (let i = 0; i < 2; i++) {
      const signed = await call(env, "/api/payments/paddle/webhook", {
        method: "POST",
        body,
        headers: { "paddle-signature": await sign(body, Math.floor(Date.now() / 1000)) },
      });
      expect(signed.res.status).toBe(200);
    }

    const list = await call(env, "/api/spot/opinions?sort=top");
    expect(list.body.data.opinions).toEqual([
      expect.objectContaining({ id: "op_paddle1", hypePoints: 100 }),
    ]);
    const order = await call(env, "/api/spot/orders/ord_paddle1");
    expect(order.body.data.status).toBe("paid");
  });
});

describe("in-memory dev store", () => {
  it("ships sample opinions ranked by Hype Points, marked as samples", async () => {
    const store = new MemorySpotStore({ withSamples: true });
    const top = await store.listOpinions("top", 100);
    expect(top.length).toBeGreaterThan(3);
    expect(top.every((o) => o.isSample)).toBe(true);
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1]!.hypePoints).toBeGreaterThanOrEqual(top[i]!.hypePoints);
    }
  });
});
