import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/server/db.js';
import recommendationService from '../src/server/services/recommendation.service.js';

describe('Topic-based Recommendations', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `rec_test_${Date.now()}@example.com`,
        passwordHash: 'dummy',
        name: 'Rec Tester',
        isVerified: true,
      },
    });
    testUserId = user.id;

    // Log one DP problem as solved by this user (CSES Dice Combinations - 1633)
    await prisma.journalEntry.create({
      data: {
        userId: testUserId,
        platform: 'cses',
        problemId: '1633',
        title: 'Dice Combinations',
        url: 'https://cses.fi/problemset/task/1633',
        solvedAt: new Date(),
        verdict: 'AC',
        source: 'MANUAL',
      },
    });
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
  });

  it('retrieves topics with non-zero problem counts', async () => {
    const topics = await recommendationService.getTopics();
    expect(topics.length).toBeGreaterThanOrEqual(5);

    const dpTopic = topics.find((t) => t.name === 'Dynamic Programming');
    expect(dpTopic).toBeDefined();
    expect(dpTopic!.count).toBeGreaterThanOrEqual(10);
  });

  it('recommends problems ordered from easy to hard for a topic', async () => {
    const recs = await recommendationService.getRecommendations(undefined, {
      topic: 'Dynamic Programming',
    });

    expect(recs.problems.length).toBeGreaterThanOrEqual(10);
    // Verify first problem has orderIndex <= last problem
    const first = recs.problems[0];
    const last = recs.problems[recs.problems.length - 1];
    expect(first.orderIndex).toBeLessThanOrEqual(last.orderIndex);
  });

  it('correctly marks solved problems and filters them when hideSolved is enabled', async () => {
    // When hideSolved is false: all problems returned, but Dice Combinations marked isSolved = true
    const recsWithSolved = await recommendationService.getRecommendations(testUserId, {
      topic: 'Dynamic Programming',
      hideSolved: false,
    });

    const diceProblem = recsWithSolved.problems.find(
      (p) => p.platform === 'cses' && p.externalId === '1633'
    );
    expect(diceProblem).toBeDefined();
    expect(diceProblem!.isSolved).toBe(true);

    // When hideSolved is true: Dice Combinations should be filtered out
    const recsWithoutSolved = await recommendationService.getRecommendations(testUserId, {
      topic: 'Dynamic Programming',
      hideSolved: true,
    });

    const hiddenDice = recsWithoutSolved.problems.find(
      (p) => p.platform === 'cses' && p.externalId === '1633'
    );
    expect(hiddenDice).toBeUndefined();
  });

  it('retrieves the dedicated curated LeetCode set', async () => {
    const leetcodeSet = await recommendationService.getLeetCodeCuratedSet();
    expect(leetcodeSet.problems.length).toBeGreaterThanOrEqual(20);

    for (const prob of leetcodeSet.problems) {
      expect(prob.platform).toBe('leetcode');
      expect(prob.url).toContain('leetcode.com');
    }
  });
});
