import { useState } from 'react';
import { MmButton } from '../ui/MmButton';
import { MmTextField } from '../ui/MmTextField';
import { passphraseHeadline } from './passphraseHeadline';
import { shortestPassphrase } from './shortestPassphrase';
import './settings.css';

interface PassphraseSheetProps {
  /** Setting one for a new backup, typed twice; or opening a backup, typed once. */
  purpose: 'set' | 'open';
  /** Why the last attempt did not open the backup, shown under the field. */
  error?: string | undefined;
  onContinue: (passphrase: string) => void;
  onCancel: () => void;
}

/**
 * The passphrase for a backup (MM-63). It is never stored: a lost passphrase
 * means the backup cannot be opened, said before the person chooses one.
 * Typed twice when set, so a slip does not seal a backup nobody can open;
 * the mismatch is said once the second is long enough to be wrong, not on
 * its first letter.
 */
export function PassphraseSheet({ purpose, error, onContinue, onCancel }: PassphraseSheetProps) {
  const [passphrase, setPassphrase] = useState('');
  const [again, setAgain] = useState('');
  // Hidden as typed, shown on request (the UX guard's F3): one switch for the sheet.
  const [shown, setShown] = useState(false);
  const longEnough = passphrase.length >= shortestPassphrase;
  const matches = purpose === 'open' || passphrase === again;
  const ready = longEnough && matches;
  const diverged = again !== '' && !passphrase.startsWith(again);
  const againError = diverged || (again.length >= passphrase.length && !matches) ? 'The two do not match.' : undefined;
  const submit = ready ? () => onContinue(passphrase) : undefined;
  return (
    <div className="settings-sheet">
      <h2 className="app-headline">{passphraseHeadline(purpose)}</h2>
      {purpose === 'set' ? (
        <p className="app-text">
          Only you know it; the app never keeps it. If you lose it, nobody can open this backup, including us. Keep it
          somewhere safe.
        </p>
      ) : null}
      <MmTextField
        label="Passphrase"
        kind="passphrase"
        secret={purpose === 'set' ? 'new' : 'existing'}
        revealed={shown}
        value={passphrase}
        onChange={setPassphrase}
        helper={purpose === 'set' && error === undefined ? `At least ${shortestPassphrase} characters. A few words you will remember are easiest.` : undefined}
        error={error}
        onSubmit={submit}
      />
      {purpose === 'set' ? (
        <>
          <div className="app-gap-small" />
          <MmTextField label="Passphrase again" kind="passphrase" revealed={shown} value={again} onChange={setAgain} error={againError} onSubmit={submit} />
        </>
      ) : null}
      <div className="app-gap-small" />
      <div className="app-row">
        <MmButton label={shown ? 'Hide passphrase' : 'Show passphrase'} kind="text" onPress={() => setShown((was) => !was)} />
      </div>
      <div className="app-gap" />
      <div className="app-row app-row-end">
        <MmButton label="Cancel" kind="text" onPress={onCancel} />
        <MmButton label={purpose === 'set' ? 'Back up' : 'Open'} onPress={submit} />
      </div>
    </div>
  );
}
