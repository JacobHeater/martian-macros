import { CoachingPolicy } from '../domain/CoachingPolicy';
import { OnboardingScreen } from '../onboarding/OnboardingScreen';
import { Loadable } from '../state/Loadable';
import { TermsGuardScreen } from '../terms/TermsGuardScreen';
import { termsOfUse } from '../terms/termsOfUse';
import { MmSpinner } from '../ui/MmSpinner';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';
import { AdultsOnlyScreen } from './AdultsOnlyScreen';
import { HealthRecheckScreen } from './HealthRecheckScreen';
import { HomeShell } from './HomeShell';
import { ThemeChooserScreen } from './ThemeChooserScreen';
import { useApp } from './useApp';
import { useCell } from './useCell';
import { WelcomeBackScreen } from './WelcomeBackScreen';

/** Asks for the terms first, then routes to onboarding until setup exists, then to the main shell. */
export function AppRoot() {
  const { state } = useApp();
  const setup = useCell(state.setup);
  const theme = useCell(state.themePreference);
  const terms = useCell(state.termsAcceptance);
  const today = useCell(state.today);
  const resumeDue = useCell(state.resumeDue);
  const welcomeBackDue = useCell(state.welcomeBackDue);
  const recheckDismissed = useCell(state.healthRecheckDismissed);

  if (!setup.ready) {
    return Loadable.hasFailed(setup) ? (
      <div className="app-centered app-centered-page">
        <ReadFailedNotice
          title="Could not open your data"
          otherwise="If this keeps happening, close the app and open it again."
          onRetry={() => state.setup.retry()}
        />
      </div>
    ) : (
      <div className="app-centered app-centered-page app-centered-middle" data-testid="waiting-setup">
        <MmSpinner />
      </div>
    );
  }
  if (!theme.ready) {
    return Loadable.hasFailed(theme) ? (
      <div className="app-centered app-centered-page">
        <ReadFailedNotice title="Could not load your theme preference" onRetry={() => state.themePreference.retry()} />
      </div>
    ) : (
      <div className="app-centered app-centered-page app-centered-middle" data-testid="waiting-theme">
        <MmSpinner />
      </div>
    );
  }
  // The terms come before everything, on every installation (MM-242). An
  // agreement that cannot be read is not an agreement: the app is not entered.
  if (!terms.ready) {
    return Loadable.hasFailed(terms) ? (
      <div className="app-centered app-centered-page">
        <ReadFailedNotice
          title="Could not check whether you have agreed to the terms of use"
          onRetry={() => state.termsAcceptance.retry()}
        />
      </div>
    ) : (
      <div className="app-centered app-centered-page app-centered-middle" data-testid="waiting-terms">
        <MmSpinner />
      </div>
    );
  }
  if (terms.value?.version !== termsOfUse.version) return <TermsGuardScreen previous={terms.value} />;
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
