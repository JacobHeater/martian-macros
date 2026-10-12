import type { ExerciseLoad } from '../domain';
import type { ProgressionKind, ProgressionSuggestion } from '../engine';
import type { Fmt } from './Fmt';
import { loadNumber } from './loadNumber';

/**
 * A suggestion for the next session and its reason, in one or two short
 * sentences (MM-79): "One more rep on any set would be a step up." It is
 * read under what was done last time, so it does not repeat it, and it
 * offers; it does not tell the user what to do.
 */
export function progressionText(suggestion: ProgressionSuggestion, fmt: Fmt, load: ExerciseLoad): string {
  const loadText = (kg: number): string | undefined => {
    const amount = `${loadNumber(Math.abs(fmt.weightFromKg(kg)))} ${fmt.weightUnit}`;
    if (load === 'addedWeight') return amount;
    if (Math.abs(kg) < 0.05) return undefined;
    return kg > 0 ? `+${amount}` : `${amount} assisted`;
  };
  const at = loadText(suggestion.loadKg);
  const next = at === undefined ? `${suggestion.reps} reps` : `${at} × ${suggestion.reps}`;
  const texts: Readonly<Record<ProgressionKind, string>> = {
    addReps: 'One more rep on any set would be a step up.',
    addLoad: `Every set reached ${suggestion.rangeTop} last time. A step up would be ${next}.`,
    hold: `No more reps at this load in three sessions. Holding ${next} is a fair aim.`,
    match: 'Matching last time holds your strength while you lose fat.',
  };
  return texts[suggestion.kind];
}
