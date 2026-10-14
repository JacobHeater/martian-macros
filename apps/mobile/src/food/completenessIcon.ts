import type { DayCompleteness } from '../domain/DayCompleteness';
import type { MmIconName } from '../ui/MmIconName';

const icons: Readonly<Record<DayCompleteness, MmIconName>> = {
  complete: 'dayComplete',
  partial: 'dayPartial',
  unmarked: 'dayUnmarked',
};

/** The mark a day's completeness is drawn with (MM-255), always beside its words. */
export const completenessIcon = (completeness: DayCompleteness): MmIconName => icons[completeness];
