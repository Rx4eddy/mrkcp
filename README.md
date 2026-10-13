<div align="center">
  <h1>mrkcp</h1>
  <p><strong>A Competitive Programmer's Home Base</strong></p>
  <p>All contests, dual-trigger reminders, progress tracking, and curated practice recommendations in one unified workspace.</p>

  <div>
    <img src="https://img.shields.io/badge/Node.js-v22-339933?logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
    <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" alt="Docker" />
  </div>
</div>

---

## 📌 What is mrkcp?

Competitive programmers today check **Codeforces**, **AtCoder**, and **CodeChef** separately, risking missed contests. Tracking solved problems across multiple platforms is fragmented, and finding structured, topic-wise practice often requires jumping between disconnected spreadsheets and blogs.

**mrkcp** unites everything into one production-ready, open-source hub:
1. **Contest Calendar**: Weekly/monthly schedules from Codeforces, AtCoder, CodeChef (and extensible to more), with automatic background sync, timezone conversion, countdown timers, and direct contest links.
2. **Dual-Trigger Email Reminders**: Morning of contest day + 2 hours before start, with idempotent zero-duplicate dispatch and 1-click unsubscribe.
3. **Multi-Platform Account Linking**: Link public handles on Codeforces, AtCoder, CodeChef, and CSES using zero-trust public profile token verification. **Never** stores or asks for third-party passwords.
4. **Problem Journal**: Track your whole CP journey. Categorized by topic and difficulty, with personal markdown solution notes, streak tracking, and a GitHub/Codeforces-style 365-day interactive activity heatmap.
5. **Topic-Based Recommendations**: 180+ curated must-try problems ordered easy to hard across DP, Graphs, Binary Search, Trees, Greedy, Strings, Math, and Bit Manipulation. Solved problems are automatically hidden. Includes a dedicated curated LeetCode collection (links only, no scraping/API sync).

---

## 🏗 Stack & Architecture Choices

| Layer | Choice | Why? |
|---|---|---|
| **Backend** | Express 4 + TypeScript | Clean, high-throughput REST API with zero runtime overhead and straightforward background scheduling. |
| **Database** | SQLite + Prisma ORM | Zero-configuration local startup and single-command Docker deployment. Can be switched to PostgreSQL by changing `DATABASE_URL` in `.env`. |
| **Frontend** | React 18 + Vite + Tailwind CSS | Sub-millisecond HMR during development, ultra-compact production build (~100 KB gzipped), responsive dark-theme design tailored for competitive programmers. |
| **Scheduler** | `node-cron` | Lightweight in-process background worker for recurring contest syncs (every 30 mins) and reminder evaluations (every 5 mins). |
| **Security** | Helmet, bcryptjs, Zod, express-rate-limit | Strict input schema validation, rate-limiting on sensitive auth routes, hashed passwords, and CSRF-resistant cookie handling. |
| **Testing** | Vitest | Instant TypeScript test runner executing unit and integration tests across adapters, schedulers, and recommendations in ~1 second. |

---

## 🚀 Quick Start

### Option 1: Docker (Single Command)

Run the entire production application with zero local dependencies beyond Docker:

```bash
docker compose up --build
```

The application is now live at [http://localhost:5000](http://localhost:5000).

---

### Option 2: Local Development

#### Prerequisites
- Node.js >= 20 (v22 recommended)
- npm >= 9

#### Steps
1. **Clone repository**:
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

4. **Initialize database schema and seed problem bank**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

5. **Start dev servers** (runs Express on `5000` and Vite dev server on `5173` concurrently):
   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📧 Email Reminders & Dev Mailbox

mrkcp includes reliable dual reminders for upcoming contests:
- **Morning of contest day**
- **2 hours before contest starts**

### Production SMTP Configuration
Configure your SMTP credentials in `.env`:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_api_key
SMTP_FROM="mrkcp Contests <notifications@mrkcp.dev>"
```

### Development Mock Mode (Built-In)
When SMTP credentials are left empty, mrkcp automatically operates in **Dev Mock Mode**:
- Emails are logged to the console and stored in an in-memory dev mailbox.
- Click the **"Dev Mailbox"** button in the navbar (or open at bottom-right) to view simulated email verification links, password resets, and contest alerts in real time!
- Use the **"Trigger Reminder Check"** button in the Dev Mailbox to instantly test reminder dispatch.

---

## 🔌 How to Add a New Platform Adapter

mrkcp is designed with a **Platform Adapter Pattern**: each competitive programming platform is encapsulated in a single module. Adding a platform does not touch core business logic.

### Step 1: Create the Adapter Module
Create `src/server/adapters/<platform>.adapter.ts`:

```typescript
import axios from 'axios';
import { PlatformAdapter, SolvedProblem, UpcomingContest, VerificationResult } from './base.adapter.js';

export class MyPlatformAdapter implements PlatformAdapter {
  readonly platformId = 'myplatform';
  readonly platformName = 'My Platform';
  readonly profileVerificationInstructions =
    'Place your verification code into your bio on My Platform.';
  readonly profileUrlTemplate = (handle: string) => `https://myplatform.com/user/${handle}`;

  async verifyProfile(handle: string, verificationCode: string): Promise<VerificationResult> {
    const res = await axios.get(`https://myplatform.com/api/user/${handle}`);
    const verified = (res.data?.bio || '').includes(verificationCode.trim());
    return {
      verified,
      message: verified ? 'Verified!' : 'Code not found in bio.',
    };
  }

  async fetchSolvedProblems(handle: string): Promise<SolvedProblem[]> {
    const res = await axios.get(`https://myplatform.com/api/user/${handle}/solved`);
    return res.data.map((item: any) => ({
      platformProblemId: item.id,
      title: item.title,
      platform: this.platformId,
      url: item.url,
      solvedAt: new Date(item.solved_timestamp),
      verdict: 'AC',
      tags: item.tags || [],
      difficulty: item.difficulty,
    }));
  }

  async fetchUpcomingContests?(): Promise<UpcomingContest[]> {
    // Optional: Return upcoming contests
    return [];
  }
}
```

### Step 2: Register in `PlatformRegistry`
In `src/server/adapters/index.ts`:

```typescript
import { MyPlatformAdapter } from './myplatform.adapter.js';

// Inside constructor:
this.register(new MyPlatformAdapter());
```

---

## 🧪 Testing & Quality Assurance

mrkcp includes automated unit and integration tests covering:
- **Platform Adapters**: Response normalization, error handling, handle verification.
- **Scheduler & Reminders**: Contest time-window detection, 2-hour alert dispatch, duplicate prevention.
- **Recommendations**: Topic grouping, easy-to-hard ordering, solved-problem hiding.
- **Authentication**: Password hashing, JWT token verification, duplicate registration guards.

Run all tests:
```bash
npm test
```

Check TypeScript types across the entire project:
```bash
npm run lint
```

---

## 🚢 Production Deployment

### Docker Deployment
```bash
docker compose up -d --build
```

### Production Build Manually
```bash
npm run build
npm start
```
The compiled server serves both the REST API on `/api/*` and the static single-page React client on root `/`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Contributions are welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md).
