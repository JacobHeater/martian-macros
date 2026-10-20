import { useContext, useState } from 'react';
import { RecoveryCheckIn } from '../domain/RecoveryCheckIn';
import { RecoveryQuestion } from '../domain/RecoveryQuestion';
import { RecoveryRule } from '../engine/RecoveryRule';
import { parseNumber } from '../format/parseNumber';
import { SleepRule } from '../engine/SleepRule';
import { recoveryHighWord } from '../format/recoveryHighWord';
import { recoveryLowWord } from '../format/recoveryLowWord';
import { recoveryQuestionText } from '../format/recoveryQuestionText';
import { CloseScreenContext } from '../app/CloseScreenContext';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { MmButton } from '../ui/MmButton';
import { MmSegmented } from '../ui/MmSegmented';
import { MmDurationField } from '../ui/MmDurationField';
import { SectionLabel } from '../ui/SectionLabel';

const answers = Array.from({ length: RecoveryRule.highest - RecoveryRule.lowest + 1 }, (_, i) => RecoveryRule.lowest + i);

/** Hours and minutes as typed, from minutes kept. */
const fieldsOf = (minutes: number | undefined) =>
  minutes === undefined
    ? { hours: '', minutes: '' }
    : { hours: `${Math.trunc(minutes / 60)}`, minutes: `${Math.round(minutes - Math.trunc(minutes / 60) * 60)}` };

/**
 * The weekly recovery check-in (MM-116): five answers and, if given, hours
 * of sleep. The hours are filled from the last fourteen nights recorded
 * (MM-252) and can be changed; with no night recorded they start empty.
 */
export function RecoveryCheckInScreen() {
  const { services, state } = useApp();
  const close = useContext(CloseScreenContext);
  const average = useCell(state.sleepAverage);
  const [given, setGiven] = useState<Partial<Record<RecoveryQuestion, number>>>({});
  const [typedSleep, setTypedSleep] = useState<{ hours: string; minutes: string }>();
  const sleepFields = typedSleep ?? fieldsOf(average?.averageMinutes);

  const { hunger, energy, sleep, training, mood } = given;
  const complete =
    hunger !== undefined && energy !== undefined && sleep !== undefined && training !== undefined && mood !== undefined;

  const save = async () => {
    if (!complete) return;
    // Hours of sleep, when something sensible was typed or filled in.
    const h = sleepFields.hours.trim() === '' ? 0 : parseNumber(sleepFields.hours);
    const m = sleepFields.minutes.trim() === '' ? 0 : parseNumber(sleepFields.minutes);
    const hours = h === undefined || m === undefined ? undefined : h + m / 60;
    await services.recovery.saveRecoveryCheckIn(
      new RecoveryCheckIn({
        date: state.today.peek(),
        hunger,
        energy,
        sleep,
        training,
        mood,
        sleepHours: hours === undefined || hours <= 0 || hours > 24 ? undefined : hours,
      }),
    );
    close?.();
  };

  return (
    <Screen title="This week">
      <p className="app-text">
        Five quick ones on how you are holding up. There are no right answers, and they never lower a target.
      </p>
      {RecoveryQuestion.values.map((question) => (
        <div key={question} className="coach-question">
          <SectionLabel text={recoveryQuestionText(question)} />
          <MmSegmented<number>
            name={recoveryQuestionText(question)}
            compact
            allowEmpty
            segments={answers.map((value) => ({ value, label: `${value}` }))}
            selected={given[question]}
            onChange={(chosen) => {
              const next = { ...given };
              if (chosen === undefined) delete next[question];
              else next[question] = chosen;
              setGiven(next);
            }}
          />
          <div className="coach-question-ends">
            <span>{recoveryLowWord(question)}</span>
            <span>{recoveryHighWord(question)}</span>
          </div>
        </div>
      ))}
      <div className="app-gap" />
      <SectionLabel text="Typical hours of sleep (optional)" />
      <MmDurationField
        name="Typical hours of sleep"
        hours={sleepFields.hours}
        minutes={sleepFields.minutes}
        onChange={(hours, minutes) => setTypedSleep({ hours, minutes })}
      />
      {average === undefined ? null : (
        <p className="app-caption">{`Your average over the last ${SleepRule.windowNights} nights, from ${average.nights} recorded. Change it if that is not typical.`}</p>
      )}
      <div className="app-gap" />
      <MmButton label="Save" expand onPress={complete ? () => void save() : undefined} />
    </Screen>
  );
}
