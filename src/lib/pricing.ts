/**
 * MyOneOpinion pricing rules.
 * Posting an opinion costs a flat fee and comes with starter Hype Points;
 * anyone can buy more Hype Points for any opinion at a fixed rate.
 */

export const POST_PRICE_USD = 1.99;
export const STARTING_HYPE_POINTS = 100;
export const POINTS_PER_DOLLAR = 10;
export const HYPE_PRESETS_USD = [1, 5, 10, 25] as const;
export const MIN_HYPE_USD = 1;
export const MAX_HYPE_USD = 1000;

export function dollarsToPoints(usd: number): number {
  return Math.floor(usd * POINTS_PER_DOLLAR);
}

// Whole dollars needed for `current` to strictly pass `leader`.
export function dollarsToTakeSpot(current: number, leader: number): number {
  const gap = leader - current + 1;
  if (gap <= 0) return 0;
  return Math.max(MIN_HYPE_USD, Math.ceil(gap / POINTS_PER_DOLLAR));
}

export function formatUsd(usd: number): string {
  return `$${usd.toFixed(usd % 1 === 0 ? 0 : 2)}`;
}

export function isSafeLink(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function linkHost(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw;
  }
}
