import type { DayCompleteness } from '../domain/DayCompleteness';

const labels: Readonly<Record<DayCompleteness, string>> = {
  complete: 'Marked complete',
  partial: 'Marked partial',
  unmarked: 'Not marked',
};

/** A day's completeness in words (MM-255). */
export const completenessLabel = (completeness: DayCompleteness): string => labels[completeness];
