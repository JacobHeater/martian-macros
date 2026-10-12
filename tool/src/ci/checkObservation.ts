import { CheckState } from './checkState.ts';

/** One check as observed on a pull request's head commit. */
export interface CheckObservation {
  /** Identifies the check across polls: its workflow and name. */
  readonly key: string;
  readonly name: string;

  /** `checkRun` or `statusContext`. */
  readonly kind: string;
  readonly state: CheckState;
  readonly workflow?: string | undefined;

  /** GitHub's own words, unchanged. */
  readonly providerStatus?: string | undefined;
  readonly providerConclusion?: string | undefined;

  /** The run or job page; it carries the run and job identifiers. */
  readonly url?: string | undefined;

  /** Provider timestamps, as given. */
  readonly startedAt?: string | undefined;
  readonly completedAt?: string | undefined;

  /** Whether GitHub reported this check as required for the branch. */
  readonly required: boolean;
}

export function checkObservationFromJson(json: Record<string, unknown>): CheckObservation {
  const state = json['state'];
  return {
    key: json['key'] as string,
    name: json['name'] as string,
    kind: json['kind'] as string,
    state: (CheckState.values as readonly string[]).includes(state as string) ? (state as CheckState) : 'unknown',
    workflow: (json['workflow'] as string | null | undefined) ?? undefined,
    providerStatus: (json['providerStatus'] as string | null | undefined) ?? undefined,
    providerConclusion: (json['providerConclusion'] as string | null | undefined) ?? undefined,
    url: (json['url'] as string | null | undefined) ?? undefined,
    startedAt: (json['startedAt'] as string | null | undefined) ?? undefined,
    completedAt: (json['completedAt'] as string | null | undefined) ?? undefined,
    required: json['required'] === true,
  };
}

export function checkObservationToJson(check: CheckObservation): Record<string, unknown> {
  return {
    key: check.key,
    name: check.name,
    kind: check.kind,
    state: check.state,
    workflow: check.workflow ?? null,
    providerStatus: check.providerStatus ?? null,
    providerConclusion: check.providerConclusion ?? null,
    url: check.url ?? null,
    startedAt: check.startedAt ?? null,
    completedAt: check.completedAt ?? null,
    required: check.required,
  };
}
