import type { CoachFinding } from '../../engine/analysis/CoachFinding';
import { TrainingFindingSignal } from '../../engine/analysis/TrainingFindingSignal';
import type { Fmt } from '../Fmt';
import { coachAdviceText } from './coachAdviceText';
import { coachPhrase } from './coachPhrase';
import { coachPhraseKey } from './coachPhraseKey';
import { foodFindingText } from './foodFindingText';
import { followUpFindingText } from './followUpFindingText';
import { sentenceCase } from './sentenceCase';
import { trainingFindingText } from './trainingFindingText';

type Evidence = readonly (readonly [label: string, value: string])[];

const trainingSignals: readonly string[] = TrainingFindingSignal.values;

/** The accountability's findings of their own (MM-617), a follow-up with nowhere to ride. */
const followUpSignals: readonly string[] = ['saidBefore', 'repeatOver', 'adviceTaken'];

/**
 * The words of any finding of "What your data says" (MM-610), in the
 * coach's voice (MM-617): the training, water and sleep signals' (MM-609)
 * or the food signals' (MM-606, MM-612), chosen by the signal, 1d's
 * closing line, and the accountability's follow-ups said on their own
 * (`saidBefore`, `repeatOver`, `adviceTaken`; riding ones are said in their
 * host's text, right after its lead). Two things are added to "The numbers behind this": the
 * days a span left out and why, beside the days counted (unless the
 * finding gave its own); and, when MM-609's protein on rest and training
 * days was folded into the protein minimum, its figures, as the minimum's
 * supporting line, said before the minimum's orders.
 */
export function coachFindingText(f: CoachFinding, fmt: Fmt): readonly [title: string, body: string, evidence: Evidence] {
  if (trainingSignals.includes(f.signal)) return trainingFindingText(f, fmt);
  if (followUpSignals.includes(f.signal)) return followUpFindingText(f, fmt);
  const [title, body, evidence] = foodFindingText(f, fmt);
  const rows = [...evidence];
  const countedAt = rows.findIndex(([label]) => label === 'Days counted');
  const counted = rows[countedAt];
  // Once: a finding that says its own days left out (fiber, sodium: without that nutrient's data) keeps its row.
  if (f.span > 1 && counted !== undefined && !rows.some(([label]) => label === 'Days left out')) {
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
  const folded = coachPhrase('foldedProteinByTrainingDay', coachPhraseKey(f), {
    trainingMet: `${trainingMet}`,
    trainingDays: `${trainingDays}`,
    restMet: `${restMet}`,
    restDays: `${restDays}`,
    lower,
    lowerStart: sentenceCase(lower),
  });
  // Before the minimum's orders, so the line still ends in one.
  const first = coachAdviceText(f, fmt).sentences[0];
  const at = first === undefined ? -1 : body.indexOf(first);
  return [title, at < 0 ? `${body} ${folded}` : `${body.slice(0, at)}${folded} ${body.slice(at)}`, rows];
}
