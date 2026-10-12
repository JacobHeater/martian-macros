/**
 * How a watch is doing, as last written by whatever polls it. `status` is
 * `idle` (nothing is polling), `running`, `failing` (the last poll failed
 * and it is retrying) or `stopped`. `heartbeat` is when the background
 * watcher last said it was alive.
 */
export interface WatchHealth {
  readonly status: string;
  readonly lastSuccessfulPoll?: string | undefined;
  readonly lastAttempt?: string | undefined;
  readonly consecutiveFailures: number;
  readonly lastError?: string | undefined;
  readonly lastErrorKind?: string | undefined;
  readonly heartbeat?: string | undefined;
  readonly pid?: number | undefined;
}

export const idleHealth: WatchHealth = { status: 'idle', consecutiveFailures: 0 };

export function watchHealthFromJson(json: Record<string, unknown>): WatchHealth {
  return {
    status: (json['status'] as string | undefined) ?? 'idle',
    lastSuccessfulPoll: (json['lastSuccessfulPoll'] as string | null | undefined) ?? undefined,
    lastAttempt: (json['lastAttempt'] as string | null | undefined) ?? undefined,
    consecutiveFailures: (json['consecutiveFailures'] as number | undefined) ?? 0,
    lastError: (json['lastError'] as string | null | undefined) ?? undefined,
    lastErrorKind: (json['lastErrorKind'] as string | null | undefined) ?? undefined,
    heartbeat: (json['heartbeat'] as string | null | undefined) ?? undefined,
    pid: (json['pid'] as number | null | undefined) ?? undefined,
  };
}

export function watchHealthToJson(health: WatchHealth): Record<string, unknown> {
  return {
    status: health.status,
    lastSuccessfulPoll: health.lastSuccessfulPoll ?? null,
    lastAttempt: health.lastAttempt ?? null,
    consecutiveFailures: health.consecutiveFailures,
    lastError: health.lastError ?? null,
    lastErrorKind: health.lastErrorKind ?? null,
    heartbeat: health.heartbeat ?? null,
    pid: health.pid ?? null,
  };
}
