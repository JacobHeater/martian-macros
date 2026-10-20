import { MmButton } from './MmButton';
import { MmIconButton } from './MmIconButton';
import './ui.css';

interface DayStepperProps {
  /** Said as the group's name where the control does something other than show a day, as 'Logged on' in Edit food (MM-221); its day is then a status. */
  name?: string | undefined;
  label: string;
  onPrevious: (() => void) | undefined;
  onNext: (() => void) | undefined;
  /** Absent when already on today. */
  onLabelPress: (() => void) | undefined;
}

/** Steps between days: previous, the day's name (press to return to today), next. */
export function DayStepper({ label, onPrevious, onNext, onLabelPress, name }: DayStepperProps) {
  return (
    <div className="mm-day-stepper" role={name === undefined ? undefined : 'group'} aria-label={name}>
      <MmIconButton icon="chevronLeft" label="Previous day" onPress={onPrevious} />
      {onLabelPress === undefined ? (
        <span className="mm-day-stepper-label" role={name === undefined ? undefined : 'status'}>
          {label}
        </span>
      ) : (
        <MmButton label={label} kind="text" onPress={onLabelPress} />
      )}
      <MmIconButton icon="chevronRight" label="Next day" onPress={onNext} />
    </div>
  );
}
