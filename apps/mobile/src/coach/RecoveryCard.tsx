import { useState } from 'react';
import { MiniTrend } from '../charts/MiniTrend';
import { RecoveryQuestion } from '../domain/RecoveryQuestion';
import { RecoveryRule } from '../engine/RecoveryRule';
import { SleepRule } from '../engine/SleepRule';
import { Fmt } from '../format/Fmt';
import { recoveryQuestionLabel } from '../format/recoveryQuestionLabel';
import { sleepDurationText } from '../format/sleepDurationText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { Loadable } from '../state/Loadable';
import { useNavigator } from '../app/useNavigator';
import { MmButton } from '../ui/MmButton';
import { MmSection } from '../ui/MmSection';
import { StatRow } from '../ui/StatRow';
import { RecoveryCheckInScreen } from './RecoveryCheckInScreen';

/**
 * How the user is holding up (MM-116): the weekly check-in when it is due,
 * and each answer as its own small line over the last eight check-ins. A
 * section that is open while the check-in is due and folded to one line
 * otherwise (MM-256). The answers are never combined into one number, and
 * never lower a target. The fourteen-night sleep average sits here as a
 * line (MM-252): hours and nights, no score and no colour.
 */
export function RecoveryCard() {
  const { services, state } = useApp();
  const navigator = useNavigator();
  const all = useLoaded(state.recoveryCheckIns) ?? [];
  const due = useCell(state.recoveryCheckInDue);
  const sleep = useCell(state.sleepAverage);
  // A read that went wrong is said, never shown as no nights (MM-334).
  const sleepUnread = Loadable.hasFailed(useCell(state.sleepNights));
  const today = useCell(state.today);
  const [wasDue, setWasDue] = useState(due);
  const [timesDue, setTimesDue] = useState(0);
  if (due !== wasDue) {
    setWasDue(due);
    if (due) setTimesDue(timesDue + 1);
  }
  const shown = all.length > RecoveryRule.shownCheckIns ? all.slice(all.length - RecoveryRule.shownCheckIns) : all;
  const latest = shown[shown.length - 1];
  let summary: string;
  if (due) summary = 'This week’s five questions are due.';
  else if (latest === undefined) summary = 'Five quick questions a week. Not answered yet.';
  else summary = `Last answered ${Fmt.day(latest.date, today)}.`;
  // While the check-in is due the line is its call alone; otherwise it carries the sleep figure (the panel's PD-10).
  if (!due && sleep !== undefined) summary += ` Sleep ${sleepDurationText(sleep.averageMinutes)} over ${sleep.nights} nights.`;
  let sleepValue: string;
  let sleepDetail: string;
  if (sleepUnread) {
    sleepValue = 'Not read';
    sleepDetail = 'Could not read your nights of sleep. Progress has the way to try again.';
  } else if (sleep === undefined) {
    sleepValue = 'Not recorded';
    sleepDetail = 'Nights are typed on Progress or read from your health platform.';
  } else {
    sleepValue = sleepDurationText(sleep.averageMinutes);
    sleepDetail = `${sleep.nights} of ${SleepRule.windowNights} nights recorded`;
  }
  return (
    // Drawn anew each time it falls due, which may be after the check-ins are read, so it opens then;
    // answering leaves it open with the answers (MM-339).
    <MmSection key={timesDue} icon="heart" title="How you are holding up" summary={summary} collapsible initiallyExpanded={due} remember={`coach.recovery.${timesDue}`}>
      {/* The record, not the check-in's word for it (MM-250): typed on Progress or read from the health platform. */}
      <StatRow label={`Sleep, last ${SleepRule.windowNights} nights`} value={sleepValue} detail={sleepDetail} />
      {latest === undefined ? (
        <p className="app-text">
          Five quick questions a week on hunger, energy, sleep, training and mood. They are what the food log and the
          scale cannot see.
        </p>
      ) : (
        <>
          {RecoveryQuestion.values.map((question) => (
            <div key={question} className="coach-recovery-row">
              <span className="coach-recovery-name">{recoveryQuestionLabel(question)}</span>
              <span className="app-muted">
                {latest.answer(question)} of {RecoveryRule.highest}
              </span>
              <MiniTrend
                values={shown.map((c) => c.answer(question))}
                min={RecoveryRule.lowest}
                max={RecoveryRule.highest}
                slots={RecoveryRule.shownCheckIns}
                label={
                  `${recoveryQuestionLabel(question)} over the last ${shown.length} ` +
                  `check-ins: ${shown.map((c) => c.answer(question)).join(', ')}`
                }
              />
            </div>
          ))}
          <p className="app-caption">
            1 is the hard end, 5 the easy end. Your answers only ever lead to an offer of relief, never to a lower
            target.
          </p>
        </>
      )}
      <div className="app-row coach-recovery-actions">
        <MmButton
          label={due ? 'Answer this week' : all.length === 0 ? 'Answer now' : 'Answer again'}
          kind={due ? 'secondary' : 'text'}
          onPress={() => void navigator.push(() => <RecoveryCheckInScreen />)}
        />
        {due ? (
          <MmButton
            label="Skip this week"
            kind="text"
            onPress={() => void services.preferences.saveRecoveryCheckInSkippedOn(today)}
          />
        ) : null}
      </div>
    </MmSection>
  );
}
