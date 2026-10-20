import { compareStrings } from '../lang/compareStrings';
import { byStartThenId } from './byStartThenId';
import type { HealthSample } from './HealthSample';
import { healthSourceName } from './healthSourceName';
import type { NightOfSleep } from './NightOfSleep';

/**
 * The imported sleep that counts for each night (MM-250), oldest night
 * first, from the sleep sessions among `samples`.
 *
 * A session belongs to the day it ended on. Where several sources recorded
 * a night (a watch and a phone, say), the first source to report it, the
 * one whose earliest session began first, wins, so the night is never
 * counted twice; its sessions are summed. The same readings in any order
 * give the same answer.
 *
 * A night the person typed overrules all of this; that is the caller's to
 * apply, since this knows only what was imported.
 */
export function nightlySleep(samples: Iterable<HealthSample>): NightOfSleep[] {
  // Keyed by the time of local midnight, since two Date objects for the
  // same moment are not the same key.
  const byNight = new Map<number, HealthSample[]>();
  for (const sample of samples) {
    if (sample.type !== 'sleep') continue;
    const ended = sample.end ?? sample.start;
    const midnight = new Date(ended.getFullYear(), ended.getMonth(), ended.getDate()).getTime();
    const night = byNight.get(midnight);
    if (night === undefined) {
      byNight.set(midnight, [sample]);
    } else {
      night.push(sample);
    }
  }

  const result: NightOfSleep[] = [];
  for (const midnight of [...byNight.keys()].sort((a, b) => a - b)) {
    const all = (byNight.get(midnight) ?? []).sort(byStartThenId);
    const bySource = new Map<string, HealthSample[]>();
    for (const sample of all) {
      const sessions = bySource.get(sample.sourceId);
      if (sessions === undefined) {
        bySource.set(sample.sourceId, [sample]);
      } else {
        sessions.push(sample);
      }
    }
    // The source whose first session began first; a tie goes to the id that sorts first.
    let chosen: HealthSample[] | undefined;
    for (const id of [...bySource.keys()].sort(compareStrings)) {
      const sessions = bySource.get(id) as HealthSample[];
      const first = sessions[0] as HealthSample;
      const chosenFirst = chosen?.[0];
      if (chosenFirst === undefined || first.start.getTime() < chosenFirst.start.getTime()) chosen = sessions;
    }
    const counted = chosen ?? [];
    const first = counted[0];
    result.push({
      day: new Date(midnight),
      minutes: counted.reduce((sum, sample) => sum + sample.value, 0),
      sourceName: first === undefined ? '' : (healthSourceName(first) ?? ''),
      sessions: counted.length,
    });
  }
  return result;
}
