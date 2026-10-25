/**
 * MyOneOpinion API Client
 */

import type { CheckoutResponse, Opinion, OrderStatusResponse, Supporter } from "./spot-types";

export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Can't reach MyOneOpinion right now. Check your connection and try again.");
  }
  const json = (await res.json().catch(() => null)) as
    { success: true; data: T } | { success: false; error?: string } | null;
  if (!res.ok || !json || !json.success) {
    throw new ApiError(
      (json && !json.success && json.error) || "Something went wrong. Please try again.",
    );
  }
  return json.data;
}

export interface OpinionPage {
  opinion: Opinion;
  supporters: Supporter[];
  leader: Opinion | null;
}

export const api = {
  async listOpinions(sort: "top" | "new"): Promise<Opinion[]> {
    const data = await request<{ opinions: Opinion[] }>(`/api/spot/opinions?sort=${sort}`);
    return data.opinions;
  },

  getOpinion(id: string): Promise<OpinionPage> {
    return request<OpinionPage>(`/api/spot/opinions/${encodeURIComponent(id)}`);
  },

  startPostCheckout(input: {
    name: string;
    avatar: string | null;
    text: string;
    linkUrl: string | null;
  }): Promise<CheckoutResponse> {
    return request<CheckoutResponse>("/api/spot/checkout/post", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  startHypeCheckout(input: {
    opinionId: string;
    name: string;
    avatar: string | null;
    amountUsd: number;
  }): Promise<CheckoutResponse> {
    return request<CheckoutResponse>("/api/spot/checkout/hype", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getOrder(orderId: string): Promise<OrderStatusResponse> {
    return request<OrderStatusResponse>(`/api/spot/orders/${encodeURIComponent(orderId)}`);
  },

  completeTestOrder(orderId: string): Promise<OrderStatusResponse> {
    return request<OrderStatusResponse>(
      `/api/spot/orders/${encodeURIComponent(orderId)}/test-complete`,
      { method: "POST" },
    );
  },
};
