import { CardioSession } from '../domain/training/CardioSession';
import type { PlatformWorkout } from '../domain/training/PlatformWorkout';
import { spanOverlapShare } from './spanOverlapShare';
import { workoutClientIdPrefix } from './workoutClientIdPrefix';

/** How much of the shorter of two spans must overlap for them to be one session, as MM-490 has it. */
const sameSessionOverlap = 0.8;

/**
 * What a read of the platform's workouts changes among the cardio sessions
 * kept (MM-677): the sessions to save. Every non-strength session the
 * platform gave with an activity is one; a strength session is a workout
 * (MM-490), and one this app wrote is never cardio. A session already kept
 * is saved again only when its span, activity or source changed. The same
 * session recorded twice is kept once: a new one whose span overlaps
 * `sameSessionOverlap` of the shorter of its span and that of one kept from
 * another source, or brought in by this read from another source, is left
 * out.
 */
export function cardioSessionImports({
  platform,
  kept,
}: {
  platform: readonly PlatformWorkout[];
  kept: readonly CardioSession[];
}): CardioSession[] {
  const byPlatformId = new Map(kept.map((session) => [session.platformId, session]));
  const spans = kept.map((session) => ({ start: session.start.getTime(), end: session.end.getTime(), source: session.sourceName }));
  const changes: CardioSession[] = [];
  const seen = new Set<string>();
  const inOrder = [...platform].sort((a, b) => a.start.getTime() - b.start.getTime());
  for (const read of inOrder) {
    if (read.cardio === undefined || read.strength || seen.has(read.platformId)) continue;
    if (read.clientId?.startsWith(workoutClientIdPrefix) === true) continue;
    if (read.end.getTime() <= read.start.getTime()) continue;
    seen.add(read.platformId);
    const session = new CardioSession({
      platformId: read.platformId,
      sourceName: read.sourceName,
      activity: read.cardio,
      start: read.start,
      end: read.end,
    });
    const existing = byPlatformId.get(read.platformId);
    if (existing !== undefined) {
      if (!existing.sameAs(session)) changes.push(session);
      continue;
    }
    const span = { start: read.start.getTime(), end: read.end.getTime() };
    const duplicate = spans.some((other) => other.source !== read.sourceName && spanOverlapShare(span, other) >= sameSessionOverlap);
    if (duplicate) continue;
    spans.push({ ...span, source: read.sourceName });
    changes.push(session);
  }
  return changes;
}
