import { loggingStreakText } from '../format/loggingStreakText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { MmListRow } from '../ui/MmListRow';

/**
 * A quiet acknowledgement of the work (MM-92): how many whole days have
 * been logged in a row, as the last row of the Dashboard's list group
 * (MM-254; inside the card since MM-291, never bare on the canvas). No
 * confetti, no notification, and nothing about weight or how much was
 * eaten. Empty until there is a streak worth saying.
 */
export function ProcessCard() {
  const { state } = useApp();
  const line = loggingStreakText(useCell(state.loggingStreak));
  if (line === undefined) return null;
  return <MmListRow leadingIcon="checklist" title={line} subtitle="Your logging" />;
}
