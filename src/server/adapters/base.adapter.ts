export interface SolvedProblem {
  platformProblemId: string;
  title: string;
  platform: string;
  url: string;
  solvedAt: Date;
  verdict: string; // AC
  tags: string[];
  difficulty?: string;
  rating?: number;
}

export interface UpcomingContest {
  platform: string;
  externalId: string;
  name: string;
  url: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  phase: string;
  rawMetadata?: Record<string, any>;
}

export interface VerificationResult {
  verified: boolean;
  message: string;
}

export interface PlatformAdapter {
  readonly platformId: string;
  readonly platformName: string;
  readonly profileVerificationInstructions: string;
  readonly profileUrlTemplate: (handle: string) => string;

  verifyProfile(handle: string, verificationCode: string): Promise<VerificationResult>;
  fetchSolvedProblems(handle: string): Promise<SolvedProblem[]>;
  fetchUpcomingContests?(): Promise<UpcomingContest[]>;
}
