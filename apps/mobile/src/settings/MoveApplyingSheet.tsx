import { useEffect } from 'react';
import { MmBusyLine } from '../ui/MmBusyLine';
import './settings.css';

interface MoveApplyingSheetProps {
  /** Puts what arrived in place of this phone's data; the sheet stays until it settles. */
  work: () => Promise<void>;
  onSettled: (error?: unknown) => void;
}

/**
 * The wait while a move's records replace this phone's (MM-700): with months of health samples it takes a while,
 * and before, the confirmation closed onto the welcome with nothing said, so it looked as if nothing had come. The
 * sheet cannot be closed while it works; it closes itself when the records are in place, or when it failed.
 */
export function MoveApplyingSheet({ work, onSettled }: MoveApplyingSheetProps) {
  useEffect(() => {
    let live = true;
    work().then(
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
      <MmBusyLine label="Putting your records in place…" />
    </div>
  );
}
