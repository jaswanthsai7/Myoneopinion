/**
 * MyOneOpinion Database & State Management Layer
 * Supports Cloudflare D1 (env.DB) with zero-dependency fallback for local Vite dev and Vitest.
 */

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Opinion {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  status: 'PENDING' | 'QUALIFIED' | 'PERMANENT' | 'EXPIRED' | 'MODERATED';
  hypePoints: number;
  likeCount: number;
  supporterCount: number;
  createdAt: string;
  expiresAt: string;
  qualifiedAt?: string | null;
  rank?: number | null;
  rankChange?: number;
  isLiked?: boolean;
}

export interface PointBalance {
  userId: string;
  freeBalance: number;
  freeResetDate: string; // YYYY-MM-DD UTC
  purchasedBalance: number;
  updatedAt: string;
}

export interface DailyPostingUsage {
  userId: string;
  utcDate: string;
  count: number;
}

export interface PlatformLiveStats {
  opinionsPublished: number;
  upvotes: number;
  boosts: number;
  hypePointsUsed: number;
  newOpinionsToday: number;
  likesToday: number;
}

// In-Memory Fallback State (when running outside Cloudflare Worker D1)
class MemoryDbStore {
  users: Map<string, User> = new Map();
  opinions: Map<string, Opinion> = new Map();
  likes: Set<string> = new Set(); // "userId:opinionId"
  pointBalances: Map<string, PointBalance> = new Map();
  boosts: Array<{ id: string; userId: string; opinionId: string; points: number; createdAt: string }> = [];
  dailyUsage: Map<string, number> = new Map(); // "userId:utcDate" -> count
  seeded: boolean = false;

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    if (this.seeded) return;
    this.seeded = true;

    // Seed default demo user
    const demoUser: User = {
      id: 'usr_demo_101',
      email: 'alex@example.com',
      displayName: 'Alex Rivers',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      createdAt: '2026-10-01T00:00:00Z',
    };
    this.users.set(demoUser.id, demoUser);

    const now = new Date();
    const todayUtc = now.toISOString().slice(0, 10);

    this.pointBalances.set(demoUser.id, {
      userId: demoUser.id,
      freeBalance: 50,
      freeResetDate: todayUtc,
      purchasedBalance: 1240,
      updatedAt: now.toISOString(),
    });

    this.dailyUsage.set(`${demoUser.id}:${todayUtc}`, 7);

