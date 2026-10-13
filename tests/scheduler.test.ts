import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/server/db.js';
import schedulerService from '../src/server/services/scheduler.service.js';
import emailService from '../src/server/services/email.service.js';

describe('Scheduler and Email Reminders', () => {
  let testUserId: string;
  let testUserEmail: string;
  let testContestId: string;

  beforeAll(async () => {
    emailService.clearDevMailbox();

    // Create a unique test user
    const user = await prisma.user.create({
      data: {
        email: `sched_test_${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        name: 'Scheduler Tester',
        isVerified: true,
      },
    });
    testUserId = user.id;
    testUserEmail = user.email;

    // Enable 2-hour and morning reminders for codeforces
    await prisma.reminderPreference.create({
      data: {
        userId: testUserId,
        platform: 'codeforces',
        enabled: true,
        morningOf: true,
        hoursBefore2: true,
      },
    });

    // Create a test contest starting in exactly 120 minutes (2 hours)
    const startTime = new Date(Date.now() + 120 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

    const contest = await prisma.contest.create({
      data: {
        platform: 'codeforces',
        externalId: `test_cf_${Date.now()}`,
        name: 'Codeforces Round 9999 (Div. 2)',
        url: 'https://codeforces.com/contests/9999',
        startTime,
        endTime,
        durationSeconds: 7200,
        phase: 'BEFORE',
      },
    });
    testContestId = contest.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    if (testContestId) {
      await prisma.contest.delete({ where: { id: testContestId } }).catch(() => {});
    }
  });

  it('dispatches reminder email for contest starting in 2 hours and prevents duplicates', async () => {
    // 1st Run: Should find the contest and dispatch
    const result1 = await schedulerService.checkAndSendReminders();
    expect(result1.twoHourCount).toBeGreaterThanOrEqual(1);

    // Verify reminder log was recorded in database
    const log = await prisma.reminderLog.findUnique({
      where: {
        userId_contestId_reminderType: {
          userId: testUserId,
          contestId: testContestId,
          reminderType: 'HOURS_BEFORE_2',
        },
      },
    });
    expect(log).toBeDefined();

    // Verify email was generated
    const devEmails = emailService.getDevMailbox();
    const contestEmail = devEmails.find(
      (e) => e.to === testUserEmail && e.type === 'REMINDER_2H' && e.contestName?.includes('Round 9999')
    );
    expect(contestEmail).toBeDefined();

    // 2nd Run immediately: Should skip and NOT send duplicate
    const result2 = await schedulerService.checkAndSendReminders();
    // For this specific test user and contest, no second email should be dispatched
    const secondEmails = emailService
      .getDevMailbox()
      .filter((e) => e.to === testUserEmail && e.type === 'REMINDER_2H' && e.contestName?.includes('Round 9999'));

    expect(secondEmails.length).toBe(1); // Still exactly 1 email, no duplicate!
  });
});
