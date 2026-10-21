import { byStartThenId } from './byStartThenId';
import { healthSourceName } from './healthSourceName';
import type { DayWeighIn } from './DayWeighIn';
import type { HealthSample } from './HealthSample';
import { WeighInWindow } from './WeighInWindow';

/**
 * The imported weigh-in that counts for each day (MM-71), oldest day
 * first, from the weight readings among `samples`.
 *
 * A day's readings from `primarySourceId` count before any other
 * source's; with none from it that day, the others' do. Among those, the
 * first reading inside `window` (local time; 04:00 to 12:00 unless the
 * person moved it, MM-441) counts; with no reading in the window, the
 * middle value of them does. The same readings in any order give the same
 * answer.
 *
 * A value the user typed for a day overrules all of this; that is the
 * caller's to apply, since this knows only what was imported.
 */
export function dailyWeighIns(
  samples: Iterable<HealthSample>,
  {
    primarySourceId,
    window = WeighInWindow.usual,
  }: { primarySourceId?: string | undefined; window?: WeighInWindow | undefined } = {},
): DayWeighIn[] {
  // Keyed by the time of local midnight, since two Date objects for the
  // same moment are not the same key.
  const byDay = new Map<number, HealthSample[]>();
  for (const sample of samples) {
    if (sample.type !== 'weight') continue;
    const at = sample.start;
    const midnight = new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime();
    const day = byDay.get(midnight);
    if (day === undefined) {
      byDay.set(midnight, [sample]);
    } else {
      day.push(sample);
    }
  }

  const result: DayWeighIn[] = [];
  for (const midnight of [...byDay.keys()].sort((a, b) => a - b)) {
    const all = byDay.get(midnight) ?? [];
    const fromPrimary = all.filter((sample) => sample.sourceId === primarySourceId);
    const group = (fromPrimary.length === 0 ? all : fromPrimary).sort(byStartThenId);
    // An unnamed source is '' here, said as Health Connect (MM-395).
    const names = new Set(group.map((sample) => healthSourceName(sample) ?? ''));
    const day = new Date(midnight);

    const first = group.find((sample) => window.contains(sample.start));
    if (first !== undefined) {
      result.push({
        day,
        kg: first.value,
        basis: 'firstMorning',
        sourceName: healthSourceName(first) ?? '',
        readings: group.length,
        at: first.start,
      });
      continue;
    }

    const values = group.map((sample) => sample.value).sort((a, b) => a - b);
    const mid = Math.trunc(values.length / 2);
    const [onlyName] = names;
    result.push({
      day,
      kg: values.length % 2 === 1 ? (values[mid] as number) : ((values[mid - 1] as number) + (values[mid] as number)) / 2,
      basis: 'medianOfDay',
      sourceName: names.size === 1 && onlyName !== undefined ? onlyName : 'several sources',
      readings: group.length,
    });
  }
  return result;
}