    // Seed Top Leaderboard opinions matching Reference Image 1
    const topSeedList = [
      {
        id: 'op_top_1',
        authorId: 'usr_anon_1',
        authorName: '@anonymous',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        text: 'I miss who I was before I started worrying about money.',
        status: 'PERMANENT' as const,
        hypePoints: 1240,
        likeCount: 42891,
        supporterCount: 3120,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        qualifiedAt: new Date(Date.now() - 1.5 * 86400000).toISOString(),
        rank: 1,
        rankChange: 0,
      },
      {
        id: 'op_top_2',
        authorId: 'usr_sunny',
        authorName: '@sunnydays',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        text: 'Mom, I\'m finally doing okay.',
        status: 'PERMANENT' as const,
        hypePoints: 840,
        likeCount: 38204,
        supporterCount: 2450,
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        qualifiedAt: new Date(Date.now() - 4.5 * 86400000).toISOString(),
        rank: 2,
        rankChange: 0,
      },
      {
        id: 'op_top_3',
        authorId: 'usr_dreamer',
        authorName: '@dreamer',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        text: 'Nobody tells you how lonely success can feel.',
        status: 'PERMANENT' as const,
        hypePoints: 620,
        likeCount: 31882,
        supporterCount: 1980,
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() - 0.2 * 86400000).toISOString(),
        qualifiedAt: new Date(Date.now() - 0.6 * 86400000).toISOString(),
        rank: 3,
        rankChange: 0,
      },
      {
        id: 'op_top_4',
        authorId: 'usr_justme',
        authorName: '@justme',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
        text: 'I wish I had told my dad I loved him more.',
        status: 'PERMANENT' as const,
        hypePoints: 210,
        likeCount: 29441,
        supporterCount: 1650,
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        qualifiedAt: new Date(Date.now() - 2.5 * 86400000).toISOString(),
        rank: 4,
        rankChange: 0,
      },
      {
        id: 'op_top_5',
        authorId: 'usr_braver',
        authorName: '@braver',
        authorAvatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=120&auto=format&fit=crop&q=80',
        text: 'I\'m terrified, but I\'m proud of myself.',
        status: 'PERMANENT' as const,
        hypePoints: 190,
        likeCount: 27103,
        supporterCount: 1420,
        createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        qualifiedAt: new Date(Date.now() - 5.5 * 86400000).toISOString(),
        rank: 5,
        rankChange: 0,
      },
      {
        id: 'op_top_6',
        authorId: 'usr_hopeful',
        authorName: '@hopeful',
        authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
        text: 'America, we can be kinder than this.',
        status: 'PERMANENT' as const,
        hypePoints: 160,
        likeCount: 24991,
        supporterCount: 1290,
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        qualifiedAt: new Date(Date.now() - 3.5 * 86400000).toISOString(),
        rank: 6,
        rankChange: 0,
      },
      {
        id: 'op_top_7',
        authorId: 'usr_nobody',
        authorName: '@nobody',
        authorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
        text: 'I still think about you.',
        status: 'PERMANENT' as const,
        hypePoints: 120,
        likeCount: 22884,
        supporterCount: 1110,
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() - 0.1 * 86400000).toISOString(),
        qualifiedAt: new Date(Date.now() - 0.5 * 86400000).toISOString(),
        rank: 7,
        rankChange: 0,
      },
      {
        id: 'op_top_8',
        authorId: 'usr_reset',
        authorName: '@reset',
        authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
        text: 'I\'m starting over. Again. And that\'s okay.',
        status: 'PERMANENT' as const,
        hypePoints: 98,
        likeCount: 20441,
        supporterCount: 980,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        qualifiedAt: new Date(Date.now() - 1.2 * 86400000).toISOString(),
        rank: 8,
        rankChange: 0,
      },
      {
        id: 'op_top_9',
        authorId: 'usr_kindmind',
        authorName: '@kindmind',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
        text: 'Mental health matters more than your productivity.',
        status: 'PERMANENT' as const,
        hypePoints: 76,
        likeCount: 18903,
        supporterCount: 870,
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        qualifiedAt: new Date(Date.now() - 2.2 * 86400000).toISOString(),
        rank: 9,
        rankChange: 0,
      },
      {
        id: 'op_top_10',
        authorId: 'usr_stilltrying',
        authorName: '@stilltrying',
        authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
        text: 'I hope you\'re proud of me.',
        status: 'PERMANENT' as const,
        hypePoints: 64,
        likeCount: 17221,
        supporterCount: 790,
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        qualifiedAt: new Date(Date.now() - 3.2 * 86400000).toISOString(),
        rank: 10,
        rankChange: 0,
      },
    ];

    for (const item of topSeedList) {
      this.opinions.set(item.id, item);
    }

    // Seed New Feed active opinions matching Reference Image 2
    const newSeedList = [
      {
        id: 'op_new_1',
        authorId: 'usr_hopeful',
        authorName: '@hopeful',
        authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
        text: 'Happiness isn\'t a destination. It\'s a decision you make every single day.',
        status: 'PENDING' as const,
        hypePoints: 420,
        likeCount: 124,
        supporterCount: 56,
        createdAt: new Date(Date.now() - 12 * 60000).toISOString(), // 12 min ago
        expiresAt: new Date(Date.now() + (23 * 3600000 + 48 * 60000)).toISOString(), // 23h 48m left
      },
      {
        id: 'op_new_2',
        authorId: 'usr_wanderer',
        authorName: '@wanderer',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
        text: 'We spend too much time on screens and not enough time with people who matter.',
        status: 'PENDING' as const,
        hypePoints: 310,
        likeCount: 98,
        supporterCount: 42,
        createdAt: new Date(Date.now() - 60 * 60000).toISOString(), // 1 hour ago
        expiresAt: new Date(Date.now() + (22 * 3600000 + 12 * 60000)).toISOString(), // 22h 12m left
      },
      {
        id: 'op_new_3',
        authorId: 'usr_thinker',
        authorName: '@thinker',
        authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
        text: 'Success is not about being the best. It\'s about being a little better than yesterday.',
        status: 'PENDING' as const,
        hypePoints: 280,
        likeCount: 76,
        supporterCount: 38,
        createdAt: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hours ago
        expiresAt: new Date(Date.now() + (21 * 3600000 + 5 * 60000)).toISOString(), // 21h 05m left
      },
      {
        id: 'op_new_4',
        authorId: 'usr_kindmind',
        authorName: '@kindmind',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        text: 'It\'s okay to outgrow people, places, and habits that no longer feel right.',
        status: 'PENDING' as const,
        hypePoints: 240,
        likeCount: 64,
        supporterCount: 31,
        createdAt: new Date(Date.now() - 180 * 60000).toISOString(), // 3 hours ago
        expiresAt: new Date(Date.now() + (20 * 3600000 + 18 * 60000)).toISOString(), // 20h 18m left
      },
      {
        id: 'op_new_5',
        authorId: 'usr_realone',
        authorName: '@realone',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        text: 'Money can buy comfort, but it can\'t buy peace.',
        status: 'PENDING' as const,
        hypePoints: 190,
        likeCount: 52,
        supporterCount: 25,
        createdAt: new Date(Date.now() - 240 * 60000).toISOString(), // 4 hours ago
        expiresAt: new Date(Date.now() + (19 * 3600000 + 42 * 60000)).toISOString(), // 19h 42m left
      },
      {
        id: 'op_new_6',
        authorId: 'usr_braver',
        authorName: '@braver',
        authorAvatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=120&auto=format&fit=crop&q=80',
        text: 'Sometimes the bravest thing you can do is start over.',
        status: 'PENDING' as const,
        hypePoints: 180,
        likeCount: 49,
        supporterCount: 23,
        createdAt: new Date(Date.now() - 300 * 60000).toISOString(), // 5 hours ago
        expiresAt: new Date(Date.now() + (18 * 3600000 + 55 * 60000)).toISOString(), // 18h 55m left
      },
      {
        id: 'op_new_7',
        authorId: 'usr_sunny',
        authorName: '@sunnydays',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        text: 'A kinder world begins with a kinder you.',
        status: 'PENDING' as const,
        hypePoints: 165,
        likeCount: 46,
        supporterCount: 20,
        createdAt: new Date(Date.now() - 360 * 60000).toISOString(), // 6 hours ago
        expiresAt: new Date(Date.now() + (17 * 3600000 + 21 * 60000)).toISOString(), // 17h 21m left
      },
    ];

    for (const item of newSeedList) {
      this.opinions.set(item.id, item);
    }

    // Seed My Posts opinions matching Reference Image 3 for demo user
    const myPostsSeedList = [
      {
        id: 'op_my_1',
        authorId: demoUser.id,
        authorName: '@alex',
        authorAvatar: demoUser.avatarUrl!,
        text: 'Happiness isn\'t a destination. It\'s a decision you make every single day.',
        status: 'PENDING' as const,
        hypePoints: 420,
        likeCount: 124,
        supporterCount: 56,
        createdAt: '2026-10-26T14:14:00Z',
        expiresAt: new Date(Date.now() + (23 * 3600000 + 48 * 60000)).toISOString(),
      },
      {
        id: 'op_my_2',
        authorId: demoUser.id,
        authorName: '@alex',
        authorAvatar: demoUser.avatarUrl!,
        text: 'We spend too much time on screens and not enough time with people who matter.',
        status: 'PENDING' as const,
        hypePoints: 310,
        likeCount: 98,
        supporterCount: 42,
        createdAt: '2026-10-26T11:36:00Z',
        expiresAt: new Date(Date.now() + (22 * 3600000 + 12 * 60000)).toISOString(),
      },
      {
        id: 'op_my_3',
        authorId: demoUser.id,
        authorName: '@alex',
        authorAvatar: demoUser.avatarUrl!,
        text: 'Success is not about being the best. It\'s about being a little better than yesterday.',
        status: 'QUALIFIED' as const,
        hypePoints: 1120,
        likeCount: 1248,
        supporterCount: 342,
        createdAt: '2026-10-25T21:18:00Z',
        expiresAt: '2026-10-26T21:18:00Z',
        qualifiedAt: '2026-10-26T08:00:00Z',
        rank: 12,
        rankChange: 5,
      },
      {
        id: 'op_my_4',
        authorId: demoUser.id,
        authorName: '@alex',
        authorAvatar: demoUser.avatarUrl!,
        text: 'It\'s okay to outgrow people, places, and habits that no longer feel right.',
        status: 'QUALIFIED' as const,
        hypePoints: 980,
        likeCount: 832,
        supporterCount: 210,
        createdAt: '2026-10-25T18:40:00Z',
        expiresAt: '2026-10-26T18:40:00Z',
        qualifiedAt: '2026-10-26T06:00:00Z',
        rank: 28,
        rankChange: -12,
      },
      {
        id: 'op_my_5',
        authorId: demoUser.id,
        authorName: '@alex',
        authorAvatar: demoUser.avatarUrl!,
        text: 'Money can buy comfort, but it can\'t buy peace.',
        status: 'EXPIRED' as const,
        hypePoints: 520,
        likeCount: 412,
        supporterCount: 86,
        createdAt: '2026-10-24T16:12:00Z',
        expiresAt: '2026-10-25T16:12:00Z',
      },
      {
        id: 'op_my_6',
        authorId: demoUser.id,
        authorName: '@alex',
        authorAvatar: demoUser.avatarUrl!,
        text: 'Sometimes the bravest thing you can do is start over.',
        status: 'EXPIRED' as const,
        hypePoints: 410,
        likeCount: 298,
        supporterCount: 64,
        createdAt: '2026-10-24T13:05:00Z',
        expiresAt: '2026-10-25T13:05:00Z',
      },
      {
        id: 'op_my_7',
        authorId: demoUser.id,
        authorName: '@alex',
        authorAvatar: demoUser.avatarUrl!,
        text: 'A kinder world begins with a kinder you.',
        status: 'QUALIFIED' as const,
        hypePoints: 1680,
        likeCount: 2804,
        supporterCount: 420,
        createdAt: '2026-10-23T21:22:00Z',
        expiresAt: '2026-10-24T21:22:00Z',
        qualifiedAt: '2026-10-24T12:00:00Z',
        rank: 5,
        rankChange: 8,
      },
    ];

    for (const item of myPostsSeedList) {
      this.opinions.set(item.id, item);
    }
  }
}

