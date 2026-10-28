import type { ReactNode } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import { InlineNarrationContext } from './InlineNarrationContext';
import { useInlineNarration } from './useInlineNarration';

interface InlineNarrationProviderProps {
  day: CalendarDate;
  children: ReactNode;
}

/** Gives the food rows of `day` their lines in the model's words, asked once for the day (MM-687). */
export function InlineNarrationProvider({ day, children }: InlineNarrationProviderProps) {
  const narration = useInlineNarration(day);
  return <InlineNarrationContext.Provider value={narration}>{children}</InlineNarrationContext.Provider>;
}
