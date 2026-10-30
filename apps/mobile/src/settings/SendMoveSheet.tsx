import { useEffect, useState } from 'react';
import { useApp } from '../app/useApp';
import type { MoveCode } from '../transfer/MoveCode';
import type { MoveIdentity } from '../transfer/MoveIdentity';
import { MoveProblem } from '../transfer/MoveProblem';
import { MmBusyLine } from '../ui/MmBusyLine';
import { MmButton } from '../ui/MmButton';
import { MmProgressBar } from '../ui/MmProgressBar';
import { moveProblemWords } from './moveProblemWords';
import './settings.css';

type Stage =
  | { kind: 'connecting' }
  | { kind: 'sending'; done: number; total: number }
  | { kind: 'sent' }
  | { kind: 'failed'; problem: MoveProblem; here: MoveIdentity };

interface SendMoveSheetProps {
  /** The code scanned on the other phone. */
  code: MoveCode;
  onScanAgain: () => void;
  onClose: () => void;
}

/**
 * The sending phone's side of a move (MM-695), once the other phone's code is scanned: this phone's records and
 * progress photos, as a backup takes them, sent to it sealed under the code's key. This phone keeps everything; the
 * other phone asks before it replaces anything, so the move finishes there.
 */
export function SendMoveSheet({ code, onScanAgain, onClose }: SendMoveSheetProps) {
  const { services } = useApp();
  const [stage, setStage] = useState<Stage>({ kind: 'connecting' });

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const snapshot = await services.backup.snapshot();
        const photos = await services.progressPhotos.exportArchive();
        await services.moveSender.send(code, { snapshot, photos }, (done, total) => {
          if (live) setStage({ kind: 'sending', done, total });
        });
        if (live) setStage({ kind: 'sent' });
      } catch (error) {
        const here = await services.moveIdentity();
        if (live) setStage({ kind: 'failed', problem: error instanceof MoveProblem ? error : new MoveProblem('broken'), here });
      }
    })();
    return () => {
      live = false;
    };
  }, [code, services]);

  if (stage.kind === 'sent') {
    return (
      <div className="settings-sheet">
        <h2 className="app-headline">Sent</h2>
        <p className="app-text">Your other phone has everything. Confirm there to finish; this phone keeps its records.</p>
        <div className="app-gap" />
        <div className="app-row app-row-end">
          <MmButton label="Done" onPress={onClose} />
        </div>
      </div>
    );
  }

  if (stage.kind === 'failed') {
    return (
      <div className="settings-sheet">
        <h2 className="app-headline">The move did not happen</h2>
        <p className="app-text">{moveProblemWords(stage.problem, stage.here, 'send')}</p>
        <div className="app-gap" />
        <div className="app-row app-row-end">
          <MmButton label="Close" kind="text" onPress={onClose} />
          <MmButton label="Scan again" onPress={onScanAgain} />
        </div>
      </div>
    );
  }

  const share = stage.kind === 'sending' && stage.total > 0 ? stage.done / stage.total : 0;
  return (
    <div className="settings-sheet">
      <h2 className="app-headline">Sending to your other phone</h2>
      <p className="app-text">Keep both phones open and on the same Wi-Fi until it finishes.</p>
      {stage.kind === 'connecting' ? (
        <MmBusyLine label="Reaching your other phone…" />
      ) : (
        <>
          <MmProgressBar value={share} />
          <div className="app-gap-small" />
          <p className="app-caption" role="status">
            {`${Math.floor(share * 100)}% sent`}
          </p>
        </>
      )}
      <div className="app-gap" />
      <div className="app-row app-row-end">
        {/* Not a cancel: what is sent is only a copy, and the other phone asks before it replaces anything. */}
        <MmButton label="Close" kind="text" onPress={onClose} />
      </div>
    </div>
  );
}
