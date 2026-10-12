import type { PrSnapshot } from './prSnapshot.ts';
import type { WatchEvent } from './watchEvent.ts';

/**
 * The meaningful changes from `before` to `after`, oldest first; empty when
 * nothing changed. Ids are assigned by the store.
 *
 * A new head commit voids everything known about the old one: its checks
 * are not compared, and the summary change says the old result no longer
 * applies.
 */
export function diffSnapshots(before: PrSnapshot | undefined, after: PrSnapshot): WatchEvent[] {
  const at = after.observedAt;
  const head = after.headSha;
  const events: WatchEvent[] = [];
  const event = (
    type: string,
    fields: { check?: string; from?: string | undefined; to?: string | undefined; detail?: Record<string, unknown> } = {},
  ): WatchEvent => ({
    id: 0,
    type,
    at,
    headSha: head,
    check: fields.check,
    from: fields.from,
    to: fields.to,
    detail: fields.detail ?? {},
  });

  const newHead = before !== undefined && before.headSha !== after.headSha;
  if (newHead) {
    events.push(
      event('headChanged', {
        from: before.headSha,
        to: head,
        detail: {
          note: 'Results for the old commit no longer apply to this pull request.',
          previousCiSummary: before.ciSummary,
        },
      }),
    );
  }
  // Compare checks only within one commit.
  const same = newHead ? undefined : before;

  if (before !== undefined && before.prState !== after.prState) {
    events.push(event('prStateChanged', { from: before.prState, to: after.prState }));
  }
  for (const check of after.checks) {
    const was = same?.stateOf(check.key);
    if (was === check.state) continue;
    const detail: Record<string, unknown> = { name: check.name, required: check.required };
    if (check.workflow !== undefined) detail['workflow'] = check.workflow;
    if (check.providerStatus !== undefined) detail['providerStatus'] = check.providerStatus;
    if (check.providerConclusion !== undefined) detail['providerConclusion'] = check.providerConclusion;
    if (check.url !== undefined) detail['url'] = check.url;
    if (check.startedAt !== undefined) detail['startedAt'] = check.startedAt;
    if (check.completedAt !== undefined) detail['completedAt'] = check.completedAt;
    events.push(event('checkChanged', { check: check.key, from: was, to: check.state, detail }));
  }
  if (same !== undefined) {
    const present = new Set(after.checks.map((check) => check.key));
    for (const gone of same.checks) {
      if (!present.has(gone.key)) events.push(event('checkChanged', { check: gone.key, from: gone.state }));
    }
  }
  if (before === undefined || newHead || before.ciSummary !== after.ciSummary) {
    const detail: Record<string, unknown> = { counts: after.counts };
    if (newHead) detail['invalidatedByNewHead'] = true;
    events.push(event('ciSummaryChanged', { from: before?.ciSummary, to: after.ciSummary, detail }));
  }
  if (before?.requiredDiscovery !== after.requiredDiscovery) {
    events.push(event('requiredDiscoveryChanged', { from: before?.requiredDiscovery, to: after.requiredDiscovery }));
  }
  if (newHead || before?.requiredSummary !== after.requiredSummary) {
    if (before?.requiredSummary !== undefined || after.requiredSummary !== undefined) {
      events.push(event('requiredSummaryChanged', { from: before?.requiredSummary, to: after.requiredSummary }));
    }
  }
  return events;
}
