import { useState } from 'react';
import { useApp } from '../app/useApp';
import { CalendarDate } from '../domain/CalendarDate';
import { useLoaded } from '../app/useLoaded';
import { BackupFile } from '../backup/BackupFile';
import { backupFileName } from '../backup/backupFileName';
import { BackupProblem } from '../backup/BackupProblem';
import { restoreWords } from './restoreWords';
import { SodiumBackupCipher } from '../backup/SodiumBackupCipher';
import { currentSchemaVersion } from '../data/currentSchemaVersion';
import { Fmt } from '../format/Fmt';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { useOverlays } from '../ui/useOverlays';
import { PassphraseSheet } from './PassphraseSheet';
import { ProgressPhotoSwitches } from './ProgressPhotoSwitches';
import { passphraseHeadline } from './passphraseHeadline';
import { useMoveToAnotherPhone } from './useMoveToAnotherPhone';
import { useSettingsSection } from './useSettingsSection';

const cipher = new SodiumBackupCipher();

/**
 * Backup in Settings (MM-63): back up now to a file the person puts where
 * they choose, encrypted on the phone under a passphrase only they know;
 * when the last one was made; and restore from a file, which says what it
 * holds and what it replaces before it does. Free, so nobody loses data
 * for not paying (MM-85). Its own section, not rows of Data: "Backup" is
 * the folded header a tester scans for, and Data's rows are about what the
 * app stores and fetches, these about moving it (the panel's PD-2). The
 * restore row is not drawn as danger: it is the beta's recovery act and the
 * guard sits in the confirmation, where the counts make it specific (PD-6).
 */
