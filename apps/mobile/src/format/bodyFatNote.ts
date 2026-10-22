import { type BodyFatBasis, BodyFatRule } from '../engine';

/**
 * The line under the Body row's body fat (MM-34): what would narrow a
 * rough range, or what a range from the waist can and cannot say. With an
 * eating-disorder history the app never asks for more measuring, so a
 * rough range has no line.
 */
export function bodyFatNote(basis: BodyFatBasis, { eatingDisorderHistory }: { eatingDisorderHistory: boolean }): string | undefined {
  switch (basis) {
    case 'yourFigure':
      return undefined;
    case 'formula':
      return eatingDisorderHistory
        ? undefined
        : `${BodyFatRule.minWaistEntries} waist measurements within ${BodyFatRule.waistWindowDays / 7} weeks narrow this range.`;
    case 'waist':
      return 'From your height, weight and waist. A tape narrows the range but cannot pin body fat down.';
    case 'scale':
      return (
        'Your scale’s readings over weeks join your height and weight. Averaging removes the day-to-day scatter, ' +
        'not a scale’s fixed bias, so it stays a range.'
      );
  }
}
