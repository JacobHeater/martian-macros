import type { MissedPeriodAnswer } from '../domain/MissedPeriodAnswer';

const labels: Readonly<Record<MissedPeriodAnswer, string>> = {
  contraception: 'Contraception',
  pregnancy: 'Pregnancy',
  menopause: 'Menopause',
  notSure: 'Not sure',
};

/** The words for an answer to the missed-period question (MM-116). */
export function missedPeriodAnswerLabel(answer: MissedPeriodAnswer): string {
  return labels[answer];
}
