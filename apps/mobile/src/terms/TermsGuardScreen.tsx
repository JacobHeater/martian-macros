import { useState } from 'react';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { TermsAcceptance } from '../domain/TermsAcceptance';
import { Fmt } from '../format/Fmt';
import { leaveApp } from '../platform/leaveApp';
import { MmButton } from '../ui/MmButton';
import { MmFooterActions } from '../ui/MmFooterActions';
import { Notice } from '../ui/Notice';
import { useOverlays } from '../ui/useOverlays';
import { termsOfUse } from './termsOfUse';
import { TermsText } from './TermsText';
import './terms.css';

interface TermsGuardScreenProps {
  /** What was agreed to before, when the terms have changed since; nothing on a first reading. */
  previous: TermsAcceptance | undefined;
}

/**
 * The terms of use, before anything else in the app (MM-242). Agreeing is
 * one plain press; nothing is ticked beforehand, timed, or held back until
 * the text has been scrolled. Not agreeing records nothing and takes
 * nothing away: a person with records on the phone can still erase them
 * from here.
 */
export function TermsGuardScreen({ previous }: TermsGuardScreenProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const hasRecords = useLoaded(state.setup) !== undefined;
  const [declined, setDeclined] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const changed = previous !== undefined;
  const changes = termsOfUse.changes.get(termsOfUse.version) ?? [];

  const agree = async () => {
    if (saving) return;
    setSaving(true);
    setError(undefined);
    try {
      await services.preferences.saveTermsAcceptance(
        new TermsAcceptance({ version: termsOfUse.version, acceptedOn: state.today.peek() }),
      );
    } catch {
      setError('Could not save your answer, so nothing was recorded. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const erase = async () => {
    const confirmed = await overlays.confirm({
      title: 'Erase everything?',
      message:
        'This permanently deletes your profile, health answers, food log, weigh-ins, workouts and targets from this ' +
        'phone. It cannot be undone.',
      confirmLabel: 'Erase',
    });
    if (confirmed) await services.eraser.eraseAll();
  };

  if (declined) {
    return (
      <Screen title="Terms of use" roomy>
        <h2 className="app-headline">That is fine</h2>
        <p className="app-text">
          The app needs your agreement to the terms before it can be used.{' '}
          {hasRecords
            ? 'Your records are still on this phone, and your answer here does not remove them.'
            : 'Nothing about you has been entered or saved.'}{' '}
          You can read the terms again whenever you like
          {services.platform === 'ios' ? ', or go back to the Home Screen; the app will ask again when you open it' : ''}.
        </p>
        <div className="app-gap" />
        <MmButton label="Read the terms again" expand onPress={() => setDeclined(false)} />
        {/* iOS has no call that puts an app away, and an app may not quit itself (MM-403). */}
        {services.platform === 'ios' ? null : (
          <>
            <div className="app-gap-small" />
            <MmButton label="Close the app" kind="secondary" expand onPress={leaveApp} />
          </>
        )}
        {hasRecords ? (
          <>
            <div className="app-gap-small" />
            <MmButton label="Erase all data" kind="text" expand onPress={() => void erase()} />
          </>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen
      title={changed ? 'The terms have changed' : 'Terms of use'}
      roomy
      footer={
        <MmFooterActions>
          {error === undefined ? null : (
            <div role="alert">
              <Notice kind="caution" text={error} />
            </div>
          )}
          <MmButton label={saving ? 'Saving…' : 'I agree'} expand onPress={saving ? undefined : () => void agree()} />
          <MmButton label="Not now" kind="secondary" expand onPress={saving ? undefined : () => setDeclined(true)} />
        </MmFooterActions>
      }
    >
      <p className="app-text">
        {changed
          ? 'This version of the app comes with new terms. Please read them and choose below. Your logs, weigh-ins ' +
            'and targets are on this phone, and your answer here does not remove them.'
          : 'Please read these terms and choose below. The two buttons, "I agree" and "Not now", are at the bottom ' +
            'of the screen.'}
      </p>
      <p className="terms-version">
        Version {termsOfUse.version}, in effect from {Fmt.longDate(termsOfUse.effectiveOn)}.
        {changed ? ` You agreed to version ${previous.version} on ${Fmt.longDate(previous.acceptedOn)}.` : ''}
      </p>
      {changed && changes.length > 0 ? (
        <>
          <h2 className="app-subhead">What changed</h2>
          <ul className="terms-summary">
            {changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </>
      ) : null}
      <TermsText platform={services.platform} />
    </Screen>
  );
}
