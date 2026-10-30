import { useState } from 'react';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { BackupFile } from '../backup/BackupFile';
import { backupFileName } from '../backup/backupFileName';
import { SodiumBackupCipher } from '../backup/SodiumBackupCipher';
import { currentSchemaVersion } from '../data/currentSchemaVersion';
import { useOverlays } from '../ui/useOverlays';
import { PassphraseSheet } from './PassphraseSheet';
import { passphraseHeadline } from './passphraseHeadline';

const cipher = new SodiumBackupCipher();

/**
 * Backing up now (MM-63): the snapshot, and the photos when Back up photos is on (MM-157, behind the phone's
 * lock), encrypted under a passphrase the person sets, then saved or sent where they choose, and the day kept.
 * The Backup section's row runs it, and so does the offer to back up before a move replaces this phone (MM-698,
 * MM-716). `backingUp` is true while it works, so a row can say so and wait.
 */
export function useBackUp() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const photoSettings = useLoaded(state.photoSettings);
  const [backingUp, setBackingUp] = useState(false);

  const backUp = async (): Promise<void> => {
    if (photoSettings?.backUp === true && (await services.deviceLock.unlock('Unlock to back up your progress photos.')) === 'refused') {
      overlays.snack('Your progress photos stayed locked, so no backup was made.');
      return;
    }
    const typed = await overlays.sheet<string>(passphraseHeadline('set'), (close) => (
      <PassphraseSheet purpose="set" onContinue={(value) => close(value)} onCancel={() => close()} />
    ));
    if (typed === undefined) return;
    setBackingUp(true);
    try {
      const today = services.clock.today();
      const snapshot = await services.backup.snapshot();
      // The photos are kept apart from the database and join the backup only when the person has chosen that (MM-157).
      const photos = photoSettings?.backUp === true ? await services.progressPhotos.exportArchive() : undefined;
      const file = await BackupFile.write(snapshot, typed, { schemaVersion: currentSchemaVersion, createdOn: today.toString(), photos }, cipher);
      const outcome = await services.backup.save(file, backupFileName(today));
      if (outcome === 'cancelled') return;
      await services.preferences.saveLastBackupOn(today);
      overlays.snack(outcome === 'saved' ? 'Backup saved.' : 'Backup handed to the app you chose.');
    } catch {
      // Never the library's or the plugin's words (MM-334); nothing changed.
      overlays.snack('The backup could not be made. Nothing on this phone was changed.');
    } finally {
      setBackingUp(false);
    }
  };

  return { backUp, backingUp };
}
