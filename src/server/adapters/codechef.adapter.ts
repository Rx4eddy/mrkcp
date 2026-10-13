import axios from 'axios';
import * as cheerio from 'cheerio';
import { PlatformAdapter, SolvedProblem, UpcomingContest, VerificationResult } from './base.adapter.js';

export class CodeChefAdapter implements PlatformAdapter {
  readonly platformId = 'codechef';
  readonly platformName = 'CodeChef';
  readonly profileVerificationInstructions =
    'Paste your verification code into the "About Me" or "Occupation/Organization" section in your CodeChef profile settings (https://www.codechef.com/users/edit). You can remove it after verification.';
  readonly profileUrlTemplate = (handle: string) => `https://www.codechef.com/users/${handle}`;

  async verifyProfile(handle: string, verificationCode: string): Promise<VerificationResult> {
    try {
      const response = await axios.get(`https://www.codechef.com/users/${encodeURIComponent(handle)}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) mrkcp/1.0',
        },
      });

      const html = response.data;
      const $ = cheerio.load(html);

      const pageText = $('body').text();
      const target = verificationCode.trim();

      if (pageText.includes(target)) {
        return {
          verified: true,
          message: 'CodeChef profile successfully verified!',
        };
      }

      return {
        verified: false,
        message: `Verification code "${verificationCode}" not found on your CodeChef profile page.`,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          verified: false,
          message: `CodeChef user "${handle}" was not found.`,
        };
      }
      return {
        verified: false,
        message: `Failed to fetch CodeChef profile: ${error.message || 'Network error'}`,
      };
    }
  }

  async fetchSolvedProblems(handle: string): Promise<SolvedProblem[]> {
    try {
      const response = await axios.get(`https://www.codechef.com/users/${encodeURIComponent(handle)}`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) mrkcp/1.0',
        },
      });

      const html = response.data;
      const $ = cheerio.load(html);
      const solvedProblems: SolvedProblem[] = [];

      // CodeChef lists problems in .problems-solved section or links inside article
      $('section.problems-solved a, .content a[href*="/problems/"]').each((_, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href') || '';
        if (text && (href.includes('/problems/') || href.includes('/status/'))) {
          // Extract problem code
          const parts = href.split('/').filter(Boolean);
          const problemCode = parts[parts.length - 1] || text;

          // Avoid duplicates
          if (
            problemCode &&
            !solvedProblems.some((p) => p.platformProblemId === problemCode) &&
            problemCode !== 'problems'
          ) {
            solvedProblems.push({
              platformProblemId: problemCode,
              title: problemCode,
              platform: this.platformId,
              url: href.startsWith('http') ? href : `https://www.codechef.com${href}`,
              solvedAt: new Date(),
              verdict: 'AC',
              tags: ['codechef'],
            });
          }
        }
      });

      return solvedProblems;
    } catch (error) {
      console.error(`[CodeChefAdapter] Error fetching solved problems for ${handle}:`, error);
      return [];
    }
  }

  async fetchUpcomingContests(): Promise<UpcomingContest[]> {
    try {
      // First try official CodeChef API
      const response = await axios.get(
        'https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all',
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) mrkcp/1.0',
          },
        }
      );

      const upcoming: UpcomingContest[] = [];

      if (response.data && Array.isArray(response.data.future_contests)) {
        for (const c of response.data.future_contests) {
          const startTime = new Date(c.contest_start_date_iso || c.contest_start_date);
          const endTime = new Date(c.contest_end_date_iso || c.contest_end_date);
          const durationSeconds = Math.round(
            (endTime.getTime() - startTime.getTime()) / 1000
          );

          upcoming.push({
            platform: this.platformId,
            externalId: c.contest_code || String(c.contest_id),
            name: c.contest_name,
            url: `https://www.codechef.com/${c.contest_code}`,
            startTime,
            endTime,
            durationSeconds,
            phase: 'BEFORE',
          });
        }
        return upcoming;
      }

      // Fallback to Kontests API
      const fallback = await axios.get('https://kontests.net/api/v1/code_chef', {
        timeout: 10000,
      });

      if (Array.isArray(fallback.data)) {
        const now = new Date();
        for (const c of fallback.data) {
          const startTime = new Date(c.start_time);
          const endTime = new Date(c.end_time);
          if (endTime > now) {
            const durationSeconds = Math.round(Number(c.duration) || (endTime.getTime() - startTime.getTime()) / 1000);
            upcoming.push({
              platform: this.platformId,
              externalId: c.url ? c.url.split('/').pop() || c.name : c.name,
              name: c.name,
              url: c.url || 'https://www.codechef.com/contests',
              startTime,
              endTime,
              durationSeconds,
              phase: startTime > now ? 'BEFORE' : 'CODING',
            });
          }
        }
      }

      return upcoming;
    } catch (error) {
      console.error('[CodeChefAdapter] Error fetching upcoming contests:', error);
      return [];
    }
  }
}