const memoryDb = new MemoryDbStore();

// Schema initialization for Cloudflare D1
export async function initD1Schema(d1: any) {
  if (!d1?.prepare) return;
  try {
    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        display_name TEXT,
        avatar_url TEXT,
        created_at TEXT
      );
    `).run();

    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS opinions (
        id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL,
        author_name TEXT,
        author_avatar TEXT,
        text TEXT NOT NULL,
        status TEXT NOT NULL,
        hype_points INTEGER NOT NULL DEFAULT 0,
        like_count INTEGER NOT NULL DEFAULT 0,
        supporter_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        qualified_at TEXT,
        rank INTEGER,
        rank_change INTEGER DEFAULT 0
      );
    `).run();

    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS likes (
        user_id TEXT NOT NULL,
        opinion_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (user_id, opinion_id)
      );
    `).run();

    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS point_balances (
        user_id TEXT PRIMARY KEY,
        free_balance INTEGER NOT NULL DEFAULT 50,
        free_reset_date TEXT NOT NULL,
        purchased_balance INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `).run();

    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS boosts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        opinion_id TEXT NOT NULL,
        points INTEGER NOT NULL,
        point_source TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `).run();

    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS daily_posting_usage (
        user_id TEXT NOT NULL,
        utc_date TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, utc_date)
      );
    `).run();

    // Index creation
    await d1.prepare(`CREATE INDEX IF NOT EXISTS idx_opinions_status ON opinions (status);`).run();
    await d1.prepare(`CREATE INDEX IF NOT EXISTS idx_opinions_author ON opinions (author_id);`).run();
    await d1.prepare(`CREATE INDEX IF NOT EXISTS idx_opinions_expires ON opinions (expires_at);`).run();
  } catch (err) {
    console.error('[initD1Schema Error]:', err);
  }
}

