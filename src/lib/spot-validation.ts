/**
 * Input rules shared by the browser forms and the server API.
 * The server always re-validates; the browser uses these for instant feedback.
 */

import { MAX_HYPE_USD, MIN_HYPE_USD, isSafeLink } from "./pricing";

export const MAX_NAME_LENGTH = 40;
export const MAX_OPINION_LENGTH = 280;
export const MAX_LINK_LENGTH = 500;
// Avatars are resized in the browser to a small square JPEG before upload.
export const AVATAR_SIZE_PX = 128;
export const MAX_AVATAR_DATA_URL_LENGTH = 60_000;

const AVATAR_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;
// Control characters other than plain newlines are never allowed in text.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0009\u000B-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

function cleanText(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(CONTROL_CHARS, "").trim() : "";
}

export function validateName(raw: unknown): Validated<string> {
  const name = cleanText(raw).replace(/\s+/g, " ");
  if (!name) return { ok: false, error: "Please enter your name." };
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Names can be up to ${MAX_NAME_LENGTH} characters.` };
  }
  return { ok: true, value: name };
}

export function validateOpinionText(raw: unknown): Validated<string> {
  const text = cleanText(raw).replace(/\n{3,}/g, "\n\n");
  if (!text) return { ok: false, error: "Please write your opinion." };
  if (text.length > MAX_OPINION_LENGTH) {
    return { ok: false, error: `Opinions can be up to ${MAX_OPINION_LENGTH} characters.` };
  }
  return { ok: true, value: text };
}

export function validateLink(raw: unknown): Validated<string | null> {
  const link = cleanText(raw);
  if (!link) return { ok: true, value: null };
  if (link.length > MAX_LINK_LENGTH || !isSafeLink(link)) {
    return { ok: false, error: "Links must start with http:// or https://" };
  }
  return { ok: true, value: new URL(link).toString() };
}

export function validateAvatar(raw: unknown): Validated<string | null> {
  if (raw === null || raw === undefined || raw === "") return { ok: true, value: null };
  if (
    typeof raw !== "string" ||
    raw.length > MAX_AVATAR_DATA_URL_LENGTH ||
    !AVATAR_DATA_URL.test(raw)
  ) {
    return { ok: false, error: "That photo couldn't be used. Try a different image." };
  }
  return { ok: true, value: raw };
}

export function validateHypeUsd(raw: unknown): Validated<number> {
  const usd = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(usd) || usd < MIN_HYPE_USD || usd > MAX_HYPE_USD) {
    return {
      ok: false,
      error: `Hype amounts are whole dollars from $${MIN_HYPE_USD} to $${MAX_HYPE_USD}.`,
    };
  }
  return { ok: true, value: usd };
}
