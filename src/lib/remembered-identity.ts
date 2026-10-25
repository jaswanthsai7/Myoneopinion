/**
 * Remembers the name and photo someone last used on this device, so they don't retype them.
 * Purely a convenience: everything works when storage is unavailable.
 */

const KEY = "myoneopinion.identity";

export interface RememberedIdentity {
  name: string;
  avatar: string | null;
}

export function loadIdentity(): RememberedIdentity {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(KEY) || "null",
    ) as Partial<RememberedIdentity> | null;
    return {
      name: typeof parsed?.name === "string" ? parsed.name : "",
      avatar: typeof parsed?.avatar === "string" ? parsed.avatar : null,
    };
  } catch {
    return { name: "", avatar: null };
  }
}

export function saveIdentity(identity: RememberedIdentity): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(identity));
  } catch {
    // Storage can be full or blocked; remembering is optional.
  }
}
