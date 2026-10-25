/**
 * Persistence for opinions, hypes, and payment orders.
 * Cloudflare D1 in production; an in-memory store (with sample data) for local dev and tests.
 */

import type { HypeOrderPayload, Order, OrderStatus, PostOrderPayload } from "../lib/spot-types";
import { STARTING_HYPE_POINTS } from "../lib/pricing";
import schemaSql from "../../migrations/0001_spot.sql?raw";

export interface StoredOpinion {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  text: string;
  linkUrl: string | null;
  hypePoints: number;
  createdAt: string;
  hidden: boolean;
  isSample?: boolean;
}

export interface StoredSupporter {
  hypeId: string;
  name: string;
  avatar: string | null;
  points: number;
  lastHypedAt: string;
}

export interface SupporterSummary {
  count: number;
  top: StoredSupporter[];
}

export type OpinionSort = "top" | "new";

export interface SpotStore {
  listOpinions(sort: OpinionSort, limit: number): Promise<StoredOpinion[]>;
  getOpinion(id: string): Promise<StoredOpinion | null>;
  summarizeSupporters(opinionIds: string[], topN: number): Promise<Map<string, SupporterSummary>>;
  listSupporters(opinionId: string, limit: number): Promise<StoredSupporter[]>;
  getAvatar(kind: "o" | "h", id: string): Promise<string | null>;
  createOrder(order: Order): Promise<void>;
  getOrder(id: string): Promise<Order | null>;
  findOrderByProviderRef(providerRef: string): Promise<Order | null>;
  setOrderProviderRef(id: string, providerRef: string): Promise<void>;
  // Applies a paid order exactly once; repeated calls return the order unchanged.
  fulfillOrder(id: string, providerRef: string | null): Promise<Order | null>;
  failOrder(id: string): Promise<void>;
  setHidden(opinionId: string, hidden: boolean): Promise<boolean>;
}

export function supporterKey(name: string): string {
  return name.trim().toLowerCase();
}

export function hypeIdForOrder(orderId: string): string {
  return `hy_${orderId}`;
}

function rankOpinions(list: StoredOpinion[], sort: OpinionSort): StoredOpinion[] {
  return [...list].sort((a, b) =>
    sort === "top"
      ? b.hypePoints - a.hypePoints || a.createdAt.localeCompare(b.createdAt)
      : b.createdAt.localeCompare(a.createdAt),
  );
}

// ---------------------------------------------------------------------------
// In-memory store (local dev and tests)
// ---------------------------------------------------------------------------

interface MemoryHype {
  id: string;
  opinionId: string;
  key: string;
  name: string;
  avatar: string | null;
  points: number;
  createdAt: string;
}

export class MemorySpotStore implements SpotStore {
  private opinions = new Map<string, StoredOpinion>();
  private hypes: MemoryHype[] = [];
  private orders = new Map<string, Order>();

  constructor(options: { withSamples?: boolean } = {}) {
    if (options.withSamples) this.seedSamples();
  }

  private seedSamples() {
    const now = Date.now();
    const samples: Array<[string, string, number, number, string | null]> = [
      ["Riley", "I miss who I was before I started worrying about money.", 1240, 2, null],
      ["Sunny", "Mom, I'm finally doing okay.", 840, 5, null],
      ["Dreamer", "Nobody tells you how lonely success can feel.", 620, 1, null],
      [
        "Hope",
        "Happiness isn't a destination. It's a decision you make every single day.",
        420,
        0.1,
        null,
      ],
      [
        "Wanderer",
        "We spend too much time on screens and not enough time with people who matter.",
        310,
        0.3,
        "https://en.wikipedia.org/wiki/Digital_detox",
      ],
      [
        "Kind Mind",
        "Mental health matters more than your productivity.",
        240,
        3,
        "https://www.who.int/health-topics/mental-health",
      ],
      ["Braver", "I'm terrified, but I'm proud of myself.", 190, 6, null],
      ["Still Trying", "I hope you're proud of me.", 100, 4, null],
    ];
    samples.forEach(([name, text, points, daysAgo, link], idx) => {
      const id = `sample_${idx + 1}`;
      this.opinions.set(id, {
        id,
        authorName: name,
        authorAvatar: null,
        text,
        linkUrl: link,
        hypePoints: points,
        createdAt: new Date(now - daysAgo * 86_400_000).toISOString(),
        hidden: false,
        isSample: true,
      });
      // Starter points plus a few sample supporters for the rest.
      const supporters = ["Maya", "Jordan", "Sam", "Alex"];
      let remaining = points - STARTING_HYPE_POINTS;
      supporters.forEach((supporter, sIdx) => {
        if (remaining <= 0) return;
        const share =
          sIdx === supporters.length - 1 ? remaining : Math.ceil(remaining / 2 / 10) * 10;
        remaining -= share;
        this.hypes.push({
          id: `${id}_h${sIdx}`,
          opinionId: id,
          key: supporterKey(supporter),
          name: supporter,
          avatar: null,
          points: share,
          createdAt: new Date(now - (daysAgo * 86_400_000) / (sIdx + 2)).toISOString(),
        });
      });
    });
  }

