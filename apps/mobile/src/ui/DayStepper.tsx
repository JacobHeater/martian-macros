import { MmButton } from './MmButton';
import { MmIconButton } from './MmIconButton';
import './ui.css';

interface DayStepperProps {
  label: string;
  onPrevious: (() => void) | undefined;
  onNext: (() => void) | undefined;
  /** Absent when already on today. */
  onLabelPress: (() => void) | undefined;
}

/** Steps between days: previous, the day's name (press to return to today), next. */
export function DayStepper({ label, onPrevious, onNext, onLabelPress }: DayStepperProps) {
  return (
    <div className="mm-day-stepper">
      <MmIconButton icon="chevronLeft" label="Previous day" onPress={onPrevious} />
      {onLabelPress === undefined ? (
        <span className="mm-day-stepper-label">{label}</span>
      ) : (
        <MmButton label={label} kind="text" onPress={onLabelPress} />
      )}
      <MmIconButton icon="chevronRight" label="Next day" onPress={onNext} />
    </div>
  );
}
