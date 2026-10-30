import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app/useApp';
import type { MoveCode } from '../transfer/MoveCode';
import type { MoveIdentity } from '../transfer/MoveIdentity';
import type { MoveParcel } from '../transfer/MoveParcel';
import { MoveProblem } from '../transfer/MoveProblem';
import { MmBusyLine } from '../ui/MmBusyLine';
import { MmButton } from '../ui/MmButton';
import { MmProgressBar } from '../ui/MmProgressBar';
import { MmQrCode } from '../ui/MmQrCode';
import { moveProblemWords } from './moveProblemWords';
import { unbackedWords } from './unbackedWords';
import './settings.css';

/** How long a code works before it expires and the phone stops listening (MM-698). */
const moveCodeLifetimeMs = 5 * 60 * 1000;

type Stage =
  | { kind: 'nudge' }
  | { kind: 'opening' }
  | { kind: 'code'; code: MoveCode }
  | { kind: 'receiving'; done: number; total: number }
  | { kind: 'failed'; problem: MoveProblem; here: MoveIdentity };

interface ReceiveMoveSheetProps {
  /** Records on this phone that no backup holds: logged since the last one, or never backed up at all. */
  unbacked: 'since' | 'never' | undefined;
  onBackUpFirst: () => void;
  onReceived: (parcel: MoveParcel) => void;
  onCancel: () => void;
}

/** What the status region says for a stage, once, when it begins (the UX guard's F3, F4). */
function spoken(stage: Stage): string {
  switch (stage.kind) {
    case 'receiving':
      return 'Receiving from your other phone.';
    case 'failed':
      return `The move did not happen. ${moveProblemWords(stage.problem, stage.here, 'receive')}`;
    default:
      return '';
  }
}

/**
 * The receiving phone's side of a move (MM-698), of a copy of foods or water (MM-715, MM-718) or of a day synced (MM-719). When this phone holds records no
 * backup has, it says so first and offers a backup. Then it listens on the Wi-Fi and shows the code for the other phone to scan, with the app's icon
 * in it, until a move or a copy arrives, the sheet is closed, or five minutes pass. What arrives is handed on whole,
 * to be confirmed before it replaces or adds anything; nothing here changes this phone's data. One status region stays in place
 * across the stages, so a reader hears an expired code or a failure, and the headline takes focus when one comes.
 */
export function ReceiveMoveSheet({ unbacked, onBackUpFirst, onReceived, onCancel }: ReceiveMoveSheetProps) {
  const { services } = useApp();
  const [stage, setStage] = useState<Stage>(unbacked === undefined ? { kind: 'opening' } : { kind: 'nudge' });
  const [attempt, setAttempt] = useState(0);
  const headline = useRef<HTMLHeadingElement>(null);
  const listening = stage.kind !== 'nudge';

  useEffect(() => {
    if (!listening) return undefined;
    const receiver = services.moveReceiver;
    let live = true;
    const fail = async (error: unknown) => {
      const here = await services.moveIdentity();
      if (live) setStage({ kind: 'failed', problem: error instanceof MoveProblem ? error : new MoveProblem('broken'), here });
    };
    setStage({ kind: 'opening' });
    let expiry: ReturnType<typeof setTimeout> | undefined;
    void (async () => {
      try {
        const code = await receiver.open();
        if (!live) return;
        setStage({ kind: 'code', code });
        expiry = setTimeout(() => void receiver.stop(), moveCodeLifetimeMs);
        const parcel = await receiver.receive((done, total) => {
          if (live) setStage({ kind: 'receiving', done, total });
        });
        if (live) onReceived(parcel);
      } catch (error) {
        if (live) await fail(error);
      } finally {
        if (expiry !== undefined) clearTimeout(expiry);
      }
    })();
    return () => {
      live = false;
      if (expiry !== undefined) clearTimeout(expiry);
      void receiver.stop();
    };
    // The callbacks are the sheet's own and do not change while it is open; a new attempt listens again.
  }, [listening, attempt]);

  const failed = stage.kind === 'failed';
  useEffect(() => {
    if (failed) headline.current?.focus();
  }, [failed]);

  return (
    <div className="settings-sheet">
      {body()}
      <span className="mm-visually-hidden" role="status">
        {spoken(stage)}
      </span>
    </div>
  );

  function body() {
    if (stage.kind === 'nudge') {
      return (
        <>
          <h2 className="app-headline">Back up this phone first?</h2>
          {/* The nudge stage is only ever entered with a reason; 'never' here is for the type alone. */}
          <p className="app-text">{unbackedWords(unbacked ?? 'never')}</p>
          <div className="app-gap" />
          <div className="app-row app-row-end">
            <MmButton label="Skip the backup" kind="text" onPress={() => setStage({ kind: 'opening' })} />
            <MmButton label="Back up first" onPress={onBackUpFirst} />
          </div>
        </>
      );
    }

    if (stage.kind === 'failed') {
      // Updating comes before another try, so a version mismatch offers no retry that would fail the same way (F5).
      const retry = stage.problem.kind === 'versionMismatch' ? undefined : stage.problem.kind === 'noWifi' ? 'Try again' : 'Show a new code';
      return (
        <>
          <h2 className="app-headline" ref={headline} tabIndex={-1}>
            The move did not happen
          </h2>
          <p className="app-text">{moveProblemWords(stage.problem, stage.here, 'receive')}</p>
          <div className="app-gap" />
          <div className="app-row app-row-end">
            {retry === undefined ? (
              <MmButton label="Close" onPress={onCancel} />
            ) : (
              <>
                <MmButton label="Close" kind="text" onPress={onCancel} />
                <MmButton label={retry} onPress={() => setAttempt((was) => was + 1)} />
              </>
            )}
          </div>
        </>
      );
    }

    if (stage.kind === 'receiving') {
      const share = stage.total === 0 ? 0 : stage.done / stage.total;
      return (
        <>
          <h2 className="app-headline">Receiving from your other phone</h2>
          <p className="app-text">Keep both phones open and on the same Wi-Fi until it finishes.</p>
          <MmProgressBar value={share} />
          <div className="app-gap-small" />
          <p className="app-caption">{`${Math.floor(share * 100)}% received`}</p>
          <div className="app-gap" />
          <div className="app-row app-row-end">
            <MmButton label="Cancel" kind="text" onPress={onCancel} />
          </div>
        </>
      );
    }

    return (
      <>
        <h2 className="app-headline">Scan this from your other phone</h2>
        <p className="app-text">
          On the phone you are moving from, open Settings, then Backup, Move to another phone, and Send from this phone. To copy only some
          foods or water, choose Copy to another phone from its menu there; to make a whole day match, choose Sync this day to another
          phone under that day’s meals.
        </p>
        {stage.kind === 'code' ? (
          <>
            <MmQrCode text={stage.code.toText()} label="QR code for your other phone to scan" />
            <div className="app-gap-small" />
            <MmBusyLine label="Waiting for your other phone…" />
            <p className="app-caption">The code works once, for five minutes.</p>
          </>
        ) : (
          <MmBusyLine label="Getting a code ready…" />
        )}
        <div className="app-gap" />
        <div className="app-row app-row-end">
          <MmButton label="Cancel" kind="text" onPress={onCancel} />
        </div>
      </>
    );
  }
}