  async listOpinions(sort: OpinionSort, limit: number) {
    const visible = [...this.opinions.values()].filter((o) => !o.hidden);
    return rankOpinions(visible, sort).slice(0, limit);
  }

  async getOpinion(id: string) {
    const op = this.opinions.get(id);
    return op && !op.hidden ? { ...op } : null;
  }

  private aggregate(opinionId: string): StoredSupporter[] {
    const byKey = new Map<string, StoredSupporter>();
    for (const h of this.hypes) {
      if (h.opinionId !== opinionId) continue;
      const existing = byKey.get(h.key);
      if (!existing) {
        byKey.set(h.key, {
          hypeId: h.id,
          name: h.name,
          avatar: h.avatar,
          points: h.points,
          lastHypedAt: h.createdAt,
        });
      } else {
        existing.points += h.points;
        if (h.createdAt >= existing.lastHypedAt) {
          Object.assign(existing, {
            hypeId: h.id,
            name: h.name,
            avatar: h.avatar,
            lastHypedAt: h.createdAt,
          });
        }
      }
    }
    return [...byKey.values()].sort(
      (a, b) => b.points - a.points || b.lastHypedAt.localeCompare(a.lastHypedAt),
    );
  }

  async summarizeSupporters(opinionIds: string[], topN: number) {
    const result = new Map<string, SupporterSummary>();
    for (const id of opinionIds) {
      const all = this.aggregate(id);
      result.set(id, { count: all.length, top: all.slice(0, topN) });
    }
    return result;
  }

  async listSupporters(opinionId: string, limit: number) {
    return this.aggregate(opinionId).slice(0, limit);
  }

  async getAvatar(kind: "o" | "h", id: string) {
    if (kind === "o") return this.opinions.get(id)?.authorAvatar ?? null;
    return this.hypes.find((h) => h.id === id)?.avatar ?? null;
  }

  async createOrder(order: Order) {
    this.orders.set(order.id, structuredClone(order));
  }

  async getOrder(id: string) {
    const order = this.orders.get(id);
    return order ? structuredClone(order) : null;
  }

  async findOrderByProviderRef(providerRef: string) {
    for (const order of this.orders.values()) {
      if (order.providerRef === providerRef) return structuredClone(order);
    }
    return null;
  }

  async setOrderProviderRef(id: string, providerRef: string) {
    const order = this.orders.get(id);
    if (order) order.providerRef = providerRef;
  }

  async fulfillOrder(id: string, providerRef: string | null) {
    const order = this.orders.get(id);
    if (!order) return null;
    if (order.status !== "pending") return structuredClone(order);

    const paidAt = new Date().toISOString();
    if (order.kind === "post") {
      const p = order.payload as PostOrderPayload;
      this.opinions.set(order.opinionId!, {
        id: order.opinionId!,
        authorName: p.name,
        authorAvatar: p.avatar,
        text: p.text,
        linkUrl: p.linkUrl,
        hypePoints: STARTING_HYPE_POINTS,
        createdAt: paidAt,
        hidden: false,
      });
    } else {
      const p = order.payload as HypeOrderPayload;
      this.hypes.push({
        id: hypeIdForOrder(order.id),
        opinionId: p.opinionId,
        key: supporterKey(p.name),
        name: p.name,
        avatar: p.avatar,
        points: p.points,
        createdAt: paidAt,
      });
      const target = this.opinions.get(p.opinionId);
      if (target) target.hypePoints += p.points;
    }
    order.status = "paid";
    order.paidAt = paidAt;
    if (providerRef) order.providerRef = providerRef;
    return structuredClone(order);
  }

  async failOrder(id: string) {
    const order = this.orders.get(id);
    if (order && order.status === "pending") order.status = "failed";
  }

  async setHidden(opinionId: string, hidden: boolean) {
    const op = this.opinions.get(opinionId);
    if (!op) return false;
    op.hidden = hidden;
    return true;
  }
}

// ---------------------------------------------------------------------------
// Cloudflare D1 store (production)
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
type D1Database = any;

