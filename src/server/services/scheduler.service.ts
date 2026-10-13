import cron from 'node-cron';
import prisma from '../db.js';
import config from '../config/index.js';
import contestService from './contest.service.js';
import emailService from './email.service.js';

export class SchedulerService {
  private contestTask: cron.ScheduledTask | null = null;
  private reminderTask: cron.ScheduledTask | null = null;

  start(): void {
    console.log('[SchedulerService] Initializing background cron jobs...');

    // Initial sync on startup (delayed slightly to allow server boot)
    setTimeout(() => {
      this.runContestSync();
      this.checkAndSendReminders();
    }, 2000);

    // Contest sync schedule
    this.contestTask = cron.schedule(config.contestCronSchedule, async () => {
      console.log('[SchedulerService] Running scheduled contest sync...');
      await this.runContestSync();
    });

    // Reminder dispatch schedule
    this.reminderTask = cron.schedule(config.reminderCronSchedule, async () => {
      await this.checkAndSendReminders();
    });

    console.log('[SchedulerService] Scheduled tasks active.');
  }

  stop(): void {
    if (this.contestTask) this.contestTask.stop();
    if (this.reminderTask) this.reminderTask.stop();
  }

  async runContestSync(): Promise<void> {
    try {
      const result = await contestService.syncAllContests();
      console.log(`[SchedulerService] Contest sync complete: ${result.synced} contests processed.`);
    } catch (err) {
      console.error('[SchedulerService] Error running contest sync:', err);
    }
  }

  /**
   * Main reminder check logic:
   * 1. Morning of contest day: contests starting within 18 hours
   * 2. 2 hours before: contests starting between 105 and 135 minutes from now
   * Deduplicated via ReminderLog table (unique on userId, contestId, reminderType)
   */
  async checkAndSendReminders(): Promise<{ morningCount: number; twoHourCount: number }> {
    const now = new Date();
    let morningCount = 0;
    let twoHourCount = 0;

    try {
      // 1. Check 2-Hour Reminders (Contests starting in 105 - 135 mins)
      const twoHoursAheadStart = new Date(now.getTime() + 105 * 60 * 1000);
      const twoHoursAheadEnd = new Date(now.getTime() + 135 * 60 * 1000);

      const twoHourContests = await prisma.contest.findMany({
        where: {
          startTime: {
            gte: twoHoursAheadStart,
            lte: twoHoursAheadEnd,
          },
        },
      });

      for (const contest of twoHourContests) {
        // Find users opted-in to 2-hour reminders for this platform
        const prefs = await prisma.reminderPreference.findMany({
          where: {
            platform: contest.platform,
            enabled: true,
            hoursBefore2: true,
          },
          include: {
            user: true,
          },
        });

        for (const pref of prefs) {
          const user = pref.user;
          if (!user || !user.email) continue;

          // Check if already sent
          const existingLog = await prisma.reminderLog.findUnique({
            where: {
              userId_contestId_reminderType: {
                userId: user.id,
                contestId: contest.id,
                reminderType: 'HOURS_BEFORE_2',
              },
            },
          });

          if (existingLog) continue;

          const unsubToken = Buffer.from(JSON.stringify({ u: user.id, p: contest.platform })).toString('base64');
          const sent = await emailService.send2HourReminderEmail(
            user.email,
            user.name || 'Competitor',
            contest,
            unsubToken
          );

          if (sent) {
            await prisma.reminderLog.create({
              data: {
                userId: user.id,
                contestId: contest.id,
                reminderType: 'HOURS_BEFORE_2',
              },
            });
            twoHourCount++;
          }
        }
      }

      // 2. Check Morning of Contest Day Reminders
      // Window: starting in 30 minutes up to 18 hours from now
      const morningWindowEnd = new Date(now.getTime() + 18 * 60 * 60 * 1000);
      const morningContests = await prisma.contest.findMany({
        where: {
          startTime: {
            gte: new Date(now.getTime() + 30 * 60 * 1000),
            lte: morningWindowEnd,
          },
        },
      });

      for (const contest of morningContests) {
        const prefs = await prisma.reminderPreference.findMany({
          where: {
            platform: contest.platform,
            enabled: true,
            morningOf: true,
          },
          include: {
            user: true,
          },
        });

        for (const pref of prefs) {
          const user = pref.user;
          if (!user || !user.email) continue;

          // Check if already sent
          const existingLog = await prisma.reminderLog.findUnique({
            where: {
              userId_contestId_reminderType: {
                userId: user.id,
                contestId: contest.id,
                reminderType: 'DAY_OF',
              },
            },
          });

          if (existingLog) continue;

          const unsubToken = Buffer.from(JSON.stringify({ u: user.id, p: contest.platform })).toString('base64');
          const sent = await emailService.sendMorningReminderEmail(
            user.email,
            user.name || 'Competitor',
            contest,
            unsubToken
          );

          if (sent) {
            await prisma.reminderLog.create({
              data: {
                userId: user.id,
                contestId: contest.id,
                reminderType: 'DAY_OF',
              },
            });
            morningCount++;
          }
        }
      }
    } catch (err) {
      console.error('[SchedulerService] Error in checkAndSendReminders:', err);
    }

    return { morningCount, twoHourCount };
  }
}

export const schedulerService = new SchedulerService();
export default schedulerService;
