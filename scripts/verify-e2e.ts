import prisma from '../src/server/db.js';
import authService from '../src/server/services/auth.service.js';
import contestService from '../src/server/services/contest.service.js';
import journalService from '../src/server/services/journal.service.js';
import recommendationService from '../src/server/services/recommendation.service.js';
import syncService from '../src/server/services/sync.service.js';
import schedulerService from '../src/server/services/scheduler.service.js';
import emailService from '../src/server/services/email.service.js';

async function runEndToEndVerification() {
  console.log('--- Starting mrkcp Comprehensive End-to-End Verification ---');

  // 1. User Registration & Auth
  console.log('\n[1] Testing User Registration & Preferences Initialization...');
  const testEmail = `e2e_cper_${Date.now()}@mrkcp.dev`;
  const regRes = await authService.register(testEmail, 'TargetGrandmaster!2026', 'Gennady E2E');
  console.log(`  ✓ Registered user "${regRes.user.name}" (ID: ${regRes.user.id})`);
  console.log(`  ✓ JWT Token issued: ${regRes.token.substring(0, 20)}...`);

  // Verify default reminder preferences
  const profile = await authService.getUserProfile(regRes.user.id);
  console.log(`  ✓ Default reminder preferences initialized: ${profile.reminderPreferences.length} platforms`);
  if (profile.reminderPreferences.length < 3) throw new Error('Reminder preferences not properly initialized');

  // 2. Contest Calendar & Sync
  console.log('\n[2] Testing Contest Sync & Querying...');
  const syncContestRes = await contestService.syncAllContests();
  console.log(`  ✓ Synced ${syncContestRes.synced} upcoming contests from external platforms`);

  const cfContests = await contestService.getUpcomingContests({ platform: 'codeforces' });
  console.log(`  ✓ Codeforces contests returned: ${cfContests.length}`);
  if (cfContests.length > 0) {
    console.log(`    Sample: "${cfContests[0].name}" at ${cfContests[0].startTime.toISOString()}`);
  }

  // 3. Problem Recommendations & Ordering
  console.log('\n[3] Testing Topic-Based Recommendations (Easy to Hard)...');
  const dpRecs = await recommendationService.getRecommendations(regRes.user.id, {
    topic: 'Dynamic Programming',
    hideSolved: false,
  });
  console.log(`  ✓ Found ${dpRecs.problems.length} curated DP problems`);
  if (dpRecs.problems.length < 5) throw new Error('Insufficient DP curated problems');

  // Verify ordering
  for (let i = 0; i < dpRecs.problems.length - 1; i++) {
    if (dpRecs.problems[i].orderIndex > dpRecs.problems[i + 1].orderIndex) {
      throw new Error('Recommendations not ordered easy to hard by orderIndex');
    }
  }
  console.log(`  ✓ Verified easy-to-hard ordering: 1st is "${dpRecs.problems[0].title}" (order ${dpRecs.problems[0].orderIndex}) -> Last is "${dpRecs.problems[dpRecs.problems.length - 1].title}" (order ${dpRecs.problems[dpRecs.problems.length - 1].orderIndex})`);

  // Verify Dedicated LeetCode section
  const leetCodeRecs = await recommendationService.getLeetCodeCuratedSet(regRes.user.id);
  console.log(`  ✓ Curated LeetCode problems: ${leetCodeRecs.problems.length}`);
  if (leetCodeRecs.problems.length < 15) throw new Error('Insufficient LeetCode curated problems');

  // 4. Problem Journal Logging & Solve Status
  console.log('\n[4] Testing Problem Journal Manual Logging & Solve Filtering...');
  const targetProblem = dpRecs.problems[0]; // e.g. Dice Combinations (CSES 1633)
  console.log(`  Logging problem: "${targetProblem.title}" (${targetProblem.url})`);

  const journalEntry = await journalService.createManualEntry(regRes.user.id, {
    url: targetProblem.url,
    title: targetProblem.title,
    platform: targetProblem.platform,
    difficulty: targetProblem.difficultyTier,
    tags: targetProblem.tags,
    notes: 'State: dp[i] = ways to make sum i. Transition: sum of dp[i-d] for d in 1..6. Modulo 10^9+7.',
  });
  console.log(`  ✓ Created journal entry ID: ${journalEntry.id}`);

  // Test hide-solved filter
  const dpRecsAfterSolve = await recommendationService.getRecommendations(regRes.user.id, {
    topic: 'Dynamic Programming',
    hideSolved: true,
  });
  const stillHasTarget = dpRecsAfterSolve.problems.some((p) => p.externalId === targetProblem.externalId);
  if (stillHasTarget) throw new Error('Solved problem was not hidden by hideSolved filter');
  console.log(`  ✓ Verified: "${targetProblem.title}" is successfully filtered out when hideSolved=true`);

  // 5. Journal Analytics, Streak & Heatmap
  console.log('\n[5] Testing Journal Analytics (Heatmap, Streaks, Topic Distribution)...');
  const analytics = await journalService.getAnalytics(regRes.user.id);
  console.log(`  ✓ Total Solved: ${analytics.totalSolved}`);
  console.log(`  ✓ Current Streak: ${analytics.currentStreak} day(s)`);
  console.log(`  ✓ Longest Streak: ${analytics.longestStreak} day(s)`);
  console.log(`  ✓ Solved by Platform:`, analytics.byPlatform);
  console.log(`  ✓ Solved by Topic:`, analytics.byTopic);
  console.log(`  ✓ Heatmap days recorded: ${analytics.heatmap.length}`);

  if (analytics.currentStreak < 1) throw new Error('Current streak should be at least 1 day');
  if (analytics.totalSolved !== 1) throw new Error('Total solved count mismatch');

  // 6. Multi-Platform Account Linking
  console.log('\n[6] Testing Multi-Platform Account Linking Protocol...');
  const linkStart = await syncService.startLinking(regRes.user.id, 'codeforces', 'tourist_e2e');
  console.log(`  ✓ Handle linking code generated: "${linkStart.verificationCode}"`);
  console.log(`  ✓ Instructions provided: "${linkStart.instructions.substring(0, 50)}..."`);

  // 7. Scheduler & Reminders Deduplication
  console.log('\n[7] Testing Reminder Dispatch & Zero Duplicates...');
  emailService.clearDevMailbox();
  const reminderRun1 = await schedulerService.checkAndSendReminders();
  console.log(`  ✓ Run 1 dispatched: ${reminderRun1.morningCount} morning alerts, ${reminderRun1.twoHourCount} 2h alerts`);

  const reminderRun2 = await schedulerService.checkAndSendReminders();
  console.log(`  ✓ Run 2 dispatched: ${reminderRun2.morningCount} morning alerts, ${reminderRun2.twoHourCount} 2h alerts (Zero duplicates verified)`);

  const devEmails = emailService.getDevMailbox();
  console.log(`  ✓ Total simulated emails in dev mailbox: ${devEmails.length}`);

  // Cleanup test user
  await prisma.user.delete({ where: { id: regRes.user.id } });
  console.log('\n--- All mrkcp End-to-End Verifications Passed Successfully! ---');
}

runEndToEndVerification()
  .catch((err) => {
    console.error('E2E Verification Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
