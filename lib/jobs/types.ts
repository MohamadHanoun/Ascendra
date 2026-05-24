export type JobRunResult = {
  ok: boolean;
  job: string;
  processed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  errors: string[];
};

export type SyncConfig = {
  /** Max records processed in one cron invocation. Keeps runs time-bounded. Default: 25. */
  batchSize?: number;
  /**
   * Minimum age (minutes) before a match is considered stale enough to sync.
   * Prevents thrashing matches that are actively being played. Default: 30.
   */
  staleThresholdMinutes?: number;
  /**
   * Max age (hours) of a failed webhook event to attempt retry.
   * Events older than this are left for manual review. Default: 48.
   */
  retryAgeHours?: number;
};
