import type { CoachFinding } from '../engine/analysis/CoachFinding';
import { TrainingFindingSignal } from '../engine/analysis/TrainingFindingSignal';
import { foodFindingText } from './foodFindingText';
import type { Fmt } from './Fmt';
import { trainingFindingText } from './trainingFindingText';

type Evidence = readonly (readonly [label: string, value: string])[];

const trainingSignals: readonly string[] = TrainingFindingSignal.values;

/**
 * The words of any finding of "What your data says" (MM-610): the training,
 * water and sleep signals' (MM-609) or the food signals' (MM-606, MM-612),
 * chosen by the signal. Two things are added to "The numbers behind this":
 * the days a span left out and why, beside the days counted; and, when
 * MM-609's protein on rest and training days was folded into the protein
 * minimum, its figures, as the minimum's supporting line.
 */
export function coachFindingText(f: CoachFinding, fmt: Fmt): readonly [title: string, body: string, evidence: Evidence] {
  if (trainingSignals.includes(f.signal)) return trainingFindingText(f, fmt);
  const [title, body, evidence] = foodFindingText(f, fmt);
  const rows = [...evidence];
  const countedAt = rows.findIndex(([label]) => label === 'Days counted');
  const counted = rows[countedAt];
  if (f.span > 1 && counted !== undefined) {
    const leftOut = f.span - Number(counted[1]);
    if (leftOut > 0) rows.splice(countedAt + 1, 0, ['Days left out', `${leftOut}, not fully logged`]);
  }
  const x = (key: string) => f.figures[`proteinByTrainingDay.${key}`];
  const trainingDays = x('trainingDays');
  const trainingMet = x('trainingMet');
  const restDays = x('restDays');
  const restMet = x('restMet');
  if (trainingDays === undefined || trainingMet === undefined || restDays === undefined || restMet === undefined) {
    return [title, body, rows];
  }
  const ruleAt = rows.findIndex(([label]) => label === 'Rule');
  rows.splice(ruleAt < 0 ? rows.length : ruleAt, 0, ['Training days at the minimum', `${trainingMet} of ${trainingDays}`], [
    'Rest days at the minimum',
    `${restMet} of ${restDays}`,
  ]);
  const lower = x('lowerOnRestDays') === 1 ? 'rest days' : 'training days';
  return [
    title,
    `${body} Over the last 14 days it was met on ${trainingMet} of ${trainingDays} training days and ${restMet} of ` +
      `${restDays} rest days, lower on ${lower}; the minimum is the same every day.`,
    rows,
  ];
}
