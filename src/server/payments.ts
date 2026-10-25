/**
 * Payment provider configuration.
 *
 * PAYMENTS_MODE decides how orders get paid:
 * - unset / "disabled": checkout is shown as a preview and nothing can be charged or published.
 * - "test": local and staging only. Orders can be completed without a charge so the whole
 *   flow can be exercised end to end. Never set this in production.
 * - "paddle": Paddle Billing. The webhook below verifies Paddle's signature and fulfills
 *   orders; creating the Paddle transaction is the remaining integration step.
 */

import type { CheckoutInstructions, Order } from "../lib/spot-types";

export type PaymentsMode = "disabled" | "test" | "paddle";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function readEnv(env: any, key: string): string | undefined {
  const fromEnv = env?.[key];
  if (typeof fromEnv === "string" && fromEnv) return fromEnv;
  const fromProcess = typeof process !== "undefined" ? process.env?.[key] : undefined;
  return fromProcess || undefined;
}

export function getPaymentsMode(env: any): PaymentsMode {
  const mode = readEnv(env, "PAYMENTS_MODE");
  return mode === "test" || mode === "paddle" ? mode : "disabled";
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export class PaymentsNotReadyError extends Error {}

// Returns how the browser should pay for a freshly created order.
export async function beginCheckout(
  mode: PaymentsMode,
  _order: Order,
): Promise<CheckoutInstructions> {
  if (mode === "test") return { mode: "test" };
  if (mode === "paddle") {
    // Paddle step: create a transaction for the order (custom_data.orderId = order.id), store its
    // id with SpotStore.setOrderProviderRef, and return { mode: "paddle", transactionId, ... }.
    throw new PaymentsNotReadyError("Paddle checkout is not connected yet.");
  }
  return { mode: "disabled" };
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

/**
 * Verifies a Paddle Billing webhook: header `Paddle-Signature: ts=<unix>;h1=<hex hmac>`, where the
 * HMAC-SHA256 is computed over `<ts>:<raw body>` with the notification's secret key.
 */
export async function verifyPaddleSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
): Promise<boolean> {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(";").map((part) => {
      const [k, ...v] = part.split("=");
      return [k?.trim(), v.join("=").trim()];
    }),
  ) as Record<string, string | undefined>;
  const ts = Number(parts["ts"]);
  const signature = parts["h1"] ? hexToBytes(parts["h1"]) : null;
  if (!Number.isFinite(ts) || !signature) return false;
  if (Math.abs(nowSeconds - ts) > toleranceSeconds) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    new TextEncoder().encode(`${parts["ts"]}:${rawBody}`),
  );
}
