import { useContext, useState } from 'react';
import { CoachingPolicy } from '../domain/CoachingPolicy';
import type { GoalMode } from '../domain/GoalMode';
import type { ScreeningAnswers } from '../domain/ScreeningAnswers';
import { HealthStep } from '../onboarding/HealthStep';
import { Loadable } from '../state/Loadable';
import { MmButton } from '../ui/MmButton';
import { CloseScreenContext } from './CloseScreenContext';
import { Screen } from './Screen';
import { useApp } from './useApp';
import { useCell } from './useCell';

interface HealthRecheckScreenProps {
  /** A goal the user is about to move to, checked against the answers before it is kept. */
  pendingGoal?: GoalMode | undefined;
  allowSkip?: boolean;
  /** Called when the screen is done with: true when the answers were confirmed. */
  onDone?: ((confirmed: boolean) => void) | undefined;
}

/** Asks whether anything has changed since the last health check (MM-112). */
export function HealthRecheckScreen({ pendingGoal, allowSkip = true, onDone }: HealthRecheckScreenProps) {
  const { services, state } = useApp();
  const setup = Loadable.valueOf(useCell(state.setup));
  const today = useCell(state.today);
  const [answers, setAnswers] = useState<ScreeningAnswers>();
  const close = useContext(CloseScreenContext);
  if (setup === undefined) return null;
  const screening = answers ?? setup.screening;
  const done = (confirmed: boolean) => {
    onDone?.(confirmed);
    if (onDone === undefined) close?.();
  };
  const revision = setup.profileRevision + (screening.equals(setup.screening) ? 0 : 1);
  const policy = CoachingPolicy.derive({ profile: setup.profile, screening, today });

  const confirm = async () => {
    const selectedGoal = pendingGoal ?? setup.goalMode;
    await services.setup.saveSetup(
      setup.copyWith({
        screening,
        profileRevision: revision,
        goalMode: policy.allowedModes.has(selectedGoal) ? selectedGoal : 'maintenance',
        healthCheckConfirmedOn: today,
        healthCheckSkipCount: 0,
      }),
    );
    done(true);
  };

  const skip = async () => {
    const skips = setup.healthCheckSkipCount + 1;
    const pausesDeficit =
      !policy.allowedModes.has(setup.goalMode) ||
      (skips >= 2 && (setup.goalMode === 'fatLoss' || setup.goalMode === 'recomp'));
    await services.setup.saveSetup(
      setup.copyWith({
        screening,
        profileRevision: revision,
        goalMode: pausesDeficit ? 'maintenance' : setup.goalMode,
        healthCheckSkipCount: skips,
      }),
    );
    state.healthRecheckDismissed.put(true);
    done(false);
  };

  return (
    <Screen title="Health check">
      <p className="app-text">
        Has anything changed since your last health check? Your answers help keep your coaching safe.
      </p>
      <HealthStep screening={screening} female={setup.profile.sex === 'female'} onChange={setAnswers} heading={false} />
      <div className="app-gap" />
      <MmButton label="Confirm answers" expand onPress={() => void confirm()} />
      {allowSkip ? (
        <MmButton
          label={setup.healthCheckSkipCount === 0 ? 'Not now' : 'Skip again and pause deficit coaching'}
          kind="text"
          expand
          onPress={() => void skip()}
        />
      ) : null}
    </Screen>
  );
}
