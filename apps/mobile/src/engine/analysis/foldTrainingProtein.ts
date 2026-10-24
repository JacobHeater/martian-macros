import type { CoachFinding } from './CoachFinding';

/**
 * MM-609's X1 (protein on rest and training days) folded into MM-606's N1
 * (the protein minimum) when both are in change (MM-610): X1 is not said
 * as a line of its own, and its figures go into N1's, under its signal's
 * name ("proteinByTrainingDay.restMet"), as a family's others do. Anything
 * else is left as it is.
 */
export function foldTrainingProtein(findings: readonly CoachFinding[]): CoachFinding[] {
  const n1 = findings.find((f) => f.signal === 'proteinMinimum' && f.kind === 'fix');
  const x1 = findings.find((f) => f.signal === 'proteinByTrainingDay' && f.kind === 'fix');
  if (n1 === undefined || x1 === undefined) return [...findings];
  const supporting: Record<string, number> = {};
  for (const [name, value] of Object.entries(x1.figures)) supporting[`proteinByTrainingDay.${name}`] = value;
  const folded: CoachFinding = { ...n1, figures: { ...n1.figures, ...supporting } };
  return findings.filter((f) => f !== x1).map((f) => (f === n1 ? folded : f));
}
