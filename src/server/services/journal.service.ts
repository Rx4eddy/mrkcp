import prisma from '../db.js';
import { format, subDays, startOfDay, parseISO } from 'date-fns';

export interface JournalFilters {
  platform?: string;
  topic?: string;
  difficulty?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class JournalService {
  async getEntries(userId: string, filters: JournalFilters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (filters.platform && filters.platform !== 'all') {
      where.platform = filters.platform.toLowerCase();
    }

    if (filters.difficulty && filters.difficulty !== 'all') {
      where.difficulty = filters.difficulty;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { problemId: { contains: filters.search } },
        { notes: { contains: filters.search } },
      ];
    }

    if (filters.topic && filters.topic !== 'all') {
      where.tags = { contains: filters.topic.toLowerCase() };
    }

    const [total, entries] = await Promise.all([
      prisma.journalEntry.count({ where }),
      prisma.journalEntry.findMany({
        where,
        orderBy: { solvedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      entries: entries.map((e) => ({
        ...e,
        tags: JSON.parse(e.tags || '[]'),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createManualEntry(
    userId: string,
    data: {
      url: string;
      title?: string;
      platform?: string;
      solvedAt?: string | Date;
      difficulty?: string;
      rating?: number;
      tags?: string[];
      notes?: string;
    }
  ) {
    let platform = (data.platform || 'manual').toLowerCase();
    let problemId = `manual_${Date.now()}`;
    let title = data.title || 'Custom Problem';

    // Auto-detect platform and problemId from URL if possible
    if (data.url.includes('codeforces.com')) {
      platform = 'codeforces';
      const match = data.url.match(/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/);
      if (match) problemId = `${match[1]}${match[2]}`;
    } else if (data.url.includes('atcoder.jp')) {
      platform = 'atcoder';
      const match = data.url.match(/tasks\/([a-zA-Z0-9_]+)/);
      if (match) problemId = match[1];
    } else if (data.url.includes('codechef.com')) {
      platform = 'codechef';
      const match = data.url.match(/problems\/([a-zA-Z0-9_]+)/);
      if (match) problemId = match[1];
    } else if (data.url.includes('cses.fi')) {
      platform = 'cses';
      const match = data.url.match(/task\/(\d+)/);
      if (match) problemId = match[1];
    } else if (data.url.includes('leetcode.com')) {
      platform = 'leetcode';
      const match = data.url.match(/problems\/([a-zA-Z0-9-]+)/);
      if (match) problemId = match[1];
    }

    if (!data.title && problemId) {
      title = `${platform.toUpperCase()} - ${problemId}`;
    }

    const solvedAt = data.solvedAt
      ? typeof data.solvedAt === 'string'
        ? parseISO(data.solvedAt)
        : data.solvedAt
      : new Date();

    const entry = await prisma.journalEntry.upsert({
      where: {
        userId_platform_problemId: {
          userId,
          platform,
          problemId,
        },
      },
      update: {
        title,
        url: data.url,
        solvedAt,
        difficulty: data.difficulty || undefined,
        rating: data.rating || undefined,
        tags: JSON.stringify(data.tags || []),
        notes: data.notes || undefined,
      },
      create: {
        userId,
        platform,
        problemId,
        title,
        url: data.url,
        solvedAt,
        difficulty: data.difficulty || null,
        rating: data.rating || null,
        tags: JSON.stringify(data.tags || []),
        notes: data.notes || null,
        source: 'MANUAL',
      },
    });

    return {
      ...entry,
      tags: JSON.parse(entry.tags || '[]'),
    };
  }

  async updateEntry(
    userId: string,
    entryId: string,
    data: {
      notes?: string;
      tags?: string[];
      difficulty?: string;
      rating?: number;
      title?: string;
    }
  ) {
    const entry = await prisma.journalEntry.findFirst({
      where: { id: entryId, userId },
    });

    if (!entry) throw new Error('Journal entry not found');

    const updated = await prisma.journalEntry.update({
      where: { id: entryId },
      data: {
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.tags !== undefined ? { tags: JSON.stringify(data.tags) } : {}),
        ...(data.difficulty !== undefined ? { difficulty: data.difficulty } : {}),
        ...(data.rating !== undefined ? { rating: data.rating } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
      },
    });

    return {
      ...updated,
      tags: JSON.parse(updated.tags || '[]'),
    };
  }

  async deleteEntry(userId: string, entryId: string) {
    const entry = await prisma.journalEntry.findFirst({
      where: { id: entryId, userId },
    });

    if (!entry) throw new Error('Journal entry not found');

    await prisma.journalEntry.delete({
      where: { id: entryId },
    });

    return { success: true };
  }

  async getAnalytics(userId: string) {
    const entries = await prisma.journalEntry.findMany({
      where: { userId },
      select: {
        platform: true,
        solvedAt: true,
        difficulty: true,
        tags: true,
      },
    });

    // 1. By Platform
    const byPlatform: Record<string, number> = {};
    for (const e of entries) {
      byPlatform[e.platform] = (byPlatform[e.platform] || 0) + 1;
    }

    // 2. By Topic
    const topicKeywords: Record<string, string[]> = {
      'Dynamic Programming': ['dp', 'knapsack', 'lis', 'lcs'],
      'Graphs': ['graph', 'graphs', 'bfs', 'dfs', 'dijkstra', 'shortest paths', 'mst', 'trees', 'tree'],
      'Binary Search': ['binary search', 'binary-search', 'two-pointers', 'two pointers'],
      'Greedy': ['greedy', 'sorting'],
      'Data Structures': ['data structures', 'segment-tree', 'fenwick-tree', 'dsu', 'heap', 'stack', 'queue'],
      'Math & Number Theory': ['math', 'number theory', 'combinatorics', 'geometry', 'primes'],
      'Strings': ['strings', 'string', 'kmp', 'z-algorithm', 'trie', 'hashing'],
      'Bit Manipulation': ['bitmask', 'bit manipulation', 'bitset', 'xor'],
    };

    const byTopic: Record<string, number> = {};
    for (const topic of Object.keys(topicKeywords)) {
      byTopic[topic] = 0;
    }

    for (const e of entries) {
      let tags: string[] = [];
      try {
        tags = JSON.parse(e.tags || '[]');
      } catch {
        tags = [];
      }
      const tagStr = tags.join(' ').toLowerCase();

      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some((k) => tagStr.includes(k))) {
          byTopic[topic] = (byTopic[topic] || 0) + 1;
        }
      }
    }

    // 3. Heatmap (past 365 days)
    const today = startOfDay(new Date());
    const dayMap = new Map<string, number>();

    // Prepopulate last 365 days with 0
    for (let i = 365; i >= 0; i--) {
      const d = subDays(today, i);
      const key = format(d, 'yyyy-MM-dd');
      dayMap.set(key, 0);
    }

    for (const e of entries) {
      const dayKey = format(startOfDay(new Date(e.solvedAt)), 'yyyy-MM-dd');
      if (dayMap.has(dayKey)) {
        dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
      }
    }

    const heatmap = Array.from(dayMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // 4. Streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let runningStreak = 0;
    let totalActiveDays = 0;

    // Check each day starting from 365 days ago to today
    for (let i = 365; i >= 0; i--) {
      const d = subDays(today, i);
      const key = format(d, 'yyyy-MM-dd');
      const count = dayMap.get(key) || 0;

      if (count > 0) {
        totalActiveDays++;
        runningStreak++;
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
    }

    // Current streak: count backwards from today (or yesterday if no solves today yet)
    let checkDate = today;
    const todayCount = dayMap.get(format(today, 'yyyy-MM-dd')) || 0;
    if (todayCount === 0) {
      checkDate = subDays(today, 1);
    }

    while (true) {
      const key = format(checkDate, 'yyyy-MM-dd');
      const count = dayMap.get(key) || 0;
      if (count > 0) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    return {
      totalSolved: entries.length,
      totalActiveDays,
      currentStreak,
      longestStreak,
      byPlatform,
      byTopic,
      heatmap,
    };
  }
}

export const journalService = new JournalService();
export default journalService;
