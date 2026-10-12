import type { CheckObservation } from './checkObservation.ts';
import { checkObservationFromJson, checkObservationToJson } from './checkObservation.ts';
import type { CheckState } from './checkState.ts';
import type { CiSummary } from './ciSummary.ts';
import { summarizeChecks } from './ciSummary.ts';
import type { RequiredDiscovery } from './requiredDiscovery.ts';

/**
 * A pull request and the checks of its head commit, as read at one moment.
 * Every check in it belongs to `headSha`; a result for any other commit is
 * not in it. `mergeable` and `mergeStateStatus` are GitHub's words on
 * merging, unchanged; they are separate from CI, and a green `ciSummary`
 * does not make them true.
 */
export class PrSnapshot {
  readonly repository: string;
  readonly pr: number;
  readonly headSha: string;
  readonly prState: string;
  readonly checks: readonly CheckObservation[];
  readonly requiredDiscovery: RequiredDiscovery;
  readonly observedAt: string;
  readonly isDraft: boolean;
  readonly mergeable: string | undefined;
  readonly mergeStateStatus: string | undefined;
  readonly url: string | undefined;

  constructor(init: {
    repository: string;
    pr: number;
    headSha: string;
    prState: string;
    checks: readonly CheckObservation[];
    requiredDiscovery: RequiredDiscovery;
    observedAt: string;
    isDraft?: boolean;
    mergeable?: string | undefined;
    mergeStateStatus?: string | undefined;
    url?: string | undefined;
  }) {
    this.repository = init.repository;
    this.pr = init.pr;
    this.headSha = init.headSha;
    this.prState = init.prState;
    this.checks = init.checks;
    this.requiredDiscovery = init.requiredDiscovery;
    this.observedAt = init.observedAt;
    this.isDraft = init.isDraft ?? false;
    this.mergeable = init.mergeable;
    this.mergeStateStatus = init.mergeStateStatus;
    this.url = init.url;
  }

  static fromJson(json: Record<string, unknown>): PrSnapshot {
    return new PrSnapshot({
      repository: json['repository'] as string,
      pr: json['pr'] as number,
      headSha: json['headSha'] as string,
      prState: json['prState'] as string,
      checks: (json['checks'] as Record<string, unknown>[]).map(checkObservationFromJson),
      requiredDiscovery: ['discovered', 'noneReported', 'unknown'].includes(json['requiredDiscovery'] as string)
        ? (json['requiredDiscovery'] as RequiredDiscovery)
        : 'unknown',
      observedAt: json['observedAt'] as string,
      isDraft: json['isDraft'] === true,
      mergeable: (json['mergeable'] as string | null | undefined) ?? undefined,
      mergeStateStatus: (json['mergeStateStatus'] as string | null | undefined) ?? undefined,
      url: (json['url'] as string | null | undefined) ?? undefined,
    });
  }

  get open(): boolean {
    return this.prState === 'OPEN';
  }

  /** All checks together. */
  get ciSummary(): CiSummary {
    return summarizeChecks(this.checks);
  }

  /** The required checks together; undefined unless they were discovered. */
  get requiredSummary(): CiSummary | undefined {
    return this.requiredDiscovery === 'discovered'
      ? summarizeChecks(this.checks.filter((check) => check.required))
      : undefined;
  }

  /** How many checks are in each state. */
  get counts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const check of this.checks) counts[check.state] = (counts[check.state] ?? 0) + 1;
    return counts;
  }

  stateOf(key: string): CheckState | undefined {
    return this.checks.find((check) => check.key === key)?.state;
  }

  toJson(): Record<string, unknown> {
    return {
      repository: this.repository,
      pr: this.pr,
      headSha: this.headSha,
      prState: this.prState,
      isDraft: this.isDraft,
      mergeable: this.mergeable ?? null,
      mergeStateStatus: this.mergeStateStatus ?? null,
      url: this.url ?? null,
      observedAt: this.observedAt,
      ciSummary: this.ciSummary,
      requiredDiscovery: this.requiredDiscovery,
      requiredSummary: this.requiredSummary ?? null,
      counts: this.counts,
      checks: this.checks.map(checkObservationToJson),
    };
  }
}
