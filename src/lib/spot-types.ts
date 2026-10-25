/**
 * Shared shapes for the MyOneOpinion spot API (server and browser).
 */

export interface Supporter {
  name: string;
  avatar: string | null;
  points: number;
  lastHypedAt: string;
}

export interface Opinion {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  text: string;
  linkUrl: string | null;
  hypePoints: number;
  supporterCount: number;
  topSupporters: Supporter[];
  createdAt: string;
  isSample?: boolean;
}

export type OrderKind = "post" | "hype";
export type OrderStatus = "pending" | "paid" | "failed";

export interface PostOrderPayload {
  name: string;
  avatar: string | null;
  text: string;
  linkUrl: string | null;
}

export interface HypeOrderPayload {
  opinionId: string;
  name: string;
  avatar: string | null;
  points: number;
}

export interface Order {
  id: string;
  kind: OrderKind;
  status: OrderStatus;
  amountCents: number;
  currency: "USD";
  payload: PostOrderPayload | HypeOrderPayload;
  opinionId: string | null;
  providerRef: string | null;
  createdAt: string;
  paidAt: string | null;
}

/**
 * How the browser should collect payment for an order.
 * - "disabled": payments are not configured; nothing can be charged.
 * - "test": local/staging only; the order can be completed without a charge.
 * - "paddle": open Paddle checkout for `transactionId` (wired up in the Paddle step).
 */
export type CheckoutInstructions =
  | { mode: "disabled" }
  | { mode: "test" }
  | {
      mode: "paddle";
      transactionId: string;
      clientToken: string;
      environment: "sandbox" | "production";
    };

export interface CheckoutResponse {
  orderId: string;
  amountCents: number;
  checkout: CheckoutInstructions;
}

export interface OrderStatusResponse {
  orderId: string;
  status: OrderStatus;
  kind: OrderKind;
  opinionId: string | null;
}
