import { HealthStep } from '../onboarding/HealthStep';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';

/**
 * The health check, revisited. Every change saves at once and issues new
 * targets, because a health change can rule a goal out (MM-83).
 */
export function HealthCheckScreen() {
  const { services, state } = useApp();
  const setup = useLoaded(state.setup);
  if (setup === undefined) return null;
  return (
    <Screen title="Health check" roomy>
      <HealthStep
        heading={false}
        screening={setup.screening}
        female={setup.profile.sex === 'female'}
        onChange={(answers) =>
          void services.setup.saveSetup(
            setup.copyWith({
              screening: answers,
              profileRevision: setup.profileRevision + 1,
              healthCheckConfirmedOn: state.today.peek(),
              healthCheckSkipCount: 0,
            }),
          )
        }
      />
    </Screen>
  );
}
