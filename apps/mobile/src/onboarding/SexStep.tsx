import { useEffect, useRef } from 'react';
import { BiologicalSex } from '../domain/BiologicalSex';
import { ChoiceCard } from '../ui/ChoiceCard';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
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
 * selected, and the person still presses Next past it. The offer is a row
 * like the weight's (MM-68); what came of it is said and focused.
 */
export function SexStep({ sex, onSex, fromHealth }: SexStepProps) {
  const outcome = useRef<HTMLDivElement>(null);
  const asked = useRef(false);
  const state = fromHealth?.state;
  // Focus moves to what came of the read once it comes, not when the step is shown again later.
  useEffect(() => {
    if (state === 'asking') asked.current = true;
    else if (asked.current) {
      asked.current = false;
      outcome.current?.focus();
    }
  }, [state]);
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
          {fromHealth.state === 'filled' ? null : (
            // The row pattern of the weight's offer (WeightFromHealthRows, MM-68), named for what it does while it reads.
            <MmListGroup>
              <MmListRow
                leadingIcon="health"
                title={fromHealth.state === 'asking' ? 'Reading Apple Health…' : 'Fill in from Apple Health'}
                subtitle={
                  fromHealth.state === 'asking' ? undefined : 'Optional. Your sex, date of birth and height, each still yours to check.'
                }
                onPress={fromHealth.state === 'asking' ? undefined : fromHealth.onFill}
              />
            </MmListGroup>
          )}
          {/* Said when it comes, and focused, since the row pressed goes away (the panel's review, as MeasurementsStep's offer). */}
          <div aria-live="polite" tabIndex={-1} ref={outcome}>
            {fromHealth.state === 'nothing' || fromHealth.state === 'failed' ? <div className="app-gap" /> : null}
            {fromHealth.state === 'filled' ? (
              <Notice
                icon="check"
                text="Filled in from Apple Health where it had an answer. Check each one before you press Next."
              />
            ) : null}
            {fromHealth.state === 'nothing' ? (
              <Notice
                text={`Apple Health had nothing to fill in. Answer here, or, to allow it, open ${healthPath} and try again.`}
              />
            ) : null}
            {fromHealth.state === 'failed' ? (
              <Notice kind="caution" text="Apple Health could not be read just now. Answer here instead." />
            ) : null}
          </div>
        </>
      )}
    </>
  );
}
