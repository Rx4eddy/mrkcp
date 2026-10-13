import { PlatformAdapter } from './base.adapter.js';
import { CodeforcesAdapter } from './codeforces.adapter.js';
import { AtCoderAdapter } from './atcoder.adapter.js';
import { CodeChefAdapter } from './codechef.adapter.js';
import { CSESAdapter } from './cses.adapter.js';

export * from './base.adapter.js';
export * from './codeforces.adapter.js';
export * from './atcoder.adapter.js';
export * from './codechef.adapter.js';
export * from './cses.adapter.js';

class PlatformRegistryClass {
  private adapters: Map<string, PlatformAdapter> = new Map();

  constructor() {
    this.register(new CodeforcesAdapter());
    this.register(new AtCoderAdapter());
    this.register(new CodeChefAdapter());
    this.register(new CSESAdapter());
  }

  register(adapter: PlatformAdapter): void {
    this.adapters.set(adapter.platformId.toLowerCase(), adapter);
  }

  getAdapter(platformId: string): PlatformAdapter | undefined {
    return this.adapters.get(platformId.toLowerCase());
  }

  getAllAdapters(): PlatformAdapter[] {
    return Array.from(this.adapters.values());
  }

  getSupportedPlatforms() {
    return this.getAllAdapters().map((adapter) => ({
      id: adapter.platformId,
      name: adapter.platformName,
      instructions: adapter.profileVerificationInstructions,
      profileUrlTemplate: adapter.profileUrlTemplate('HANDLE'),
      hasContests: typeof adapter.fetchUpcomingContests === 'function',
    }));
  }
}

export const PlatformRegistry = new PlatformRegistryClass();
