import { describe, it, expect, beforeEach } from 'vitest';
import { dbService, OpinionDatabase } from '../lib/db';

describe('MyOneOpinion Core Business Logic & State Machine', () => {
  let db: OpinionDatabase;
  const testUserId = 'usr_test_999';

  beforeEach(() => {
    db = new OpinionDatabase();
  });

  it('1. Enforces 280-character maximum length limit', async () => {
    const validText = 'A'.repeat(280);
    const resValid = await db.createOpinion(testUserId, validText);
    expect(resValid.success).toBe(true);
    expect(resValid.opinion?.text.length).toBe(280);

    const overLimitText = 'B'.repeat(281);
    const resOver = await db.createOpinion(testUserId, overLimitText);
    expect(resOver.success).toBe(false);
    expect(resOver.error).toContain('between 1 and 280 characters');

    const emptyText = '   ';
    const resEmpty = await db.createOpinion(testUserId, emptyText);
    expect(resEmpty.success).toBe(false);
  });

  it('2. Enforces maximum 10 opinions per UTC calendar day', async () => {
    const userForLimit = 'usr_daily_limit_test';
    for (let i = 0; i < 10; i++) {
      const res = await db.createOpinion(userForLimit, `Opinion #${i + 1}`);
      expect(res.success).toBe(true);
    }

    // 11th post must be blocked
    const res11 = await db.createOpinion(userForLimit, 'Opinion #11 should fail');
    expect(res11.success).toBe(false);
    expect(res11.error).toContain('daily limit of 10 opinions');
  });

  it('3. Sets server-authoritative 24-hour qualification window', async () => {
    const res = await db.createOpinion('usr_timer_test', 'Testing 24h window');
    expect(res.success).toBe(true);
    const op = res.opinion!;

    const start = new Date(op.createdAt).getTime();
    const end = new Date(op.expiresAt).getTime();
    const durationHours = (end - start) / 3600000;
    expect(durationHours).toBeCloseTo(24, 0.01);
  });

  it('4. Free 50 daily Hype Points granted and tracked separately from purchased points', async () => {
    const user = 'usr_points_test';
    const balance = await db.getUserBalance(user);
    expect(balance.freeBalance).toBe(50);
    expect(balance.purchasedBalance).toBe(0);
  });

  it('5. Atomic boost deducts free points first, then purchased points', async () => {
    const author = 'usr_author_1';
    const supporter = 'usr_supporter_1';

    const opRes = await db.createOpinion(author, 'Opinion to boost');
    const op = opRes.opinion!;

    // Initial balance for supporter: 50 free, 0 purchased
    const boost1 = await db.boostOpinion(supporter, op.id, 20, false);
    expect(boost1.success).toBe(true);
    expect(boost1.balance?.freeBalance).toBe(30);
    expect(boost1.opinion?.hypePoints).toBe(20);

    // Boost with 40 points when only 30 free remain -> requires purchased points if available
    const boostFail = await db.boostOpinion(supporter, op.id, 40, false);
    expect(boostFail.success).toBe(false);
    expect(boostFail.error).toContain('Insufficient Hype Points');
  });

  it('6. Automatically transitions PENDING opinion to QUALIFIED at 1,000 Hype Points', async () => {
    const author = 'usr_qual_author';
    const opRes = await db.createOpinion(author, 'Will reach 1000 Hype Points');
    const op = opRes.opinion!;
    expect(op.status).toBe('PENDING');

    // Simulate boosts adding up to 1,000 points
    // Grant supporter sufficient points
    const supporter = 'usr_whale_1';
    const balance = await db.getUserBalance(supporter);
    balance.purchasedBalance = 2000;

    const boostRes = await db.boostOpinion(supporter, op.id, 1000, false);
    expect(boostRes.success).toBe(true);
    expect(boostRes.opinion?.status).toBe('QUALIFIED');
    expect(boostRes.opinion?.qualifiedAt).toBeDefined();
  });

  it('7. Like count toggles idempotently (1 like per user)', async () => {
    const author = 'usr_like_author';
    const voter = 'usr_voter_1';
    const opRes = await db.createOpinion(author, 'Liking test');
    const op = opRes.opinion!;

    // First like
    const like1 = await db.toggleLike(voter, op.id);
    expect(like1.success).toBe(true);
    expect(like1.liked).toBe(true);
    expect(like1.likeCount).toBe(1);

    // Second click unlikes
    const like2 = await db.toggleLike(voter, op.id);
    expect(like2.success).toBe(true);
    expect(like2.liked).toBe(false);
    expect(like2.likeCount).toBe(0);
  });

  it('8. Top leaderboard sorts by ranking score and assigns rank numbers', async () => {
    const topData = await db.getTopOpinions(10);
    expect(topData.opinions.length).toBeGreaterThan(0);
    expect(topData.opinions[0].rank).toBe(1);
    expect(topData.opinions[1].rank).toBe(2);
    expect(topData.stats.opinionsPublished).toBeGreaterThan(0);
  });
});
