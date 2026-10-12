import type { CalendarDate } from '../domain/CalendarDate';
import { TrainingStatus } from '../domain/TrainingStatus';
import { trainingStatusLabel } from '../format/trainingStatusLabel';
import { clamp } from '../lang/clamp';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { ChoiceCard } from '../ui/ChoiceCard';
import { MmIcon } from '../ui/MmIcon';
import { MmListRow } from '../ui/MmListRow';
import { MmSlider } from '../ui/MmSlider';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { SectionLabel } from '../ui/SectionLabel';

interface TrainingStepProps {
  status: TrainingStatus;
  trainingDays: number;
  /** The user's own estimate, or undefined if they do not know it. */
  bodyFat: number | undefined;
  creatineStartedOn: CalendarDate | undefined;
  onCreatine: (on: boolean) => void;
  onPickCreatineStartDate: () => void;
  onStatus: (status: TrainingStatus) => void;
  onTrainingDays: (days: number) => void;
  onBodyFatKnown: (known: boolean) => void;
  onBodyFat: (percent: number) => void;
}

/** Step 5: training experience, days per week and optional body fat. */
export function TrainingStep({
  status,
  trainingDays,
  bodyFat,
  creatineStartedOn,
  onCreatine,
  onPickCreatineStartDate,
  onStatus,
  onTrainingDays,
  onBodyFatKnown,
  onBodyFat,
}: TrainingStepProps) {
  const whole = (value: number) => roundHalfAwayFromZero(value) + 0;
  return (
    <>
      <h1 className="app-headline">Training</h1>
      <div className="app-gap-small" />
      <SectionLabel text="Resistance training experience" />
      {TrainingStatus.values.map((option) => (
        <ChoiceCard
          key={option}
          label={trainingStatusLabel(option)}
          selected={status === option}
          dense
          onPress={() => onStatus(option)}
        />
      ))}
      <div className="app-gap" />
      <SectionLabel text={`Training days per week: ${trainingDays}`} />
      <MmSlider
        name="Training days per week"
        value={trainingDays}
        max={7}
        divisions={7}
        label={`${trainingDays}`}
        onChange={(value) => onTrainingDays(whole(value))}
      />
      <div className="app-gap-small" />
      <SectionLabel text="Body fat (optional)" />
      <p className="app-text">
        If you have a recent estimate (DEXA, calipers, or a consistent scale), enter it. Otherwise leave it off and the
        app estimates.
      </p>
      <MmSwitchRow
        flush
        title={bodyFat === undefined ? 'I don’t know' : `About ${whole(bodyFat)}% body fat`}
        value={bodyFat !== undefined}
        onChange={onBodyFatKnown}
      />
      {bodyFat === undefined ? null : (
        <MmSlider
          name="Body fat"
          value={clamp(bodyFat, 5, 55)}
          min={5}
          max={55}
          divisions={50}
          label={`${whole(bodyFat)}%`}
          onChange={(value) => onBodyFat(whole(value))}
        />
      )}
      <div className="app-gap-small" />
      <SectionLabel text="Creatine" />
      <MmSwitchRow
        flush
        title="I currently take creatine"
        value={creatineStartedOn !== undefined}
        onChange={onCreatine}
      />
      {creatineStartedOn === undefined ? null : (
        <MmListRow
          title="When did you start?"
          subtitle={creatineStartedOn.toString()}
          trailing={<MmIcon name="history" />}
          onPress={onPickCreatineStartDate}
        />
      )}
    </>
  );
}
