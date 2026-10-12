import type { CalendarDate } from '../domain/CalendarDate';
import { TrendShift } from './TrendShift';

type ShiftOn = (date: CalendarDate) => TrendShift | undefined;

export function combineTrendShifts(first: ShiftOn | undefined, second: ShiftOn | undefined): ShiftOn | undefined {
  if (first === undefined) return second;
  if (second === undefined) return first;
  return (date) => {
    const a = first(date);
    const b = second(date);
    if (a === undefined) return b;
    if (b === undefined) return a;
    return new TrendShift({
      levelMeanKg: a.levelMeanKg + b.levelMeanKg,
      levelSigmaKg: Math.sqrt(a.levelSigmaKg * a.levelSigmaKg + b.levelSigmaKg * b.levelSigmaKg),
      slopeSigmaKgPerDay: Math.sqrt(
        a.slopeSigmaKgPerDay * a.slopeSigmaKgPerDay + b.slopeSigmaKgPerDay * b.slopeSigmaKgPerDay,
      ),
    });
  };
}