interface OpinionRow {
  id: string;
  author_name: string;
  author_avatar: string | null;
  text: string;
  link_url: string | null;
  hype_points: number;
  created_at: string;
  hidden: number;
}

interface OrderRow {
  id: string;
  kind: Order["kind"];
  status: OrderStatus;
  amount_cents: number;
  currency: "USD";
  payload: string;
  opinion_id: string | null;
  provider_ref: string | null;
  created_at: string;
  paid_at: string | null;
}

interface SupporterRow {
  opinion_id: string;
  hype_id: string;
  supporter_name: string;
  supporter_avatar: string | null;
  points: number;
  last_hyped_at: string;
}

// Avatars are served by their own endpoint, so list queries only report whether one exists.
const OPINION_LIST_COLUMNS =
  "id, author_name, CASE WHEN author_avatar IS NULL THEN NULL ELSE '1' END AS author_avatar, text, link_url, hype_points, created_at, hidden";

function toOpinion(row: OpinionRow): StoredOpinion {
  return {
    id: row.id,
    authorName: row.author_name,
    authorAvatar: row.author_avatar,
    text: row.text,
    linkUrl: row.link_url,
    hypePoints: row.hype_points,
    createdAt: row.created_at,
    hidden: row.hidden === 1,
  };
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    amountCents: row.amount_cents,
    currency: row.currency,
    payload: JSON.parse(row.payload),
    opinionId: row.opinion_id,
    providerRef: row.provider_ref,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

function toSupporter(row: SupporterRow): StoredSupporter {
  return {
    hypeId: row.hype_id,
    name: row.supporter_name,
    avatar: row.supporter_avatar === null ? null : "1",
    points: row.points,
    lastHypedAt: row.last_hyped_at,
  };
}

// SQLite returns the bare columns from the row holding MAX(created_at), i.e. the latest name and photo.
const SUPPORTER_SELECT = `SELECT opinion_id, id AS hype_id, supporter_name,
    CASE WHEN supporter_avatar IS NULL THEN NULL ELSE '1' END AS supporter_avatar,
    SUM(points) AS points, MAX(created_at) AS last_hyped_at
  FROM spot_hypes`;

const schemaReady = new WeakSet<object>();

export class D1SpotStore implements SpotStore {
  constructor(private db: D1Database) {}

  private async ready() {
    if (schemaReady.has(this.db)) return;
    const statements = schemaSql
      .split(";")
      .map((s: string) => s.replace(/^\s*--.*$/gm, "").trim())
      .filter(Boolean);
    await this.db.batch(statements.map((s: string) => this.db.prepare(s)));
    schemaReady.add(this.db);
  }

  async listOpinions(sort: OpinionSort, limit: number) {
    await this.ready();
    const order = sort === "top" ? "hype_points DESC, created_at ASC" : "created_at DESC";
    const { results } = await this.db
      .prepare(
        `SELECT ${OPINION_LIST_COLUMNS} FROM spot_opinions WHERE hidden = 0 ORDER BY ${order} LIMIT ?`,
      )
      .bind(limit)
      .all();
    return (results as OpinionRow[]).map(toOpinion);
  }

  async getOpinion(id: string) {
    await this.ready();
    const row = await this.db
      .prepare(`SELECT ${OPINION_LIST_COLUMNS} FROM spot_opinions WHERE id = ? AND hidden = 0`)
      .bind(id)
      .first();
    return row ? toOpinion(row as OpinionRow) : null;
  }

  async summarizeSupporters(opinionIds: string[], topN: number) {
    await this.ready();
    const result = new Map<string, SupporterSummary>();
    if (opinionIds.length === 0) return result;
    const placeholders = opinionIds.map(() => "?").join(",");
    const { results } = await this.db
      .prepare(
        `${SUPPORTER_SELECT} WHERE opinion_id IN (${placeholders})
         GROUP BY opinion_id, supporter_key ORDER BY opinion_id, points DESC, last_hyped_at DESC`,
      )
      .bind(...opinionIds)
      .all();
    for (const row of results as SupporterRow[]) {
      const entry = result.get(row.opinion_id) ?? { count: 0, top: [] };
      entry.count += 1;
      if (entry.top.length < topN) entry.top.push(toSupporter(row));
      result.set(row.opinion_id, entry);
    }
    return result;
  }

  async listSupporters(opinionId: string, limit: number) {
    await this.ready();
    const { results } = await this.db
      .prepare(
        `${SUPPORTER_SELECT} WHERE opinion_id = ?
         GROUP BY supporter_key ORDER BY points DESC, last_hyped_at DESC LIMIT ?`,
      )
      .bind(opinionId, limit)
      .all();
    return (results as SupporterRow[]).map(toSupporter);
  }

  async getAvatar(kind: "o" | "h", id: string) {
    await this.ready();
    const sql =
      kind === "o"
        ? "SELECT author_avatar AS avatar FROM spot_opinions WHERE id = ? AND hidden = 0"
        : "SELECT supporter_avatar AS avatar FROM spot_hypes WHERE id = ?";
    const row = (await this.db.prepare(sql).bind(id).first()) as { avatar: string | null } | null;
    return row?.avatar ?? null;
  }

  async createOrder(order: Order) {
    await this.ready();
    await this.db
      .prepare(
        `INSERT INTO spot_orders (id, kind, status, amount_cents, currency, payload, opinion_id, provider_ref, created_at, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        order.id,
        order.kind,
        order.status,
        order.amountCents,
        order.currency,
        JSON.stringify(order.payload),
        order.opinionId,
        order.providerRef,
        order.createdAt,
        order.paidAt,
      )
      .run();
  }

  async getOrder(id: string) {
    await this.ready();
    const row = await this.db.prepare("SELECT * FROM spot_orders WHERE id = ?").bind(id).first();
    return row ? toOrder(row as OrderRow) : null;
  }

  async findOrderByProviderRef(providerRef: string) {
    await this.ready();
    const row = await this.db
      .prepare("SELECT * FROM spot_orders WHERE provider_ref = ?")
      .bind(providerRef)
      .first();
    return row ? toOrder(row as OrderRow) : null;
  }

  async setOrderProviderRef(id: string, providerRef: string) {
    await this.ready();
    await this.db
      .prepare("UPDATE spot_orders SET provider_ref = ? WHERE id = ?")
      .bind(providerRef, id)
      .run();
  }

  async fulfillOrder(id: string, providerRef: string | null) {
    const order = await this.getOrder(id);
    if (!order || order.status !== "pending") return order;

    const paidAt = new Date().toISOString();
    const pending = "EXISTS (SELECT 1 FROM spot_orders WHERE id = ? AND status = 'pending')";
    const effects = [];

    if (order.kind === "post") {
      const p = order.payload as PostOrderPayload;
      effects.push(
        this.db
          .prepare(
            `INSERT INTO spot_opinions (id, author_name, author_avatar, text, link_url, hype_points, created_at, hidden, order_id)
             SELECT ?, ?, ?, ?, ?, ?, ?, 0, ? WHERE ${pending}`,
          )
          .bind(
            order.opinionId,
            p.name,
            p.avatar,
            p.text,
            p.linkUrl,
            STARTING_HYPE_POINTS,
            paidAt,
            order.id,
            order.id,
          ),
      );
    } else {
      const p = order.payload as HypeOrderPayload;
      effects.push(
        this.db
          .prepare(
            `INSERT INTO spot_hypes (id, opinion_id, supporter_key, supporter_name, supporter_avatar, points, created_at, order_id)
             SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE ${pending}`,
          )
          .bind(
            hypeIdForOrder(order.id),
            p.opinionId,
            supporterKey(p.name),
            p.name,
            p.avatar,
            p.points,
            paidAt,
            order.id,
            order.id,
          ),
        this.db
          .prepare(
            `UPDATE spot_opinions SET hype_points = hype_points + ? WHERE id = ? AND ${pending}`,
          )
          .bind(p.points, p.opinionId, order.id),
      );
    }

    // D1 runs a batch as one transaction, and every statement is guarded on the order still
    // being pending, so concurrent webhook deliveries apply the effects only once.
    await this.db.batch([
      ...effects,
      this.db
        .prepare(
          "UPDATE spot_orders SET status = 'paid', paid_at = ?, provider_ref = COALESCE(?, provider_ref) WHERE id = ? AND status = 'pending'",
        )
        .bind(paidAt, providerRef, order.id),
    ]);
    return this.getOrder(id);
  }

  async failOrder(id: string) {
    await this.ready();
    await this.db
      .prepare("UPDATE spot_orders SET status = 'failed' WHERE id = ? AND status = 'pending'")
      .bind(id)
      .run();
  }

  async setHidden(opinionId: string, hidden: boolean) {
    await this.ready();
    const res = await this.db
      .prepare("UPDATE spot_opinions SET hidden = ? WHERE id = ?")
      .bind(hidden ? 1 : 0, opinionId)
      .run();
    return (res?.meta?.changes ?? 0) > 0;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
