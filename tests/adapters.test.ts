import { describe, it, expect, vi } from 'vitest';
import { PlatformRegistry } from '../src/server/adapters/index.js';
import { CodeforcesAdapter } from '../src/server/adapters/codeforces.adapter.js';
import { AtCoderAdapter } from '../src/server/adapters/atcoder.adapter.js';
import { CodeChefAdapter } from '../src/server/adapters/codechef.adapter.js';
import { CSESAdapter } from '../src/server/adapters/cses.adapter.js';
import axios from 'axios';

describe('Platform Adapters and Registry', () => {
  it('registers all default platforms in PlatformRegistry', () => {
    const supported = PlatformRegistry.getSupportedPlatforms();
    const ids = supported.map((p) => p.id);

    expect(ids).toContain('codeforces');
    expect(ids).toContain('atcoder');
    expect(ids).toContain('codechef');
    expect(ids).toContain('cses');
  });

  it('retrieves adapters by case-insensitive platform id', () => {
    const cf = PlatformRegistry.getAdapter('CodeForces');
    const at = PlatformRegistry.getAdapter('ATCODER');
    const cc = PlatformRegistry.getAdapter('codechef');
    const cses = PlatformRegistry.getAdapter('cses');

    expect(cf).toBeDefined();
    expect(cf?.platformName).toBe('Codeforces');
    expect(at).toBeDefined();
    expect(cc).toBeDefined();
    expect(cses).toBeDefined();
  });

  it('CodeforcesAdapter formats solved problems and dedupes correctly', async () => {
    const adapter = new CodeforcesAdapter();
    const mockApiResponse = {
      data: {
        status: 'OK',
        result: [
          {
            id: 101,
            contestId: 1000,
            creationTimeSeconds: 1600000000,
            problem: {
              contestId: 1000,
              index: 'A',
              name: 'Codeforces Problem A',
              rating: 1200,
              tags: ['dp', 'greedy'],
            },
            verdict: 'OK',
          },
          {
            id: 102,
            contestId: 1000,
            creationTimeSeconds: 1600000500, // duplicate solve of same problem
            problem: {
              contestId: 1000,
              index: 'A',
              name: 'Codeforces Problem A',
              rating: 1200,
              tags: ['dp', 'greedy'],
            },
            verdict: 'OK',
          },
          {
            id: 103,
            contestId: 1000,
            creationTimeSeconds: 1600000600,
            problem: {
              contestId: 1000,
              index: 'B',
              name: 'Problem B',
              tags: ['math'],
            },
            verdict: 'WRONG_ANSWER', // should be excluded
          },
        ],
      },
    };

    const spy = vi.spyOn(axios, 'get').mockResolvedValueOnce(mockApiResponse);

    const solved = await adapter.fetchSolvedProblems('tourist');
    expect(solved.length).toBe(1);
    expect(solved[0].platformProblemId).toBe('1000A');
    expect(solved[0].verdict).toBe('AC');
    expect(solved[0].tags).toEqual(['dp', 'greedy']);
    expect(solved[0].rating).toBe(1200);

    spy.mockRestore();
  });

  it('CodeforcesAdapter verifies profile when verification token is found in user info', async () => {
    const adapter = new CodeforcesAdapter();
    const token = 'mrkcp-verify-1234';

    const spy = vi.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        status: 'OK',
        result: [
          {
            handle: 'testuser',
            firstName: 'Gennady',
            lastName: 'mrkcp-verify-1234',
            organization: 'ITMO',
          },
        ],
      },
    });

    const result = await adapter.verifyProfile('testuser', token);
    expect(result.verified).toBe(true);
    expect(result.message).toContain('verified');

    spy.mockRestore();
  });

  it('AtCoderAdapter parses Kenkoooo submissions into standard SolvedProblem format', async () => {
    const adapter = new AtCoderAdapter();
    const mockKenkoooo = [
      {
        id: 1,
        epoch_second: 1620000000,
        problem_id: 'abc200_a',
        contest_id: 'abc200',
        user_id: 'chokudai',
        language: 'C++',
        point: 100,
        length: 200,
        result: 'AC',
      },
      {
        id: 2,
        epoch_second: 1620000100,
        problem_id: 'abc200_b',
        contest_id: 'abc200',
        user_id: 'chokudai',
        result: 'WA',
      },
    ];

    const spy = vi.spyOn(axios, 'get').mockResolvedValueOnce({ data: mockKenkoooo });

    const solved = await adapter.fetchSolvedProblems('chokudai');
    expect(solved.length).toBe(1);
    expect(solved[0].platformProblemId).toBe('abc200_a');
    expect(solved[0].platform).toBe('atcoder');
    expect(solved[0].url).toContain('abc200/tasks/abc200_a');

    spy.mockRestore();
  });
});
