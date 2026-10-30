import { useEffect, useState } from 'react';
import { MmProgressBar } from '../ui/MmProgressBar';
import './settings.css';

interface MoveApplyingSheetProps {
  /** Puts what arrived in place of this phone's data, telling how far it has come; the sheet stays until it settles. */
  work: (progress: (done: number, total: number) => void) => Promise<void>;
  onSettled: (error?: unknown) => void;
}

/**
 * The wait while a move's records replace this phone's (MM-700), shown as a bar that fills as the rows are written
 * (MM-702), with the share in words beside it: with months of health samples it takes a while, and a spinner said
 * nothing of how long. The sheet cannot be closed while it works; it closes itself when the records are in place, or
 * when it failed. The status region says the start, not every percent.
 */
export function MoveApplyingSheet({ work, onSettled }: MoveApplyingSheetProps) {
  const [share, setShare] = useState(0);

  useEffect(() => {
    let live = true;
    work((done, total) => {
      if (live) setShare(total === 0 ? 0 : done / total);
    }).then(
      () => {
        if (live) onSettled();
      },
      (error: unknown) => {
        if (live) onSettled(error);
      },
    );
    return () => {
      live = false;
    };
    // One run for the sheet's life: the work is given once.
  }, []);

  return (
    <div className="settings-sheet">
      <h2 className="app-headline">Moving your records to this phone</h2>
      <p className="app-text">Keep the app open until it finishes. Months of records can take a minute.</p>
      <MmProgressBar value={share} />
      <div className="app-gap-small" />
      <p className="app-caption">{`${Math.floor(share * 100)}% in place`}</p>
      <span className="mm-visually-hidden" role="status">
        Putting your records in place.
      </span>
    </div>
  );
}
