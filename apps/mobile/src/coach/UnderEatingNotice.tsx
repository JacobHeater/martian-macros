import { underEatingText } from '../format/underEatingText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';

/**
 * One neutral notice when logged days sit far below the calorie floor for
 * two weeks (MM-114). It leads with the innocent explanation and makes its
 * fix one tap. It changes no target and praises nothing.
 */
export function UnderEatingNotice() {
  const { services, state } = useApp();
  const finding = useCell(state.underEatingNotice);
  const screening = useLoaded(state.setup)?.screening;
  const history = screening?.eatingDisorderHistory ?? false;
  const weightLossMedication = screening?.weightLossMedication ?? false;
  const today = useCell(state.today);
  if (finding === undefined) return null;
  const markPartial = async () => {
    for (const day of finding.lowDays) await services.dayMarks.setCompleteness(day, 'partial');
  };
  return (
    <div className="app-stack-item">
      <Notice
        kind="caution"
        title="About your logged days"
        text={underEatingText(finding, { supportLine: history, weightLossMedication })}
        action={
          <div className="app-row">
            <MmButton label="Mark those days partial" kind="secondary" onPress={() => void markPartial()} />
            <MmButton
              label="They are complete"
              kind="text"
              onPress={() => void services.preferences.saveUnderEatingDismissedOn(today)}
            />
          </div>
        }
      />
    </div>
  );
}
