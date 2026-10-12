import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { MmButton } from './MmButton';
import { MmProgressBar } from './MmProgressBar';
import './ui.css';

interface DownloadStatusStripProps {
  label: string;
  /** 0 to 1. */
  fraction: number;
  /** Absent while the download is past the point where it can be stopped. */
  onCancel: (() => void) | undefined;
}

/**
 * A thin bar that says a download is happening, how far along it is, and
 * lets the user stop it, on every screen while it runs.
 */
export function DownloadStatusStrip({ label, fraction, onCancel }: DownloadStatusStripProps) {
  return (
    <div className="mm-download-strip">
      <div className="mm-download-strip-text">
        <span className="mm-visually-hidden" role="status">
          {label}, {roundHalfAwayFromZero(fraction * 100)} percent
        </span>
        <span className="mm-download-strip-label" aria-hidden="true">
          {label}
        </span>
        <MmProgressBar value={fraction} height={4} />
      </div>
      <MmButton label="Cancel" kind="text" onPress={onCancel} />
    </div>
  );
}
