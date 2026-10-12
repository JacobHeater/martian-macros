import { useContext, useState } from 'react';
import { RecoveryCheckIn } from '../domain/RecoveryCheckIn';
import { RecoveryQuestion } from '../domain/RecoveryQuestion';
import { RecoveryRule } from '../engine/RecoveryRule';
import { parseNumber } from '../format/parseNumber';
import { recoveryHighWord } from '../format/recoveryHighWord';
import { recoveryLowWord } from '../format/recoveryLowWord';
import { recoveryQuestionText } from '../format/recoveryQuestionText';
import { CloseScreenContext } from '../app/CloseScreenContext';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { MmButton } from '../ui/MmButton';
import { MmSegmented } from '../ui/MmSegmented';
import { MmTextField } from '../ui/MmTextField';
import { SectionLabel } from '../ui/SectionLabel';

const answers = Array.from({ length: RecoveryRule.highest - RecoveryRule.lowest + 1 }, (_, i) => RecoveryRule.lowest + i);

/** The weekly recovery check-in (MM-116): five answers and, if given, hours of sleep. */
export function RecoveryCheckInScreen() {
  const { services, state } = useApp();
  const close = useContext(CloseScreenContext);
  const [given, setGiven] = useState<Partial<Record<RecoveryQuestion, number>>>({});
  const [sleepHours, setSleepHours] = useState('');

  const { hunger, energy, sleep, training, mood } = given;
  const complete =
    hunger !== undefined && energy !== undefined && sleep !== undefined && training !== undefined && mood !== undefined;

  const save = async () => {
    if (!complete) return;
    // Hours of sleep, when something sensible was typed.
    const hours = parseNumber(sleepHours);
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
      <MmTextField name="Typical hours of sleep" kind="number" suffix="hours" value={sleepHours} onChange={setSleepHours} />
      <div className="app-gap" />
      <MmButton label="Save" expand onPress={complete ? () => void save() : undefined} />
    </Screen>
  );
}