export function BackupSection() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const fold = useSettingsSection('backup');
  const lastBackup = useLoaded(state.lastBackupOn);
  const photoSettings = useLoaded(state.photoSettings);
  const setup = useLoaded(state.setup);
  const [busy, setBusy] = useState<'backup' | 'restore' | undefined>();

  const passphrase = (purpose: 'set' | 'open', error?: string) =>
    overlays.sheet<string>(passphraseHeadline(purpose), (close) => (
      <PassphraseSheet purpose={purpose} error={error} onContinue={(typed) => close(typed)} onCancel={() => close()} />
    ));

  // The photos are behind the phone's lock wherever they are shown (MM-157), so a backup that carries them, or a
  // restore that replaces them, asks for it first; not passed, nothing is done. A phone with no lock set asks nothing.
  const photosUnlocked = async (reason: string) => (await services.deviceLock.unlock(reason)) !== 'refused';

  const backUp = async () => {
    if (photoSettings?.backUp === true && !(await photosUnlocked('Unlock to back up your progress photos.'))) {
      overlays.snack('Your progress photos stayed locked, so no backup was made.');
      return;
    }
    const typed = await passphrase('set');
    if (typed === undefined) return;
    setBusy('backup');
    try {
      const today = services.clock.today();
      const snapshot = await services.backup.snapshot();
      // The photos are kept apart from the database and join the backup only when the person has chosen that (MM-157).
      const photos = photoSettings?.backUp === true ? await services.progressPhotos.exportArchive() : undefined;
      const file = await BackupFile.write(
        snapshot,
        typed,
        { schemaVersion: currentSchemaVersion, createdOn: today.toString(), photos },
        cipher,
      );
      const outcome = await services.backup.save(file, backupFileName(today));
      if (outcome === 'cancelled') return;
      await services.preferences.saveLastBackupOn(today);
      overlays.snack(outcome === 'saved' ? 'Backup saved.' : 'Backup handed to the app you chose.');
    } catch (error) {
      // Never the library's or the plugin's words (MM-334); nothing changed.
      overlays.snack('The backup could not be made. Nothing on this phone was changed.');
    } finally {
      setBusy(undefined);
    }
  };

  // Moving to another phone on the same Wi-Fi (MM-697): its backup nudge runs this section's own backup.
  const move = useMoveToAnotherPhone({ backUp: () => backUp() });

  const restore = async () => {
    const picked = await services.backup.pick();
    if (picked === undefined) return;
    let header;
    try {
      header = BackupFile.header(picked);
    } catch (error) {
      overlays.snack(error instanceof BackupProblem ? error.message : 'This file could not be read.');
      return;
    }
    let error: string | undefined;
    for (;;) {
      const typed = await passphrase('open', error);
      if (typed === undefined) return;
      setBusy('restore');
      try {
        const { snapshot, photos } = await BackupFile.read(picked, typed, cipher);
        const contents = await services.restorer.describe(snapshot);
        const here = await services.restorer.describeHere();
        const confirmed = await overlays.confirm({
          title: 'Restore this backup?',
          message: restoreWords(contents, here, Fmt.longDate(CalendarDate.parse(header.createdOn)), photos !== undefined),
          confirmLabel: 'Restore',
        });
        if (!confirmed) return;
        if (photos !== undefined && !(await photosUnlocked('Unlock to replace your progress photos.'))) {
          overlays.snack('Your progress photos stayed locked, so nothing was restored.');
          return;
        }
        await services.restorer.restoreFrom(snapshot);
        // A backup with photos brings them back (MM-157); one without leaves this phone's photos as they are.
        if (photos !== undefined) {
          try {
            await services.progressPhotos.restoreArchive(photos);
          } catch {
            // The records are already back; the photos are replaced in one step or not at all, so they are as they were.
            overlays.snack('Your records were restored, but the backup’s photos could not be. This phone’s photos are as they were.');
            return;
          }
        }
        overlays.snack('Restored. Everything is as it was on that backup.');
        return;
      } catch (problem) {
        if (problem instanceof BackupProblem && problem.kind === 'wrongPassphrase') {
          error = problem.message;
          continue;
        }
        overlays.snack(problem instanceof BackupProblem ? problem.message : 'This backup could not be opened.');
        return;
      } finally {
        setBusy(undefined);
      }
    }
  };

  return (
    <MmSection icon="document" title="Backup" {...fold}>
      <MmListGroup>
        <MmListRow
          leadingIcon="lock"
          title="Back up now"
          subtitle={busy === 'backup' ? 'Backing up…' : 'Encrypted on this phone with a passphrase only you know, then saved or sent where you choose.'}
          // Stays a button while it works, so focus stays on it; a second press waits for the first (as the health section's read does).
          onPress={setup === undefined ? undefined : () => {
            if (busy === undefined) void backUp();
          }}
        />
        <MmListRow leadingIcon="calendarCheck" title="Last backup" subtitle={lastBackup === undefined ? 'Never' : Fmt.longDate(lastBackup)} />
        <MmListRow
          leadingIcon="history"
          title="Restore from a backup"
          subtitle={busy === 'restore' ? 'Opening the backup…' : 'Replaces everything on this phone with what the backup holds. You are asked first.'}
          onPress={() => {
            if (busy === undefined) void restore();
          }}
        />
        <MmListRow
          leadingIcon="movePhone"
          title="Move to another phone"
          subtitle="Send this phone’s records to another phone on the same Wi-Fi, or receive them here."
          onPress={() => {
            if (busy === undefined) void move.choose();
          }}
        />
        <ProgressPhotoSwitches backup />
      </MmListGroup>
      {/* What is being done, for a reader: the row's words change, and this region says so. */}
      <span className="mm-visually-hidden" role="status">
        {busy === 'backup' ? 'Backing up…' : busy === 'restore' ? 'Opening the backup…' : ''}
      </span>
      <p className="app-caption">
        Your records are not in your phone’s own cloud backup: a new phone starts empty unless you restore a backup file or move your records from your other phone.
        Downloaded food databases are not in the file, since they can be fetched again. Progress photos are in it only
        when Back up photos is on; restoring a file without them leaves this phone’s photos as they are.
      </p>
    </MmSection>
  );
}
