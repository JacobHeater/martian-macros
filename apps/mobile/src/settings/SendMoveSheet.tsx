import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app/useApp';
import type { MoveCode } from '../transfer/MoveCode';
import type { MoveIdentity } from '../transfer/MoveIdentity';
import type { MoveParcel } from '../transfer/MoveParcel';
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
  /** The code scanned on the other phone; undefined when what was scanned is not a move code. */
  code: MoveCode | undefined;
  /** What to send, gathered once the code is in hand. */
  parcel: () => Promise<MoveParcel>;
  /** Whose words the sheet speaks: a move of everything (MM-698) or a copy of foods (MM-715). */
  what: 'everything' | 'foods';
  onScanAgain: () => void;
  onClose: () => void;
}

/** What did not happen, in the sheet's headline and what is said. */
const didNotHappen = (what: SendMoveSheetProps['what']) => (what === 'foods' ? 'The copy did not happen' : 'The move did not happen');

/** What the status region says for a stage, once, when it begins (the UX guard's F3, F4). */
function spoken(stage: Stage, what: SendMoveSheetProps['what']): string {
  switch (stage.kind) {
    case 'sending':
      return 'Sending to your other phone.';
    case 'sent':
      return 'Sent. Confirm on your other phone to finish.';
    case 'failed':
      return `${didNotHappen(what)}. ${moveProblemWords(stage.problem, stage.here, 'send')}`;
    default:
      return '';
  }
}

/**
 * The sending phone's side of a move (MM-698), or of a copy of foods (MM-715), once the other phone's code is
 * scanned: the parcel, this phone's records and progress photos as a backup takes them or the foods chosen, sent
 * to it sealed under the code's key. This phone keeps everything; the other phone asks before it replaces or adds
 * anything, so the move finishes there. Something scanned that is not a move code
 * is a failure here too, with Scan again (the UX guard's F2). One status region stays in place across the stages,
 * and the headline takes focus when the outcome comes.
 */
export function SendMoveSheet({ code, parcel, what, onScanAgain, onClose }: SendMoveSheetProps) {
  const { services } = useApp();
  const [stage, setStage] = useState<Stage>({ kind: 'connecting' });
  const headline = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let live = true;
    const fail = async (error: unknown) => {
      const here = await services.moveIdentity();
      if (live) setStage({ kind: 'failed', problem: error instanceof MoveProblem ? error : new MoveProblem('broken'), here });
    };
    void (async () => {
      if (code === undefined) return fail(new MoveProblem('notACode'));
      try {
        await services.moveSender.send(code, await parcel(), (done, total) => {
          if (live) setStage({ kind: 'sending', done, total });
        });
        if (live) setStage({ kind: 'sent' });
      } catch (error) {
        await fail(error);
      }
    })();
    return () => {
      live = false;
    };
  }, [code, parcel, services]);

  const ended = stage.kind === 'sent' || stage.kind === 'failed';
  useEffect(() => {
    if (ended) headline.current?.focus();
  }, [ended]);

  return (
    <div className="settings-sheet">
      {body()}
      <span className="mm-visually-hidden" role="status">
        {spoken(stage, what)}
      </span>
    </div>
  );

  function body() {
    if (stage.kind === 'sent') {
      return (
        <>
          <h2 className="app-headline" ref={headline} tabIndex={-1}>
            Sent
          </h2>
          <p className="app-text">
            {what === 'foods'
              ? 'Your other phone has the foods. Confirm there to add them; this phone keeps its own.'
              : 'Your other phone has everything. Confirm there to finish; this phone keeps its records.'}
          </p>
          <div className="app-gap" />
          <div className="app-row app-row-end">
            <MmButton label="Done" onPress={onClose} />
          </div>
        </>
      );
    }

    if (stage.kind === 'failed') {
      // Updating comes before another try, so a version mismatch offers no scan that would fail the same way (F5).
      const mismatch = stage.problem.kind === 'versionMismatch';
      return (
        <>
          <h2 className="app-headline" ref={headline} tabIndex={-1}>
            {didNotHappen(what)}
          </h2>
          <p className="app-text">{moveProblemWords(stage.problem, stage.here, 'send')}</p>
          <div className="app-gap" />
          <div className="app-row app-row-end">
            {mismatch ? (
              <MmButton label="Close" onPress={onClose} />
            ) : (
              <>
                <MmButton label="Close" kind="text" onPress={onClose} />
                <MmButton label="Scan again" onPress={onScanAgain} />
              </>
            )}
          </div>
        </>
      );
    }

    const share = stage.kind === 'sending' && stage.total > 0 ? stage.done / stage.total : 0;
    return (
      <>
        <h2 className="app-headline">Sending to your other phone</h2>
        <p className="app-text">Keep both phones open and on the same Wi-Fi until it finishes.</p>
        {stage.kind === 'connecting' ? (
          <MmBusyLine label="Reaching your other phone…" />
        ) : (
          <>
            <MmProgressBar value={share} />
            <div className="app-gap-small" />
            <p className="app-caption">{`${Math.floor(share * 100)}% sent`}</p>
          </>
        )}
        <div className="app-gap" />
        <div className="app-row app-row-end">
          {/* Not a cancel: what is sent is only a copy, and the other phone asks before it replaces or adds anything. */}
          <MmButton label="Close" kind="text" onPress={onClose} />
        </div>
      </>
    );
  }
}
