import prisma from '../db.js';

export interface RecommendationQuery {
  topic?: string;
  difficulty?: string;
  platform?: string;
  hideSolved?: boolean;
}

export class RecommendationService {
  async getTopics(): Promise<Array<{ name: string; count: number }>> {
    const problems = await prisma.curatedProblem.findMany({
      select: { topic: true },
    });

    const topicCounts: Record<string, number> = {};
    for (const p of problems) {
      topicCounts[p.topic] = (topicCounts[p.topic] || 0) + 1;
    }

    return Object.entries(topicCounts).map(([name, count]) => ({
      name,
      count,
    }));
  }

  async getRecommendations(userId?: string, query: RecommendationQuery = {}) {
    const where: any = {};

    if (query.topic && query.topic !== 'all') {
      where.topic = query.topic;
    }

    if (query.difficulty && query.difficulty !== 'all') {
      where.difficultyTier = query.difficulty;
    }

    if (query.platform && query.platform !== 'all') {
      where.platform = query.platform.toLowerCase();
    }

    // Fetch candidate curated problems ordered easy to hard
    const curatedProblems = await prisma.curatedProblem.findMany({
      where,
      orderBy: [
        { topic: 'asc' },
        { orderIndex: 'asc' },
        { rating: 'asc' },
      ],
    });

    // If userId provided, check which problems have been solved
    const solvedSet = new Set<string>();

    if (userId) {
      const userEntries = await prisma.journalEntry.findMany({
        where: { userId },
        select: {
          platform: true,
          problemId: true,
          url: true,
          title: true,
        },
      });

      for (const entry of userEntries) {
        // Track by platform + problemId, and by URL
        solvedSet.add(`${entry.platform}:${entry.problemId}`.toLowerCase());
        if (entry.url) solvedSet.add(entry.url.toLowerCase());
      }
    }

    const annotatedProblems = curatedProblems.map((prob) => {
      const isSolved =
        solvedSet.has(`${prob.platform}:${prob.externalId}`.toLowerCase()) ||
        solvedSet.has(prob.url.toLowerCase());

      return {
        ...prob,
        tags: JSON.parse(prob.tags || '[]'),
        isSolved,
      };
    });

    // If hideSolved requested, filter out solved problems
    const results = query.hideSolved
      ? annotatedProblems.filter((p) => !p.isSolved)
      : annotatedProblems;

    return {
      problems: results,
      totalCount: results.length,
      solvedCount: annotatedProblems.filter((p) => p.isSolved).length,
    };
  }

  async getLeetCodeCuratedSet(userId?: string) {
    return this.getRecommendations(userId, { platform: 'leetcode' });
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;
