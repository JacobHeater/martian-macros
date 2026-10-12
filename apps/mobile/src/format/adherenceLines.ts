import type { AdherenceSummary } from '../engine';
import { StateError } from '../lang/StateError';
import { Fmt } from './Fmt';

const daysWord = (count: number) => (count === 1 ? 'day' : 'days');

function intakeLine(s: AdherenceSummary, floorKcal: number): string {
  const intake = s.averageIntakeKcal;
  if (intake === undefined) return 'No complete days';
  const target = s.averageTargetKcal;
  const figure =
    target === undefined ? `${Fmt.whole(intake)} kcal` : `${Fmt.whole(intake)} kcal against ${Fmt.whole(target)}`;
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
      standing = `below the app's minimum of ${Fmt.whole(floorKcal)}`;
      break;
  }
  const notes: string[] = [];
  if (s.completeDays < 4) notes.push(`rests on ${s.completeDays} ${daysWord(s.completeDays)}`);
  if (s.mostlyEstimated) notes.push('mostly estimated');
  return [standing === undefined ? figure : `${figure}: ${standing}`, ...notes].join(' · ');
}

/**
 * The week's adherence as label and value pairs (MM-149): facts, with no
 * score, percentage or grade. Over and under are worded the same way; below
 * the app's minimum is its own wording and is never "under target".
 */
export function adherenceLines(
  s: AdherenceSummary,
  { floorKcal }: { floorKcal: number },
): (readonly [label: string, value: string])[] {
  let days: string;
  if (s.daysLogged === 0) days = 'None';
  else if (s.completeDays === s.daysLogged) days = `${s.daysLogged}, all complete`;
  else days = `${s.daysLogged}, ${s.completeDays} complete`;
  const lines: (readonly [string, string])[] = [
    ['Days logged', days],
    ['Weigh-ins', `${s.weighIns}`],
    ['Average intake', intakeLine(s, floorKcal)],
  ];
  const protein = s.proteinDays;
  if (protein !== undefined) {
    lines.push(['Protein minimum met', `${protein} of ${s.completeDays} ${daysWord(s.completeDays)}`]);
  }
  return lines;
}
