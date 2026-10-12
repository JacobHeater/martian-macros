import { MiniTrend } from '../charts/MiniTrend';
import { RecoveryQuestion } from '../domain/RecoveryQuestion';
import { RecoveryRule } from '../engine/RecoveryRule';
import { recoveryQuestionLabel } from '../format/recoveryQuestionLabel';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { InfoCard } from '../ui/InfoCard';
import { MmButton } from '../ui/MmButton';
import { RecoveryCheckInScreen } from './RecoveryCheckInScreen';

/**
 * How the user is holding up (MM-116): the weekly check-in when it is due,
 * and each answer as its own small line over the last eight check-ins. The
 * answers are never combined into one number, and never lower a target.
 */
export function RecoveryCard() {
  const { services, state } = useApp();
  const navigator = useNavigator();
  const all = useLoaded(state.recoveryCheckIns) ?? [];
  const due = useCell(state.recoveryCheckInDue);
  const today = useCell(state.today);
  const shown = all.length > RecoveryRule.shownCheckIns ? all.slice(all.length - RecoveryRule.shownCheckIns) : all;
  const latest = shown[shown.length - 1];
  return (
    <InfoCard title="How you are holding up">
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
    </InfoCard>
  );
}
