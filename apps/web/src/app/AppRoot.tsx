import { CoachingPolicy } from '../domain/CoachingPolicy';
import { OnboardingScreen } from '../onboarding/OnboardingScreen';
import { Loadable } from '../state/Loadable';
import { MmButton } from '../ui/MmButton';
import { MmSpinner } from '../ui/MmSpinner';
import { Notice } from '../ui/Notice';
import { AdultsOnlyScreen } from './AdultsOnlyScreen';
import { HealthRecheckScreen } from './HealthRecheckScreen';
import { HomeShell } from './HomeShell';
import { ThemeChooserScreen } from './ThemeChooserScreen';
import { useApp } from './useApp';
import { useCell } from './useCell';
import { WelcomeBackScreen } from './WelcomeBackScreen';

const describe = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Routes to onboarding until setup exists, then to the main shell. */
export function AppRoot() {
  const { state } = useApp();
  const setup = useCell(state.setup);
  const theme = useCell(state.themePreference);
  const today = useCell(state.today);
  const resumeDue = useCell(state.resumeDue);
  const welcomeBackDue = useCell(state.welcomeBackDue);
  const recheckDismissed = useCell(state.healthRecheckDismissed);

  if (!setup.ready) {
    return Loadable.hasFailed(setup) ? (
      <div className="app-centered app-centered-page">
        <p className="app-text">Could not open your data.</p>
        <p className="app-text">{describe(setup.error)}</p>
      </div>
    ) : (
      <div className="app-centered app-centered-page app-centered-middle">
        <MmSpinner />
      </div>
    );
  }
  if (!theme.ready) {
    return Loadable.hasFailed(theme) ? (
      <div className="app-centered app-centered-page">
        <Notice kind="caution" text="Could not load your theme preference." />
        <div className="app-gap" />
        <MmButton label="Try again" onPress={() => state.themePreference.retry()} />
      </div>
    ) : (
      <div className="app-centered app-centered-page app-centered-middle">
        <MmSpinner />
      </div>
    );
  }
  const value = setup.value;
  if (value === undefined && theme.value === 'unselected') return <ThemeChooserScreen />;
  if (value === undefined) return <OnboardingScreen />;
  const blocked = CoachingPolicy.derive({ profile: value.profile, screening: value.screening, today }).blocked;
  if (blocked) return <AdultsOnlyScreen />;
  if (resumeDue) return <WelcomeBackScreen resuming />;
  if (welcomeBackDue) return <WelcomeBackScreen />;
  if (value.healthCheckDueOn(today) && !recheckDismissed) {
    return <HealthRecheckScreen allowSkip={value.healthCheckSkipCount < 2} onDone={() => undefined} />;
  }
  return <HomeShell />;
}
