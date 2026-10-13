import axios from 'axios';
import * as cheerio from 'cheerio';
import { PlatformAdapter, SolvedProblem, VerificationResult } from './base.adapter.js';

export class CSESAdapter implements PlatformAdapter {
  readonly platformId = 'cses';
  readonly platformName = 'CSES';
  readonly profileVerificationInstructions =
    'Your CSES user ID is the numeric ID in your profile URL (e.g. 12345 in cses.fi/user/12345). Paste the verification code into your account name or profile info on CSES.';
  readonly profileUrlTemplate = (handle: string) => `https://cses.fi/user/${handle}`;

  async verifyProfile(handle: string, verificationCode: string): Promise<VerificationResult> {
    try {
      const response = await axios.get(`https://cses.fi/user/${encodeURIComponent(handle)}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) mrkcp/1.0',
        },
      });

      const html = response.data;
      const $ = cheerio.load(html);

      const text = $('body').text();
      const target = verificationCode.trim();

      if (text.includes(target)) {
        return {
          verified: true,
          message: 'CSES account successfully verified!',
        };
      }

      return {
        verified: false,
        message: `Verification code "${verificationCode}" not found on CSES user profile.`,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          verified: false,
          message: `CSES user "${handle}" was not found.`,
        };
      }
      return {
        verified: false,
        message: `Failed to fetch CSES profile: ${error.message || 'Network error'}`,
      };
    }
  }

  async fetchSolvedProblems(handle: string): Promise<SolvedProblem[]> {
    try {
      const response = await axios.get(`https://cses.fi/user/${encodeURIComponent(handle)}`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) mrkcp/1.0',
        },
      });

      const html = response.data;
      const $ = cheerio.load(html);
      const solvedProblems: SolvedProblem[] = [];

      // CSES lists solved problems as links to /problemset/task/{id}
      $('a[href*="/problemset/task/"]').each((_, el) => {
        const title = $(el).text().trim();
        const href = $(el).attr('href') || '';
        const match = href.match(/\/problemset\/task\/(\d+)/);

        if (match && match[1] && title) {
          const problemId = match[1];
          if (!solvedProblems.some((p) => p.platformProblemId === problemId)) {
            solvedProblems.push({
              platformProblemId: problemId,
              title,
              platform: this.platformId,
              url: `https://cses.fi/problemset/task/${problemId}`,
              solvedAt: new Date(),
              verdict: 'AC',
              tags: ['cses'],
            });
          }
        }
      });

      return solvedProblems;
    } catch (error) {
      console.error(`[CSESAdapter] Error fetching solved problems for ${handle}:`, error);
      return [];
    }
  }
}
