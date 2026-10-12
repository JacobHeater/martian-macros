import { Fmt } from '../format/Fmt';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useNavigator } from '../app/useNavigator';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';
import { PauseScreen } from './PauseScreen';

/**
 * Says that coaching is paused, until when, and what that means (MM-148).
 * Empty when no pause covers today.
 */
export function PauseBanner() {
  const { state } = useApp();
  const navigator = useNavigator();
  const pause = useCell(state.activePause);
  const guide = useCell(state.maintenanceGuide);
  if (pause === undefined) return null;
  return (
    <div className="app-stack-item">
      <Notice
        icon="pause"
        title={`Paused until ${Fmt.shortDay(pause.to)}`}
        text={
          'Targets are on hold and no check-in runs. ' +
          `${guide === undefined ? '' : `As a guide, maintenance is about ${Fmt.whole(guide.kcal)} kcal a day. `}` +
          'Log or weigh in if you like; nothing is counted against you.'
        }
        action={
          <MmButton label="Manage pause" kind="secondary" onPress={() => void navigator.push(() => <PauseScreen />)} />
        }
      />
    </div>
  );
}
