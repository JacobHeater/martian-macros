import type { LeanGainPaceOption } from '../engine/LeanGainPaceOption';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { Fmt } from './Fmt';
import { leanGainPaceName } from './leanGainPaceName';

const sentences = {
  standard: 'The pace your training experience sets, and the fastest the coach runs.',
  slower: 'Half of that: muscle comes more slowly, and less of the gain goes to fat. Suits a gain that looks fat-heavy.',
} as const;

/** A weekly pace as a plain percent, to three places at most: "0.15%", "0.075%". */
const percent = (fraction: number) => `${roundHalfAwayFromZero(fraction * 100000) / 1000}%`;

/**
 * A lean-gain pace as a choice (MM-480): its name and the percent a week it
 * aims for; then the surplus it means today, the target that results, one
 * sentence of consequence, and the surplus cap when it acted.
 */
export function leanGainPaceOptionText(option: LeanGainPaceOption): { label: string; detail: string } {
  const label = `${leanGainPaceName(option.pace)} · ${percent(option.fraction)} a week`;
  const parts = [
    `About ${Fmt.whole(option.surplusKcal)} kcal a day over your expenditure, for a target of ${Fmt.kcal(option.targetKcal)}.`,
    sentences[option.pace],
  ];
  if (option.capped) parts.push('Capped at a share of your expenditure: beyond it, the extra mostly adds fat.');
  return { label, detail: parts.join(' ') };
}