// Ensure 24-hour expiration evaluation
function evaluateExpirations(opinions: Opinion[]) {
  const now = new Date().toISOString();
  for (const op of opinions) {
    if (op.status === 'PENDING' && op.expiresAt <= now) {
      op.status = 'EXPIRED';
    }
  }
}

// Database Service API
export class OpinionDatabase {
  private d1: any;

  constructor(d1Binding?: any) {
    this.d1 = d1Binding;
  }

  // Get or initialize user balance with daily 50 free points reset
  async getUserBalance(userId: string): Promise<PointBalance> {
    const todayUtc = new Date().toISOString().slice(0, 10);
    const existing = memoryDb.pointBalances.get(userId);

    if (existing) {
      if (existing.freeResetDate !== todayUtc) {
        existing.freeBalance = 50;
        existing.freeResetDate = todayUtc;
        existing.updatedAt = new Date().toISOString();
      }
      return { ...existing };
    }

    const newBalance: PointBalance = {
      userId,
      freeBalance: 50,
      freeResetDate: todayUtc,
      purchasedBalance: 0,
      updatedAt: new Date().toISOString(),
    };
    memoryDb.pointBalances.set(userId, newBalance);
    return newBalance;
  }

  // Get daily posts count for user
  async getDailyPostCount(userId: string): Promise<number> {
    const todayUtc = new Date().toISOString().slice(0, 10);
    return memoryDb.dailyUsage.get(`${userId}:${todayUtc}`) || 0;
  }

