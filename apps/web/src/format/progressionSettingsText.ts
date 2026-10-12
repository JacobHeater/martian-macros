import type { Fmt } from './Fmt';
import { loadNumber } from './loadNumber';

/**
 * The rep range and load step suggestions are made with, in a line
 * (MM-79): "6 to 10 reps · 5 lb steps".
 */
export function progressionSettingsText({
  repsLow,
  repsHigh,
  loadStepKg,
  fmt,
}: {
  repsLow: number;
  repsHigh: number;
  loadStepKg: number;
  fmt: Fmt;
}): string {
  return `${repsLow} to ${repsHigh} reps · ${loadNumber(fmt.weightFromKg(loadStepKg))} ${fmt.weightUnit} steps`;
}
