import type { CalendarDate } from '../domain/CalendarDate';
import { ExplanationLine } from '../engine/ExplanationLine';
import type { TargetsRecord } from '../engine/TargetsRecord';
import { explanationLineText } from '../format/explanationLineText';
import { Fmt } from '../format/Fmt';
import { useApp } from '../app/useApp';
import { useNavigator } from '../app/useNavigator';
import { InfoCard } from '../ui/InfoCard';
import { MmButton } from '../ui/MmButton';
import { useOverlays } from '../ui/useOverlays';
import { showTargetChangeSheet } from './showTargetChangeSheet';
import { TargetsHistoryScreen } from './TargetsHistoryScreen';

interface LastChangeCardProps {
  history: readonly TargetsRecord[];
  today: CalendarDate;
  /** Set when the estimate is held for lack of data after calibration. */
  holdNote?: string | undefined;
}

/**
 * The most recent change to the user's targets, in one line, and the way
 * to the full account and to the whole history (MM-138).
 */
export function LastChangeCard({ history, today, holdNote }: LastChangeCardProps) {
  const { services } = useApp();
  const navigator = useNavigator();
  const overlays = useOverlays();
  const current = history[history.length - 1];
  if (current === undefined) return null;
  const explanation = current.explanation;
  let summary: string;
  if (explanation === undefined) {
    summary = explanationLineText(new ExplanationLine('noExplanationRecorded', 0));
  } else if (explanation.previousKcal === undefined) {
    summary = 'Your first targets.';
  } else if (explanation.lines.length === 0) {
    summary =
      `Checked ${Fmt.day(current.effectiveFrom, today)}. No change: ` +
      'no calculated contribution was large enough to move your calorie target.';
  } else {
    const largest = explanation.lines.reduce((a, b) => (Math.abs(a.kcal) >= Math.abs(b.kcal) ? a : b));
    summary =
      `Calories ${Fmt.whole(explanation.previousKcal)} → ${Fmt.whole(explanation.newKcal)}. ` +
      explanationLineText(largest);
  }
  return (
    <InfoCard
      title={`Last change · ${Fmt.day(current.effectiveFrom, today)}`}
      trailing={
        <MmButton label="History" kind="text" onPress={() => void navigator.push(() => <TargetsHistoryScreen />)} />
      }
    >
      <p className="app-text">{summary}</p>
      {holdNote === undefined ? null : <p className="app-caption">{holdNote}</p>}
      <MmButton
        label="See why"
        kind="text"
        onPress={() => void showTargetChangeSheet(overlays, services.targets, history)}
      />
    </InfoCard>
  );
}