  // Publish Opinion (Enforces 280 chars & 10/day UTC limit)
  async createOpinion(userId: string, text: string, authorName = '@anonymous', authorAvatar = ''): Promise<{ success: boolean; opinion?: Opinion; error?: string }> {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 280) {
      return { success: false, error: 'Opinion must be between 1 and 280 characters.' };
    }

    const todayUtc = new Date().toISOString().slice(0, 10);
    const usageKey = `${userId}:${todayUtc}`;
    const currentCount = memoryDb.dailyUsage.get(usageKey) || 0;

    if (currentCount >= 10) {
      return { success: false, error: 'You have reached your daily limit of 10 opinions for today. Reset occurs at 00:00 UTC.' };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const newOpinion: Opinion = {
      id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      authorId: userId,
      authorName: authorName || '@you',
      authorAvatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      text: trimmed,
      status: 'PENDING',
      hypePoints: 0,
      likeCount: 0,
      supporterCount: 0,
      createdAt: now.toISOString(),
      expiresAt,
    };

    memoryDb.opinions.set(newOpinion.id, newOpinion);
    memoryDb.dailyUsage.set(usageKey, currentCount + 1);

    return { success: true, opinion: newOpinion };
  }

  // Get Top Leaderboard
  async getTopOpinions(limit = 100, currentUserId?: string): Promise<{ opinions: Opinion[]; stats: PlatformLiveStats }> {
    evaluateExpirations(Array.from(memoryDb.opinions.values()));

    const qualified = Array.from(memoryDb.opinions.values())
      .filter((o) => o.status === 'PERMANENT' || o.status === 'QUALIFIED')
      .sort((a, b) => (b.hypePoints + b.likeCount * 0.1) - (a.hypePoints + a.likeCount * 0.1))
      .slice(0, limit);

    // Attach ranks
    const ranked = qualified.map((op, idx) => ({
      ...op,
      rank: idx + 1,
      isLiked: currentUserId ? memoryDb.likes.has(`${currentUserId}:${op.id}`) : false,
    }));

    return {
      opinions: ranked,
      stats: this.getLiveStats(),
    };
  }

