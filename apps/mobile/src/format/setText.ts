import type { ExerciseLoad, WorkoutSet } from '../domain';
import type { Fmt } from './Fmt';
import { loadNumber } from './loadNumber';
import { rirText } from './rirText';

/**
 * One set in words (MM-75): "8 × 225 lb", and for a bodyweight exercise
 * "8 reps", "8 × +25 lb" or "8 × 20 lb assisted". Reps in reserve
 * follow when recorded: "8 × 225 lb · 2 RIR".
 */
export function setText(set: WorkoutSet, fmt: Fmt, load: ExerciseLoad): string {
  const amount = loadNumber(Math.abs(fmt.weightFromKg(set.loadKg)));
  const unit = fmt.weightUnit;
  const reps = set.reps === 1 ? '1 rep' : `${set.reps} reps`;
  let work: string;
  if (load === 'addedWeight') work = `${set.reps} × ${amount} ${unit}`;
  else if (set.loadKg === 0) work = reps;
  else if (set.loadKg > 0) work = `${set.reps} × +${amount} ${unit}`;
  else work = `${set.reps} × ${amount} ${unit} assisted`;
  const rir = set.rir;
  if (rir === undefined) return work;
  return `${work} · ${rirText(rir)} RIR`;
}
