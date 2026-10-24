import type { CoachFinding } from '../engine/analysis/CoachFinding';
import { coachFindingText } from './coachFindingText';
import type { Fmt } from './Fmt';

/** What each signal is about, as the headline names it, and whether it reads as plural. */
const subjects: Readonly<Record<string, readonly [subject: string, plural: boolean]>> = {
  proteinMinimum: ['Protein', false],
  proteinTarget: ['Protein', false],
  proteinByMeal: ['Protein at meals', false],
  proteinDensity: ['Protein per 100 kcal', false],
  fatAgainstTarget: ['Fat', false],
  fatShare: ['Fat', false],
  carbohydrate: ['Carbohydrate', false],
  macroSplit: ['The split', false],
  calorieDensity: ['Calories per gram', false],
  fiber: ['Fiber', false],
  sodium: ['Sodium', false],
  calories: ['Calories', true],
  energyUse: ['Intake against energy use', false],
  mealBalance: ['Protein in meals', false],
  trainingStopped: ['Training', false],
  trainingDropped: ['Training', false],
  setsPerMuscle: ['Weekly sets', true],
  strengthRising: ['Strength', false],
  strengthStalled: ['Strength', false],
  strengthOnFatLoss: ['Strength', false],
  trainingDays: ['Training days', true],
  rirUnrecorded: ['Reps in reserve', true],
  proteinByTrainingDay: ['Protein on training and rest days', false],
  waterOnTrainingDays: ['Water on training days', false],
};

/** The title with a small first letter, to follow a colon; a title that opens with a name or a figure keeps it. */
const following = (title: string) =>
  /^[A-Z][a-z]/.test(title) && !/^[A-Z][a-z]+ [A-Z]/.test(title) ? `${title[0]?.toLowerCase() ?? ''}${title.slice(1)}` : title;

/**
 * MM-610's headline: the top strength and the top fix in one sentence,
 * the fix in its own numbers ("Calories are holding up; worth changing:
 * fat averaged 90 g against 70 g."). About the food or the habit, never
 * the person, and no verdict.
 */
export function coachHeadlineText({ holdingUp, fix }: { holdingUp: CoachFinding; fix: CoachFinding }, fmt: Fmt): string {
  const [subject, plural] = subjects[holdingUp.signal] ?? ['This', false];
  const [fixTitle] = coachFindingText(fix, fmt);
  return `${subject} ${plural ? 'are' : 'is'} holding up; worth changing: ${following(fixTitle)}.`;
}
