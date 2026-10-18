import { MmButton } from './MmButton';
import { MmProgressBar } from './MmProgressBar';
import './ui.css';

interface DownloadStatusStripProps {
  label: string;
  /** 0 to 1. */
  fraction: number;
  /** Absent while the download is past the point where it can be stopped. */
  onCancel: (() => void) | undefined;
  /** What a screen reader hears for Cancel when several strips show ("Cancel downloading Common foods"); the button still reads "Cancel". */
  cancelName?: string | undefined;
}

/** The step the spoken progress moves in: every ten percent, not every percent (MM-384, the UX guard's F1). */
const spokenProgressStepPercent = 10;

/**
 * A thin bar that says a download is happening, how far along it is, and
 * lets the user stop it, on every screen while it runs. One per running
 * download (MM-384). What a screen reader hears moves in ten-percent steps
 * and on each phase, so a long download is not read out a hundred times.
 */
export function DownloadStatusStrip({ label, fraction, onCancel, cancelName }: DownloadStatusStripProps) {
  const spoken = Math.floor((fraction * 100) / spokenProgressStepPercent) * spokenProgressStepPercent;
  return (
    <div className="mm-download-strip">
      <div className="mm-download-strip-text">
        <span className="mm-visually-hidden" role="status">
          {label}, {spoken} percent
        </span>
        <span className="mm-download-strip-label" aria-hidden="true">
          {label}
        </span>
        <MmProgressBar value={fraction} weight="thin" />
      </div>
      <MmButton label="Cancel" name={cancelName} kind="text" onPress={onCancel} />
    </div>
  );
}
