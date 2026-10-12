/**
 * The state of one check, normalized across GitHub's check runs and commit
 * statuses. The provider's own words are kept beside it; this is only a
 * summary of them. `pending` is queued, requested or expected; `skipped`
 * and `neutral` are not passes; `actionRequired` waits on a person;
 * `unknown` is a provider state this version does not know.
 */
export type CheckState =
  | 'pending'
  | 'running'
  | 'passed'
  | 'failed'
  | 'cancelled'
  | 'skipped'
  | 'neutral'
  | 'actionRequired'
  | 'timedOut'
  | 'stale'
  | 'unknown';

export const CheckState = {
  values: [
    'pending',
    'running',
    'passed',
    'failed',
    'cancelled',
    'skipped',
    'neutral',
    'actionRequired',
    'timedOut',
    'stale',
    'unknown',
  ],
} as const;

/**
 * Normalizes a check run's `status` and `conclusion`, or a commit status's
 * `state` (pass it as `status` with no `conclusion`), as `gh` reports them.
 * Anything not recognized is `unknown`, never assumed to be good.
 */
export function normalizeCheckState(status: string | null | undefined, conclusion: string | null | undefined): CheckState {
  const s = (status ?? '').toUpperCase();
  const c = (conclusion ?? '').toUpperCase();
  switch (s) {
    case 'QUEUED':
    case 'PENDING':
    case 'REQUESTED':
    case 'EXPECTED':
      return 'pending';
    case 'WAITING':
      return 'actionRequired';
    case 'IN_PROGRESS':
      return 'running';
    // Commit statuses have no conclusion; their state is the verdict.
    case 'SUCCESS':
      return 'passed';
    case 'FAILURE':
    case 'ERROR':
      return 'failed';
    case 'COMPLETED':
      switch (c) {
        case 'SUCCESS':
          return 'passed';
        case 'FAILURE':
        case 'STARTUP_FAILURE':
          return 'failed';
        case 'CANCELLED':
          return 'cancelled';
        case 'SKIPPED':
          return 'skipped';
        case 'NEUTRAL':
          return 'neutral';
        case 'TIMED_OUT':
          return 'timedOut';
        case 'ACTION_REQUIRED':
          return 'actionRequired';
        case 'STALE':
          return 'stale';
        default:
          return 'unknown';
      }
    default:
      return 'unknown';
  }
}
