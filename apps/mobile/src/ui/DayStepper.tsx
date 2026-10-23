import type { MmIconName } from './MmIconName';
import { MmButton } from './MmButton';
import { MmIconButton } from './MmIconButton';
import './ui.css';

interface DayStepperProps {
  /** Said as the group's name where the control does something other than show a day, as 'Logged on' in Edit food (MM-221); its day is then a status. */
  name?: string | undefined;
  label: string;
  /** Absent at the first day there is: no arrow is drawn. */
  onPrevious: (() => void) | undefined;
  /** Absent on today, since there is no tomorrow to step to: no arrow is drawn (MM-592). */
  onNext: (() => void) | undefined;
  /** Absent when already on today. */
  onLabelPress: (() => void) | undefined;
}

/**
 * Steps between days: previous, the day's name (press to return to today),
 * next. An arrow with nowhere to go is not drawn, not drawn off: its room
 * is kept, so the day's name stays where it was (MM-592).
 */
export function DayStepper({ label, onPrevious, onNext, onLabelPress, name }: DayStepperProps) {
  const arrow = (icon: MmIconName, words: string, onPress: (() => void) | undefined) =>
    onPress === undefined ? <span className="mm-day-stepper-end" aria-hidden="true" /> : <MmIconButton icon={icon} label={words} onPress={onPress} />;
  return (
    <div className="mm-day-stepper" role={name === undefined ? undefined : 'group'} aria-label={name}>
      {arrow('chevronLeft', 'Previous day', onPrevious)}
      {onLabelPress === undefined ? (
        <span className="mm-day-stepper-label" role={name === undefined ? undefined : 'status'}>
          {label}
        </span>
      ) : (
        <MmButton label={label} kind="text" onPress={onLabelPress} />
      )}
      {arrow('chevronRight', 'Next day', onNext)}
    </div>
  );
}
