import { useApp } from '../app/useApp';
import { currentValueOf } from '../lang/currentValueOf';
import { decodePhotoArchive } from '../domain/photos/decodePhotoArchive';
import { MoveCode } from '../transfer/MoveCode';
import type { MovePayload } from '../transfer/MovePayload';
import { useOverlays } from '../ui/useOverlays';
import { MoveApplyingSheet } from './MoveApplyingSheet';
import { MoveChoiceSheet } from './MoveChoiceSheet';
import { moveWords } from './moveWords';
import { ReceiveMoveSheet } from './ReceiveMoveSheet';
import { SendMoveSheet } from './SendMoveSheet';

type Received = { kind: 'backUpFirst' } | { kind: 'received'; payload: MovePayload };

/**
 * Moving to another phone (MM-698), from Settings > Backup or the first-run welcome. `choose` asks which way the move
 * goes; `receive` shows this phone's code, after offering a backup when it holds records none has (`backUp`, absent
 * on a fresh install), and replaces this phone's data only once the person confirms what arrived; `send` scans the
 * other phone's code and sends this phone's records and photos. The photos are behind the phone's lock, so sending
 * them, or replacing this phone's, asks for it first.
 */
export function useMoveToAnotherPhone({ backUp }: { backUp?: () => Promise<void> } = {}) {
  const { services } = useApp();
  const overlays = useOverlays();

  const unlocked = async (reason: string) => (await services.deviceLock.unlock(reason)) !== 'refused';
  const holdsPhotos = async () => (await services.progressPhotos.totalBytes()) > 0;

  /**
   * Records on this phone that no backup holds: logged on or after the last backup's day (the day is all that is kept
   * of it, so a record from that day may be newer), or never backed up. Once the person has just backed up, a backup
   * made today holds everything.
   */
  const unbacked = async (justBackedUp: boolean): Promise<'since' | 'never' | undefined> => {
    if (backUp === undefined) return undefined;
    const here = await services.restorer.describeHere();
    const holds = here.hasSetup || here.weighIns > 0 || here.foodDays > 0 || here.workouts > 0 || here.customFoods > 0;
    if (!holds) return undefined;
    // Read now, not when the screen was drawn: "Back up first" has just made one.
    const lastBackup = await currentValueOf(services.preferences.watchLastBackupOn());
    if (lastBackup === undefined) return 'never';
    if (justBackedUp && lastBackup.epochDay === services.clock.today().epochDay) return undefined;
    return here.to !== undefined && here.to.epochDay >= lastBackup.epochDay ? 'since' : undefined;
  };

  const apply = async (payload: MovePayload) => {
    const read = await (async () => {
      try {
        return { photos: decodePhotoArchive(payload.photos).length, records: await services.restorer.describe(payload.snapshot) };
      } catch {
        return undefined;
      }
    })();
    if (read === undefined) {
      overlays.snack('What arrived could not be read. Nothing on this phone was changed.');
      return;
    }
    const here = await services.restorer.describeHere();
    const photosHere = await holdsPhotos();
    const confirmed = await overlays.confirm({
      title: 'Replace this phone’s data?',
      message: moveWords(read.records, here, read.photos, photosHere),
      confirmLabel: 'Replace',
    });
    if (!confirmed) return;
    if (photosHere && !(await unlocked('Unlock to replace your progress photos.'))) {
      overlays.snack('Your progress photos stayed locked, so nothing was replaced.');
      return;
    }
    // The wait is shown, and it cannot be dismissed half-way (MM-700); what failed is said, and logged for the phone.
    let photosFailed = false;
    const failure = await overlays.sheet<{ error: unknown }>(
      'Moving your records',
      (close) => (
        <MoveApplyingSheet
          work={async () => {
            await services.restorer.restoreFrom(payload.snapshot);
            try {
              await services.progressPhotos.restoreArchive(payload.photos);
            } catch (error) {
              // The records are already moved; the photos are replaced in one step or not at all, so they are as they were.
              console.error('The moved photos could not be put in place.', error);
              photosFailed = true;
            }
          }}
          onSettled={(error) => close(error === undefined ? undefined : { error })}
        />
      ),
      { mayLeave: { current: async () => false } },
    );
    if (failure !== undefined) {
      console.error('The move could not replace this phone’s records.', failure.error);
      overlays.snack('Your records could not be moved. Nothing on this phone was changed.');
      return;
    }
    overlays.snack(
      photosFailed
        ? 'Your records were moved, but the progress photos could not be. This phone’s photos are as they were.'
        : 'Moved. This phone now holds what your other phone holds.',
    );
  };

  const receive = async () => {
    let justBackedUp = false;
    for (;;) {
      const nudge = await unbacked(justBackedUp);
      const answer = await overlays.sheet<Received>(
        'Move to this phone',
        (close) => (
          <ReceiveMoveSheet
            unbacked={nudge}
            onBackUpFirst={() => close({ kind: 'backUpFirst' })}
            onReceived={(payload) => close({ kind: 'received', payload })}
            onCancel={() => close()}
          />
        ),
        { size: 'tall' },
      );
      if (answer === undefined) return;
      if (answer.kind === 'received') {
        await apply(answer.payload);
        return;
      }
      await backUp?.();
      justBackedUp = true;
    }
  };

  const send = async () => {
    if ((await holdsPhotos()) && !(await unlocked('Unlock to send your progress photos.'))) {
      overlays.snack('Your progress photos stayed locked, so nothing was sent.');
      return;
    }
    for (;;) {
      let text: string | undefined;
      try {
        text = await services.codeScanner.scanCode();
      } catch {
        overlays.snack('The camera could not be opened. Allow Martian Macros to use it in the phone’s settings.');
        return;
      }
      if (text === undefined) return;
      // Not a move code: the sheet says so, with Scan again (the UX guard's F2).
      const code = MoveCode.parse(text);
      const again = await overlays.sheet<'again'>(
        'Sending to your other phone',
        (close) => <SendMoveSheet code={code} onScanAgain={() => close('again')} onClose={() => close()} />,
        { size: 'tall' },
      );
      if (again === undefined) return;
    }
  };

  const choose = async () => {
    const side = await overlays.sheet<'send' | 'receive'>('Move to another phone', (close) => (
      <MoveChoiceSheet onChoose={(chosen) => close(chosen)} onCancel={() => close()} />
    ));
    if (side === 'send') await send();
    if (side === 'receive') await receive();
  };

  return { choose, receive };
}
