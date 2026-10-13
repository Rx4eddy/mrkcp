import prisma from '../db.js';
import { PlatformRegistry } from '../adapters/index.js';

export class ContestService {
  async syncAllContests(): Promise<{ synced: number; errors: Record<string, string> }> {
    const adapters = PlatformRegistry.getAllAdapters();
    let totalSynced = 0;
    const errors: Record<string, string> = {};

    for (const adapter of adapters) {
      if (typeof adapter.fetchUpcomingContests !== 'function') {
        continue;
      }

      try {
        console.log(`[ContestService] Fetching upcoming contests from ${adapter.platformName}...`);
        const contests = await adapter.fetchUpcomingContests();

        for (const contest of contests) {
          await prisma.contest.upsert({
            where: {
              platform_externalId: {
                platform: contest.platform,
                externalId: contest.externalId,
              },
            },
            update: {
              name: contest.name,
              url: contest.url,
              startTime: contest.startTime,
              endTime: contest.endTime,
              durationSeconds: contest.durationSeconds,
              phase: contest.phase,
              rawMetadata: contest.rawMetadata ? JSON.stringify(contest.rawMetadata) : null,
            },
            create: {
              platform: contest.platform,
              externalId: contest.externalId,
              name: contest.name,
              url: contest.url,
              startTime: contest.startTime,
              endTime: contest.endTime,
              durationSeconds: contest.durationSeconds,
              phase: contest.phase,
              rawMetadata: contest.rawMetadata ? JSON.stringify(contest.rawMetadata) : null,
            },
          });
          totalSynced++;
        }
        console.log(`[ContestService] Synced ${contests.length} contests from ${adapter.platformName}.`);
      } catch (err: any) {
        console.error(`[ContestService] Error syncing contests for ${adapter.platformId}:`, err);
        errors[adapter.platformId] = err.message || 'Unknown sync error';
      }
    }

    return { synced: totalSynced, errors };
  }

  async getUpcomingContests(filters?: {
    platform?: string;
    from?: Date;
    to?: Date;
    search?: string;
  }) {
    const now = filters?.from || new Date();
    const where: any = {
      endTime: {
        gte: now,
      },
    };

    if (filters?.platform && filters.platform !== 'all') {
      where.platform = filters.platform.toLowerCase();
    }

    if (filters?.to) {
      where.startTime = {
        lte: filters.to,
      };
    }

    if (filters?.search) {
      where.name = {
        contains: filters.search,
      };
    }

    return prisma.contest.findMany({
      where,
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async getContestById(id: string) {
    return prisma.contest.findUnique({
      where: { id },
    });
  }
}

export const contestService = new ContestService();
export default contestService;
