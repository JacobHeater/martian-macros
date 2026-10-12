import { loggingStreakText } from '../format/loggingStreakText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { InfoCard } from '../ui/InfoCard';

/**
 * A quiet acknowledgement of the work (MM-92): how many whole days have
 * been logged in a row. No confetti, no notification, and nothing about
 * weight or how much was eaten. Empty until there is a streak worth saying.
 */
export function ProcessCard() {
  const { state } = useApp();
  const line = loggingStreakText(useCell(state.loggingStreak));
  if (line === undefined) return null;
  return (
    <InfoCard title="Your logging">
      <p className="app-text">{line}</p>
    </InfoCard>
  );
}
