import crypto from 'crypto';
import prisma from '../db.js';
import { PlatformRegistry } from '../adapters/index.js';

export class SyncService {
  async startLinking(userId: string, platform: string, handle: string) {
    const adapter = PlatformRegistry.getAdapter(platform);
    if (!adapter) {
      throw new Error(`Unsupported platform: "${platform}"`);
    }

    const cleanHandle = handle.trim();
    if (!cleanHandle) {
      throw new Error('Username / handle cannot be empty');
    }

    // Generate unique verification code
    const verificationCode = `mrkcp-${crypto.randomBytes(4).toString('hex')}`;

    const linked = await prisma.linkedAccount.upsert({
      where: {
        userId_platform: {
          userId,
          platform: adapter.platformId,
        },
      },
      update: {
        handle: cleanHandle,
        verificationCode,
        isVerified: false,
        syncStatus: 'IDLE',
        syncError: null,
      },
      create: {
        userId,
        platform: adapter.platformId,
        handle: cleanHandle,
        verificationCode,
        isVerified: false,
        syncStatus: 'IDLE',
      },
    });

    return {
      platform: linked.platform,
      platformName: adapter.platformName,
      handle: linked.handle,
      verificationCode: linked.verificationCode,
      instructions: adapter.profileVerificationInstructions,
      profileUrl: adapter.profileUrlTemplate(linked.handle),
    };
  }

  async verifyHandle(userId: string, platform: string) {
    const linked = await prisma.linkedAccount.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: platform.toLowerCase(),
        },
      },
    });

    if (!linked) {
      throw new Error(`No linked account found for platform "${platform}". Please initiate linking first.`);
    }

    const adapter = PlatformRegistry.getAdapter(platform);
    if (!adapter) {
      throw new Error(`Unsupported platform: "${platform}"`);
    }

    console.log(`[SyncService] Verifying ${adapter.platformName} handle "${linked.handle}" with code "${linked.verificationCode}"...`);
    const result = await adapter.verifyProfile(linked.handle, linked.verificationCode);

    if (result.verified) {
      await prisma.linkedAccount.update({
        where: { id: linked.id },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
          syncStatus: 'IDLE',
          syncError: null,
        },
      });

      // Automatically trigger background sync upon verification
      this.syncAccount(userId, platform).catch((err) => {
        console.error(`[SyncService] Initial auto-sync failed for ${platform}:${linked.handle}:`, err);
      });
    }

    return result;
  }

  async syncAccount(userId: string, platform: string) {
    const linked = await prisma.linkedAccount.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: platform.toLowerCase(),
        },
      },
    });

    if (!linked) {
      throw new Error(`No linked account found for platform "${platform}"`);
    }

    if (!linked.isVerified) {
      throw new Error(`Cannot sync unverified account for platform "${platform}". Please verify your handle first.`);
    }

    const adapter = PlatformRegistry.getAdapter(platform);
    if (!adapter) {
      throw new Error(`Unsupported platform: "${platform}"`);
    }

    await prisma.linkedAccount.update({
      where: { id: linked.id },
      data: { syncStatus: 'SYNCING', syncError: null },
    });

    try {
      console.log(`[SyncService] Fetching solved problems from ${adapter.platformName} for handle "${linked.handle}"...`);
      const solvedList = await adapter.fetchSolvedProblems(linked.handle);

      let addedCount = 0;
      for (const item of solvedList) {
        await prisma.journalEntry.upsert({
          where: {
            userId_platform_problemId: {
              userId,
              platform: item.platform,
              problemId: item.platformProblemId,
            },
          },
          update: {
            title: item.title,
            url: item.url,
            tags: JSON.stringify(item.tags || []),
            difficulty: item.difficulty || null,
            rating: item.rating || null,
            verdict: item.verdict || 'AC',
          },
          create: {
            userId,
            platform: item.platform,
            problemId: item.platformProblemId,
            title: item.title,
            url: item.url,
            solvedAt: item.solvedAt,
            tags: JSON.stringify(item.tags || []),
            difficulty: item.difficulty || null,
            rating: item.rating || null,
            verdict: item.verdict || 'AC',
            source: 'SYNC',
          },
        });
        addedCount++;
      }

      await prisma.linkedAccount.update({
        where: { id: linked.id },
        data: {
          lastSyncedAt: new Date(),
          syncStatus: 'SUCCESS',
          syncError: null,
        },
      });

      console.log(`[SyncService] Synced ${addedCount} solved problems from ${platform} for user ${userId}.`);
      return { totalFetched: solvedList.length, saved: addedCount };
    } catch (err: any) {
      console.error(`[SyncService] Sync failed for ${platform}:${linked.handle}:`, err);
      await prisma.linkedAccount.update({
        where: { id: linked.id },
        data: {
          syncStatus: 'ERROR',
          syncError: err.message || 'Sync failed',
        },
      });
      throw err;
    }
  }

  async syncAllAccountsForUser(userId: string) {
    const linkedAccounts = await prisma.linkedAccount.findMany({
      where: { userId, isVerified: true },
    });

    const results: Record<string, any> = {};
    for (const acc of linkedAccounts) {
      try {
        results[acc.platform] = await this.syncAccount(userId, acc.platform);
      } catch (err: any) {
        results[acc.platform] = { error: err.message };
      }
    }
    return results;
  }
}

export const syncService = new SyncService();
export default syncService;
