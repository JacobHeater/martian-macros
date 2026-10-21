import { BiologicalSex } from '../domain/BiologicalSex';
import { ChoiceCard } from '../ui/ChoiceCard';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';
import type { HealthFillState } from './HealthFillState';

interface SexStepProps {
  sex: BiologicalSex | undefined;
  onSex: (sex: BiologicalSex) => void;
  /** On an iPhone, the offer to fill in from Apple Health (MM-69); nothing elsewhere. */
  fromHealth?: { state: HealthFillState; onFill: () => void } | undefined;
}

const healthPath = 'Settings, Health, Data Access & Devices';

/**
 * Step 1: biological sex. No default is chosen for the user. On an iPhone
 * the step offers to fill in from Apple Health (MM-69): a sex it holds is
 * selected, and the person still presses Next past it.
 */
export function SexStep({ sex, onSex, fromHealth }: SexStepProps) {
  return (
    <>
      <h1 className="app-headline">Biological sex</h1>
      <p className="app-text app-muted">
        Energy needs, safe body-fat ranges, and safety limits differ between males and females.
      </p>
      <div className="app-gap" />
      <div className="app-row app-row-even">
        {BiologicalSex.values.map((option) => (
          <ChoiceCard
            key={option}
            label={option === 'male' ? 'Male' : 'Female'}
            selected={sex === option}
            onPress={() => onSex(option)}
          />
        ))}
      </div>
      {fromHealth === undefined ? null : (
        <>
          <div className="app-gap" />
          {fromHealth.state === 'filled' ? (
            <Notice
              icon="check"
              text="Filled in from Apple Health where it had an answer. Check each one before you press Next."
            />
          ) : (
            <MmButton
              label="Fill in from Apple Health"
              kind="secondary"
              expand
              onPress={fromHealth.state === 'asking' ? undefined : fromHealth.onFill}
            />
          )}
          {fromHealth.state === 'nothing' ? (
            <>
              <div className="app-gap" />
              <Notice
                text={`Apple Health had nothing to fill in. Answer here, or, to allow it, open ${healthPath} and try again.`}
              />
            </>
          ) : null}
          {fromHealth.state === 'failed' ? (
            <>
              <div className="app-gap" />
              <Notice kind="caution" text="Apple Health could not be read just now. Answer here instead." />
            </>
          ) : null}
        </>
      )}
    </>
  );
}
