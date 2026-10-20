import { useContext, useState } from 'react';
import { RecoveryCheckIn } from '../domain/RecoveryCheckIn';
import { RecoveryQuestion } from '../domain/RecoveryQuestion';
import { RecoveryRule } from '../engine/RecoveryRule';
import { durationFieldsOf } from '../format/durationFieldsOf';
import { parseDurationFields } from '../format/parseDurationFields';
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
  const sleepFields = typedSleep ?? durationFieldsOf(average?.averageMinutes);
  // Refused the same way as on Progress (MM-250): said under the field, and Save waits.
  const parsedSleep = parseDurationFields(sleepFields);

  const { hunger, energy, sleep, training, mood } = given;
  const complete =
    hunger !== undefined &&
    energy !== undefined &&
    sleep !== undefined &&
    training !== undefined &&
    mood !== undefined &&
    parsedSleep.error === undefined;

  const save = async () => {
    if (!complete) return;
    // Hours of sleep, when something was typed or filled in.
    const hours = parsedSleep.minutes === undefined ? undefined : parsedSleep.minutes / 60;
    await services.recovery.saveRecoveryCheckIn(
      new RecoveryCheckIn({
        date: state.today.peek(),
        hunger,
        energy,
        sleep,
        training,
        mood,
        sleepHours: hours,
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
        error={parsedSleep.error}
        onChange={(hours, minutes) => setTypedSleep({ hours, minutes })}
      />
      {average === undefined ? null : (
        <p className="app-caption">
          {typedSleep === undefined
            ? `Your average over the last ${SleepRule.windowNights} nights, from ${average.nights} recorded. Change it if that is not typical.`
            : 'Your own figure is kept in place of the average.'}
        </p>
      )}
      <div className="app-gap" />
      <MmButton label="Save" expand onPress={complete ? () => void save() : undefined} />
    </Screen>
  );
}
