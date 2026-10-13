import axios from 'axios';
import { PlatformAdapter, SolvedProblem, UpcomingContest, VerificationResult } from './base.adapter.js';

export class CodeforcesAdapter implements PlatformAdapter {
  readonly platformId = 'codeforces';
  readonly platformName = 'Codeforces';
  readonly profileVerificationInstructions =
    'Paste your verification code into the "First Name", "Last Name", or "Organization" field on your Codeforces profile settings (https://codeforces.com/settings/social). You can remove it after verification.';
  readonly profileUrlTemplate = (handle: string) => `https://codeforces.com/profile/${handle}`;

  async verifyProfile(handle: string, verificationCode: string): Promise<VerificationResult> {
    try {
      const response = await axios.get(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`, {
        timeout: 10000,
      });

      if (response.data?.status !== 'OK' || !response.data?.result?.length) {
        return {
          verified: false,
          message: `Codeforces user "${handle}" was not found.`,
        };
      }

      const user = response.data.result[0];
      const searchTargets = [
        user.firstName || '',
        user.lastName || '',
        user.organization || '',
        user.city || '',
      ].join(' ');

      const verified = searchTargets.includes(verificationCode.trim());
      if (verified) {
        return {
          verified: true,
          message: 'Codeforces profile successfully verified!',
        };
      }

      return {
        verified: false,
        message: `Verification code "${verificationCode}" not found in your Codeforces name or organization field.`,
      };
    } catch (error: any) {
      const errorMsg = error.response?.data?.comment || error.message || 'Unknown error';
      return {
        verified: false,
        message: `Failed to connect to Codeforces API: ${errorMsg}`,
      };
    }
  }

  async fetchSolvedProblems(handle: string): Promise<SolvedProblem[]> {
    try {
      const response = await axios.get(
        `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=2000`,
        { timeout: 15000 }
      );

      if (response.data?.status !== 'OK' || !Array.isArray(response.data?.result)) {
        return [];
      }

      const solvedMap = new Map<string, SolvedProblem>();

      for (const sub of response.data.result) {
        if (sub.verdict === 'OK' && sub.problem && sub.problem.contestId && sub.problem.index) {
          const problemId = `${sub.problem.contestId}${sub.problem.index}`;
          const existing = solvedMap.get(problemId);
          const solvedAt = new Date(sub.creationTimeSeconds * 1000);

          // Keep earliest solve time or add new
          if (!existing || solvedAt < existing.solvedAt) {
            solvedMap.set(problemId, {
              platformProblemId: problemId,
              title: `${sub.problem.index}. ${sub.problem.name}`,
              platform: this.platformId,
              url: `https://codeforces.com/contest/${sub.problem.contestId}/problem/${sub.problem.index}`,
              solvedAt,
              verdict: 'AC',
              tags: Array.isArray(sub.problem.tags) ? sub.problem.tags : [],
              difficulty: sub.problem.rating ? String(sub.problem.rating) : undefined,
              rating: sub.problem.rating || undefined,
            });
          }
        }
      }

      return Array.from(solvedMap.values());
    } catch (error) {
      console.error(`[CodeforcesAdapter] Error fetching solved problems for ${handle}:`, error);
      return [];
    }
  }

  async fetchUpcomingContests(): Promise<UpcomingContest[]> {
    try {
      const response = await axios.get('https://codeforces.com/api/contest.list?gym=false', {
        timeout: 10000,
      });

      if (response.data?.status !== 'OK' || !Array.isArray(response.data?.result)) {
        return [];
      }

      const upcoming: UpcomingContest[] = [];
      for (const c of response.data.result) {
        if (c.phase === 'BEFORE') {
          const startTime = new Date(c.startTimeSeconds * 1000);
          const endTime = new Date((c.startTimeSeconds + c.durationSeconds) * 1000);
          upcoming.push({
            platform: this.platformId,
            externalId: String(c.id),
            name: c.name,
            url: `https://codeforces.com/contests/${c.id}`,
            startTime,
            endTime,
            durationSeconds: c.durationSeconds,
            phase: 'BEFORE',
            rawMetadata: { type: c.type, frozen: c.frozen },
          });
        }
      }

      return upcoming;
    } catch (error) {
      console.error('[CodeforcesAdapter] Error fetching upcoming contests:', error);
      return [];
    }
  }
}
