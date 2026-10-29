import type { CalendarDate } from '../domain/CalendarDate';
import type { DayCompleteness } from '../domain/DayCompleteness';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { MmStatusChip } from '../ui/MmStatusChip';
import { completenessIcon } from './completenessIcon';

const words: Readonly<Record<DayCompleteness, string>> = {
  complete: 'Complete',
  partial: 'Partial',
  unmarked: 'Not marked',
};

const tones: Readonly<Record<DayCompleteness, 'positive' | 'caution' | 'neutral'>> = {
  complete: 'positive',
  partial: 'caution',
  unmarked: 'neutral',
};

/**
 * The day's completeness as a chip at the top right of the Food hero
 * (MM-692, the owner from the phone): its mark (MM-255) and its word on a
 * fill that says which it is, in every state. It shows state only; the
 * control is the row after the meals (`FoodCompletenessRow`).
 */
export function FoodCompletenessChip({ day }: { day: CalendarDate }) {
  const { state } = useApp();
  const completeness = useLoaded(state.completeness(day)) ?? 'unmarked';
  return <MmStatusChip label={words[completeness]} icon={completenessIcon(completeness)} tone={tones[completeness]} />;
}
