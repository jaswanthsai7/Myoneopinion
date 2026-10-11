/**
 * MyOneOpinion API Client
 */

import type { Opinion, PlatformLiveStats, PointBalance } from './db';

export interface UserProfile {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl: string;
  balance: PointBalance;
  postCountToday: number;
  maxDailyPosts: number;
}

export const api = {
  async getTopOpinions(): Promise<{ opinions: Opinion[]; stats: PlatformLiveStats }> {
    try {
      const res = await fetch('/api/opinions/top');
      if (!res.ok) throw new Error('Failed to load top opinions');
      const json = await res.json();
      return json.data;
    } catch {
      // Fallback
      const { dbService } = await import('./db');
      return dbService.getTopOpinions();
    }
  },

  async getNewFeed(filter: 'all' | 'trending' | 'most_hype' | 'latest' = 'all'): Promise<{ opinions: Opinion[]; stats: PlatformLiveStats }> {
    try {
      const res = await fetch(`/api/opinions/new?filter=${filter}`);
      if (!res.ok) throw new Error('Failed to load new feed');
      const json = await res.json();
      return json.data;
    } catch {
      const { dbService } = await import('./db');
      return dbService.getNewFeedOpinions(filter);
    }
  },

  async getMyPosts(filter: 'all' | 'active' | 'qualified' | 'expired' = 'all', sort: 'newest' | 'oldest' | 'highest_hype' = 'newest'): Promise<{ opinions: Opinion[]; userStats: any }> {
    try {
      const res = await fetch(`/api/opinions/my-posts?filter=${filter}&sort=${sort}`);
      if (!res.ok) throw new Error('Failed to load my posts');
      const json = await res.json();
      return json.data;
    } catch {
      const { dbService } = await import('./db');
      return dbService.getMyPosts('usr_demo_101', filter, sort);
    }
  },

  async createOpinion(text: string): Promise<{ success: boolean; opinion?: Opinion; error?: string }> {
    try {
      const res = await fetch('/api/opinions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      return await res.json();
    } catch {
      const { dbService } = await import('./db');
      return dbService.createOpinion('usr_demo_101', text, '@alex');
    }
  },

  async toggleLike(opinionId: string): Promise<{ success: boolean; liked: boolean; likeCount: number }> {
    try {
      const res = await fetch('/api/opinions/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opinionId }),
      });
      return await res.json();
    } catch {
      const { dbService } = await import('./db');
      return dbService.toggleLike('usr_demo_101', opinionId);
    }
  },

  async boostOpinion(opinionId: string, amount = 10): Promise<{ success: boolean; opinion?: Opinion; balance?: PointBalance; error?: string }> {
    try {
      const res = await fetch('/api/opinions/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opinionId, amount }),
      });
      return await res.json();
    } catch {
      const { dbService } = await import('./db');
      return dbService.boostOpinion('usr_demo_101', opinionId, amount, true);
    }
  },

  async getUserMe(): Promise<UserProfile | null> {
    try {
      const res = await fetch('/api/user/me');
      if (!res.ok) throw new Error('Failed to fetch user');
      const json = await res.json();
      return json.user;
    } catch {
      const { dbService } = await import('./db');
      const balance = await dbService.getUserBalance('usr_demo_101');
      const postCountToday = await dbService.getDailyPostCount('usr_demo_101');
      return {
        id: 'usr_demo_101',
        displayName: 'Alex Rivers',
        handle: '@alex',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        balance,
        postCountToday,
        maxDailyPosts: 10,
      };
    }
  },

  async getLiveStats(): Promise<PlatformLiveStats> {
    try {
      const res = await fetch('/api/stats/live');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const json = await res.json();
      return json.stats;
    } catch {
      const { dbService } = await import('./db');
      return dbService.getLiveStats();
    }
  },
};
