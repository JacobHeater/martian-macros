import { useContext, useState } from 'react';
import { MissedPeriodAnswer } from '../domain/MissedPeriodAnswer';
import { RecoveryCheckIn } from '../domain/RecoveryCheckIn';
import { RecoveryQuestion } from '../domain/RecoveryQuestion';
import { RecoveryRule } from '../engine/RecoveryRule';
import { durationFieldsOf } from '../format/durationFieldsOf';
import { parseDurationFields } from '../format/parseDurationFields';
import { SleepRule } from '../engine/SleepRule';
import { missedPeriodAnswerLabel } from '../format/missedPeriodAnswerLabel';
import { missedPeriodNoticeText } from '../format/missedPeriodNoticeText';
import { missedPeriodQuestionText } from '../format/missedPeriodQuestionText';
import { recoveryHighWord } from '../format/recoveryHighWord';
import { recoveryLowWord } from '../format/recoveryLowWord';
import { recoveryQuestionText } from '../format/recoveryQuestionText';
import { CloseScreenContext } from '../app/CloseScreenContext';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { MmButton } from '../ui/MmButton';
import { MmChoiceChip } from '../ui/MmChoiceChip';
import { MmSegmented } from '../ui/MmSegmented';
import { MmDurationField } from '../ui/MmDurationField';
import { Notice } from '../ui/Notice';
import { SectionLabel } from '../ui/SectionLabel';

const answers = Array.from({ length: RecoveryRule.highest - RecoveryRule.lowest + 1 }, (_, i) => RecoveryRule.lowest + i);

/**
 * The weekly recovery check-in (MM-116): five answers and, if given, hours
 * of sleep. The hours are filled from the last fourteen nights recorded
 * (MM-252) and can be changed; with no night recorded they start empty.
 * When a previously regular cycle has gone 45 days without a period marked,
 * it asks once whether that is expected; "not sure" on a deficit goal brings
 * a notice. That answer is optional and not stored (MM-116).
 */
export function RecoveryCheckInScreen() {
  const { services, state } = useApp();
  const close = useContext(CloseScreenContext);
  const average = useCell(state.sleepAverage);
  const missed = useCell(state.missedPeriod);
  const [period, setPeriod] = useState<MissedPeriodAnswer>();
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
      {missed === undefined ? null : (
        <div className="coach-question">
          <SectionLabel text={missedPeriodQuestionText(missed)} />
          <div className="coach-period-answers" role="group" aria-label={missedPeriodQuestionText(missed)}>
            {MissedPeriodAnswer.values.map((answer) => (
              <MmChoiceChip
                key={answer}
                label={missedPeriodAnswerLabel(answer)}
                selected={period === answer}
                onSelect={() => setPeriod(period === answer ? undefined : answer)}
              />
            ))}
          </div>
          <p className="app-caption">Optional. Your answer is not kept.</p>
          {period === 'notSure' && missed.noticeIfNotSure ? <Notice kind="caution" text={missedPeriodNoticeText} /> : null}
        </div>
      )}
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
