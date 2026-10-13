# Contributing to mrkcp

Thank you for your interest in contributing to **mrkcp** — the competitive programmer's home base! We welcome contributions ranging from bug fixes and documentation improvements to new platform adapters and problem curation.

---

## 🛠 Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mrkcp/mrkcp.git
   cd mrkcp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

4. **Initialize database & seed problem bank**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

5. **Start dev servers** (runs Express on `5000` and Vite on `5173` with proxy):
   ```bash
   npm run dev
   ```

6. **Run automated tests**:
   ```bash
   npm test
   ```

---

## 🔌 How to Add a New Platform Adapter

Adding support for a new competitive programming platform is designed to be completely modular. You only need to write **one** adapter module and register it in `PlatformRegistry`.

### 1. Implement `PlatformAdapter`

Create a new file in `src/server/adapters/<platform>.adapter.ts`:

```typescript
import axios from 'axios';
import { PlatformAdapter, SolvedProblem, UpcomingContest, VerificationResult } from './base.adapter.js';

export class HackerRankAdapter implements PlatformAdapter {
  readonly platformId = 'hackerrank';
  readonly platformName = 'HackerRank';
  
  readonly profileVerificationInstructions =
    'Paste the verification code into your bio or "About" field in your public profile settings. You can remove it after verification.';
    
  readonly profileUrlTemplate = (handle: string) => `https://www.hackerrank.com/profile/${handle}`;

  async verifyProfile(handle: string, verificationCode: string): Promise<VerificationResult> {
    try {
      const res = await axios.get(`https://www.hackerrank.com/rest/contests/master/hackers/${handle}/profile`);
      const bio = res.data?.model?.short_bio || '';
      
      if (bio.includes(verificationCode.trim())) {
        return { verified: true, message: 'Profile verified successfully!' };
      }
      return { verified: false, message: 'Verification code not found in bio.' };
    } catch (err: any) {
      return { verified: false, message: `Failed to fetch profile: ${err.message}` };
    }
  }

  async fetchSolvedProblems(handle: string): Promise<SolvedProblem[]> {
    // Return solved problems in standard SolvedProblem shape:
    // { platformProblemId, title, platform, url, solvedAt, verdict: 'AC', tags, difficulty }
    return [];
  }

  async fetchUpcomingContests?(): Promise<UpcomingContest[]> {
    // Optional: Return upcoming contests if the platform hosts contests
    return [];
  }
}
```

### 2. Register in `PlatformRegistry`

In `src/server/adapters/index.ts`:

```typescript
import { HackerRankAdapter } from './hackerrank.adapter.js';

class PlatformRegistryClass {
  constructor() {
    // ...
    this.register(new HackerRankAdapter());
  }
}
```

### 3. Add Unit Tests

Add tests in `tests/adapters.test.ts` to verify handle parsing and error resilience.

---

## 🧪 Testing Guidelines

- Write tests in the `tests/` directory using Vitest.
- Run `npm test` before pushing to ensure all 14+ unit and integration tests pass.
- Run `npm run lint` to verify TypeScript typing consistency.

---

## 📦 Pull Request Process

1. Fork the repo and create your feature branch: `git checkout -b feat/my-new-feature`.
2. Commit your changes with clear commit messages: `git commit -m "feat(adapter): add HackerRank adapter"`.
3. Push to your fork: `git push origin feat/my-new-feature`.
4. Open a Pull Request on GitHub. All CI checks must pass.
