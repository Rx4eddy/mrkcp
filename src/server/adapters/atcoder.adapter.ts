import axios from 'axios';
import * as cheerio from 'cheerio';
import { PlatformAdapter, SolvedProblem, UpcomingContest, VerificationResult } from './base.adapter.js';

export class AtCoderAdapter implements PlatformAdapter {
  readonly platformId = 'atcoder';
  readonly platformName = 'AtCoder';
  readonly profileVerificationInstructions =
    'Paste your verification code into the "Affiliation" field on your AtCoder profile settings (https://atcoder.jp/settings). You can revert it after verification.';
  readonly profileUrlTemplate = (handle: string) => `https://atcoder.jp/users/${handle}`;

  async verifyProfile(handle: string, verificationCode: string): Promise<VerificationResult> {
    try {
      const response = await axios.get(`https://atcoder.jp/users/${encodeURIComponent(handle)}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'mrkcp-agent/1.0 (+https://github.com/mrkcp/mrkcp)',
        },
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Check profile table text and affiliation
      const profileText = $('table.dl-table, .user-profile, dl.dl-horizontal').text();
      const entireBodyText = $('body').text();

      const target = verificationCode.trim();
      if (profileText.includes(target) || entireBodyText.includes(target)) {
        return {
          verified: true,
          message: 'AtCoder profile successfully verified!',
        };
      }

      return {
        verified: false,
        message: `Verification code "${verificationCode}" not found on your AtCoder public profile page.`,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          verified: false,
          message: `AtCoder user "${handle}" was not found.`,
        };
      }
      return {
        verified: false,
        message: `Failed to fetch AtCoder profile: ${error.message || 'Network error'}`,
      };
    }
  }

  async fetchSolvedProblems(handle: string): Promise<SolvedProblem[]> {
    try {
      // Kenkoooo AtCoder Problems API (standard open data API for AtCoder submissions)
      const response = await axios.get(
        `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(handle)}&from_second=0`,
        {
          timeout: 15000,
          headers: {
            'User-Agent': 'mrkcp-agent/1.0 (+https://github.com/mrkcp/mrkcp)',
          },
        }
      );

      if (!Array.isArray(response.data)) {
        return [];
      }

      const solvedMap = new Map<string, SolvedProblem>();

      for (const sub of response.data) {
        if (sub.result === 'AC' && sub.problem_id) {
          const problemId = sub.problem_id;
          const solvedAt = new Date(sub.epoch_second * 1000);
          const existing = solvedMap.get(problemId);

          if (!existing || solvedAt < existing.solvedAt) {
            const contestId = sub.contest_id || '';
            const taskUrl = contestId
              ? `https://atcoder.jp/contests/${contestId}/tasks/${problemId}`
              : `https://atcoder.jp/`;

            // Format title neatly (e.g. abc280_a -> ABC 280 A)
            const cleanTitle = problemId
              .replace(/_/g, ' ')
              .toUpperCase();

            solvedMap.set(problemId, {
              platformProblemId: problemId,
              title: cleanTitle,
              platform: this.platformId,
              url: taskUrl,
              solvedAt,
              verdict: 'AC',
              tags: ['atcoder'],
            });
          }
        }
      }

      return Array.from(solvedMap.values());
    } catch (error) {
      console.error(`[AtCoderAdapter] Error fetching solved problems for ${handle}:`, error);
      return [];
    }
  }

  async fetchUpcomingContests(): Promise<UpcomingContest[]> {
    const upcoming: UpcomingContest[] = [];
    const now = new Date();

    // 1. Direct fetch from official AtCoder contests page
    try {
      const response = await axios.get('https://atcoder.jp/contests/', {
        timeout: 10000,
        headers: {
          'User-Agent': 'mrkcp-agent/1.0 (+https://github.com/mrkcp/mrkcp)',
        },
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // #contest-table-upcoming contains table of upcoming contests
      $('#contest-table-upcoming tbody tr, #contest-table-action tbody tr').each((_, el) => {
        const timeLink = $(el).find('td:nth-child(1) a').attr('href') || '';
        const nameLink = $(el).find('td:nth-child(2) a');
        const durationText = $(el).find('td:nth-child(3)').text().trim();

        const contestName = nameLink.text().trim();
        const contestHref = nameLink.attr('href') || '';

        // Extract ISO time from time link if available or format
        const timeMatch = timeLink.match(/iso=(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
        if (timeMatch && contestName) {
          const startTime = new Date(
            `${timeMatch[1]}-${timeMatch[2]}-${timeMatch[3]}T${timeMatch[4]}:${timeMatch[5]}:00+09:00` // JST
          );

          // Parse duration (HH:mm)
          let durationSeconds = 7200; // default 2h
          const durMatch = durationText.match(/(\d+):(\d+)/);
          if (durMatch) {
            durationSeconds = parseInt(durMatch[1], 10) * 3600 + parseInt(durMatch[2], 10) * 60;
          }

          const endTime = new Date(startTime.getTime() + durationSeconds * 1000);
          const externalId = contestHref.split('/').filter(Boolean).pop() || contestName;

          if (endTime > now && !upcoming.some((c) => c.externalId === externalId)) {
            upcoming.push({
              platform: this.platformId,
              externalId,
              name: contestName,
              url: contestHref.startsWith('http') ? contestHref : `https://atcoder.jp${contestHref}`,
              startTime,
              endTime,
              durationSeconds,
              phase: startTime > now ? 'BEFORE' : 'CODING',
            });
          }
        }
      });

      if (upcoming.length > 0) {
        return upcoming;
      }
    } catch (err: any) {
      console.warn('[AtCoderAdapter] Direct scraping failed, trying fallback API:', err.message);
    }

    // 2. Fallback to Kontests API
    try {
      const response = await axios.get('https://kontests.net/api/v1/at_coder', {
        timeout: 8000,
      });

      if (Array.isArray(response.data)) {
        for (const c of response.data) {
          const startTime = new Date(c.start_time);
          const endTime = new Date(c.end_time);

          if (endTime > now) {
            const durationSeconds = Math.round(Number(c.duration) || (endTime.getTime() - startTime.getTime()) / 1000);
            const externalId = c.url ? c.url.split('/').pop() || c.name : c.name;

            if (!upcoming.some((u) => u.externalId === externalId)) {
              upcoming.push({
                platform: this.platformId,
                externalId,
                name: c.name,
                url: c.url || 'https://atcoder.jp/contests/',
                startTime,
                endTime,
                durationSeconds,
                phase: startTime > now ? 'BEFORE' : 'CODING',
              });
            }
          }
        }
      }
    } catch (error: any) {
      console.warn('[AtCoderAdapter] Fallback API also failed:', error.message);
    }

    return upcoming;
  }
}