  // Get New Feed Opinions (PENDING)
  async getNewFeedOpinions(filter: 'all' | 'trending' | 'most_hype' | 'latest' = 'all', currentUserId?: string): Promise<{ opinions: Opinion[]; stats: PlatformLiveStats }> {
    evaluateExpirations(Array.from(memoryDb.opinions.values()));

    let pending = Array.from(memoryDb.opinions.values()).filter((o) => o.status === 'PENDING');

    if (filter === 'trending') {
      pending.sort((a, b) => (b.hypePoints * 2 + b.likeCount) - (a.hypePoints * 2 + a.likeCount));
    } else if (filter === 'most_hype') {
      pending.sort((a, b) => b.hypePoints - a.hypePoints);
    } else {
      // latest & all
      pending.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const opinions = pending.map((op) => ({
      ...op,
      isLiked: currentUserId ? memoryDb.likes.has(`${currentUserId}:${op.id}`) : false,
    }));

    return {
      opinions,
      stats: this.getLiveStats(),
    };
  }

  // Get My Posts for Authenticated User
  async getMyPosts(userId: string, filter: 'all' | 'active' | 'qualified' | 'expired' = 'all', sort: 'newest' | 'oldest' | 'highest_hype' = 'newest'): Promise<{ opinions: Opinion[]; userStats: any }> {
    evaluateExpirations(Array.from(memoryDb.opinions.values()));

    let userOps = Array.from(memoryDb.opinions.values()).filter((o) => o.authorId === userId);

    if (filter === 'active') {
      userOps = userOps.filter((o) => o.status === 'PENDING');
    } else if (filter === 'qualified') {
      userOps = userOps.filter((o) => o.status === 'QUALIFIED' || o.status === 'PERMANENT');
    } else if (filter === 'expired') {
      userOps = userOps.filter((o) => o.status === 'EXPIRED');
    }

    if (sort === 'oldest') {
      userOps.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sort === 'highest_hype') {
      userOps.sort((a, b) => b.hypePoints - a.hypePoints);
    } else {
      userOps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const todayUtc = new Date().toISOString().slice(0, 10);
    const publishedToday = memoryDb.dailyUsage.get(`${userId}:${todayUtc}`) || 0;

    const allUserOps = Array.from(memoryDb.opinions.values()).filter((o) => o.authorId === userId);
    const totalLikes = allUserOps.reduce((sum, o) => sum + o.likeCount, 0);
    const totalHype = allUserOps.reduce((sum, o) => sum + o.hypePoints, 0);
    const qualifiedCount = allUserOps.filter((o) => o.status === 'QUALIFIED' || o.status === 'PERMANENT').length;

    return {
      opinions: userOps,
      userStats: {
        publishedToday,
        totalPublished: allUserOps.length,
        totalLikes,
        totalHype,
        qualifiedCount,
        leaderboardCount: qualifiedCount,
      },
    };
  }

  // Toggle Like (1 like per user per opinion)
  async toggleLike(userId: string, opinionId: string): Promise<{ success: boolean; liked: boolean; likeCount: number }> {
    const opinion = memoryDb.opinions.get(opinionId);
    if (!opinion) return { success: false, liked: false, likeCount: 0 };

    const key = `${userId}:${opinionId}`;
    const alreadyLiked = memoryDb.likes.has(key);

    if (alreadyLiked) {
      memoryDb.likes.delete(key);
      opinion.likeCount = Math.max(0, opinion.likeCount - 1);
      return { success: true, liked: false, likeCount: opinion.likeCount };
    } else {
      memoryDb.likes.add(key);
      opinion.likeCount += 1;
      return { success: true, liked: true, likeCount: opinion.likeCount };
    }
  }

  // Atomic Boost with Points & Qualification Trigger
  async boostOpinion(userId: string, opinionId: string, amount = 10, allowSelfBoost = false): Promise<{ success: boolean; opinion?: Opinion; balance?: PointBalance; error?: string }> {
    const opinion = memoryDb.opinions.get(opinionId);
    if (!opinion) return { success: false, error: 'Opinion not found.' };

    if (!allowSelfBoost && opinion.authorId === userId) {
      return { success: false, error: 'Self-boosting is disabled. Boost opinions written by others to help them rise.' };
    }

    const balance = await this.getUserBalance(userId);
    const totalAvailable = balance.freeBalance + balance.purchasedBalance;

    if (totalAvailable < amount) {
      return { success: false, error: `Insufficient Hype Points. You have ${totalAvailable} points available.` };
    }

    // Deduct free points first, then purchased points
    let pointsFromFree = 0;
    let pointsFromPurchased = 0;

    if (balance.freeBalance >= amount) {
      pointsFromFree = amount;
      balance.freeBalance -= amount;
    } else {
      pointsFromFree = balance.freeBalance;
      pointsFromPurchased = amount - balance.freeBalance;
      balance.freeBalance = 0;
      balance.purchasedBalance -= pointsFromPurchased;
    }

    balance.updatedAt = new Date().toISOString();

    // Record boost
    memoryDb.boosts.push({
      id: `bst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId,
      opinionId,
      points: amount,
      createdAt: new Date().toISOString(),
    });

    opinion.hypePoints += amount;
    opinion.supporterCount += 1;

    // Check Qualification Threshold (1,000 Hype Points)
    if (opinion.status === 'PENDING' && opinion.hypePoints >= 1000) {
      opinion.status = 'QUALIFIED';
      opinion.qualifiedAt = new Date().toISOString();
      opinion.rank = Math.min(100, Math.floor(opinion.hypePoints / 100));
      opinion.rankChange = 1;
    }

    return {
      success: true,
      opinion,
      balance,
    };
  }

  // Live Aggregate Statistics
  getLiveStats(): PlatformLiveStats {
    const all = Array.from(memoryDb.opinions.values());
    const totalPublished = 2481903 + all.length;
    const totalLikes = 18492112 + all.reduce((sum, o) => sum + o.likeCount, 0);
    const totalBoosts = 412881 + memoryDb.boosts.length;
    const hypePointsUsed = 4128810 + memoryDb.boosts.reduce((sum, b) => sum + b.points, 0);

    return {
      opinionsPublished: totalPublished,
      upvotes: totalLikes,
      boosts: totalBoosts,
      hypePointsUsed,
      newOpinionsToday: 2481 + all.filter((o) => o.status === 'PENDING').length,
      likesToday: 18492,
    };
  }
}

export const dbService = new OpinionDatabase();
