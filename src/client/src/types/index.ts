export interface User {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
  timezone: string;
  createdAt?: string;
  linkedAccounts?: LinkedAccount[];
  reminderPreferences?: ReminderPreference[];
}

export interface LinkedAccount {
  id: string;
  platform: string;
  handle: string;
  isVerified: boolean;
  verificationCode: string;
  verifiedAt?: string | null;
  lastSyncedAt?: string | null;
  syncStatus: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
  syncError?: string | null;
}

export interface ReminderPreference {
  id: string;
  platform: string;
  enabled: boolean;
  morningOf: boolean;
  hoursBefore2: boolean;
}

export interface Contest {
  id: string;
  platform: string;
  externalId: string;
  name: string;
  url: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  phase: string;
}

export interface JournalEntry {
  id: string;
  platform: string;
  problemId: string;
  title: string;
  url: string;
  solvedAt: string;
  difficulty?: string | null;
  rating?: number | null;
  tags: string[];
  verdict: string;
  notes?: string | null;
  source: string;
}

export interface JournalAnalytics {
  totalSolved: number;
  totalActiveDays: number;
  currentStreak: number;
  longestStreak: number;
  byPlatform: Record<string, number>;
  byTopic: Record<string, number>;
  heatmap: Array<{ date: string; count: number }>;
}

export interface CuratedProblem {
  id: string;
  platform: string;
  externalId: string;
  title: string;
  url: string;
  topic: string;
  difficultyTier: 'Easy' | 'Medium' | 'Hard' | 'Master';
  rating?: number | null;
  tags: string[];
  orderIndex: number;
  description?: string | null;
  isSolved?: boolean;
}

export interface SupportedPlatform {
  id: string;
  name: string;
  instructions: string;
  profileUrlTemplate: string;
  hasContests: boolean;
}

export interface DevEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  sentAt: string;
  type: string;
  contestName?: string;
}
