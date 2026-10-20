import type { AdherenceSummary } from '../engine';
import { StateError } from '../lang/StateError';
import type { AdherenceLine } from './AdherenceLine';
import { Fmt } from './Fmt';

const daysWord = (count: number) => (count === 1 ? 'day' : 'days');

function intakeLine(s: AdherenceSummary, floorKcal: number, underEatingNotice: boolean): AdherenceLine {
  const intake = s.averageIntakeKcal;
  if (intake === undefined) return { label: 'Average intake', value: 'No complete days' };
  const target = s.averageTargetKcal;
  const figure = `${Fmt.whole(intake)} kcal`;
  const against = target === undefined ? undefined : `against a ${Fmt.whole(target)} kcal target`;
  const distance = (): string => {
    const kcal = s.distanceKcal;
    if (kcal === undefined) throw new StateError('An intake above or below target has a distance from it.');
    return Fmt.whole(Math.abs(kcal));
  };
  let standing: string | undefined;
  switch (s.standing) {
    case undefined:
      standing = undefined;
      break;
    case 'onTarget':
      standing = 'on target';
      break;
    case 'above':
      standing = `${distance()} over`;
      break;
    case 'below':
      standing = `${distance()} under`;
      break;
    case 'belowFloor':
      // Never "under target": its own words, and a pointer to the notice about those days when it is showing (MM-114).
      standing = `below the app's minimum of ${Fmt.whole(floorKcal)}${underEatingNotice ? '; see the notice about your logged days' : ''}`;
      break;
  }
  const notes: string[] = [];
  if (s.completeDays < 4) notes.push(`rests on ${s.completeDays} ${daysWord(s.completeDays)}`);
  if (s.mostlyEstimated) notes.push('mostly estimated');
  const measured = against === undefined ? standing : standing === undefined ? against : `${against}: ${standing}`;
  const detail = [measured, ...notes].filter((part) => part !== undefined).join(' · ');
  return detail === '' ? { label: 'Average intake', value: figure } : { label: 'Average intake', value: figure, detail };
}

/**
 * The week's adherence as lines (MM-149): facts, with no score, percentage
 * or grade. Each value is a figure; the target, the distance from it and
 * what the figure rests on are the line's detail (MM-342). Over and under
 * are worded the same way; below the app's minimum is its own wording and
 * is never "under target".
 */
export function adherenceLines(
  s: AdherenceSummary,
  { floorKcal, underEatingNotice = false }: { floorKcal: number; underEatingNotice?: boolean },
): AdherenceLine[] {
  const days: AdherenceLine =
    s.daysLogged === 0
      ? { label: 'Days logged', value: 'None' }
      : { label: 'Days logged', value: `${s.daysLogged}`, detail: s.completeDays === s.daysLogged ? 'all complete' : `${s.completeDays} complete` };
  const lines: AdherenceLine[] = [
    days,
    { label: 'Weigh-ins', value: `${s.weighIns}` },
    intakeLine(s, floorKcal, underEatingNotice),
  ];
  if (s.workouts !== undefined) lines.push({ label: 'Workouts', value: `${s.workouts}` });
  const protein = s.proteinDays;
  if (protein !== undefined) {
    lines.push({ label: 'Protein minimum met', value: `${protein} of ${s.completeDays} ${daysWord(s.completeDays)}` });
  }
  return lines;
}
