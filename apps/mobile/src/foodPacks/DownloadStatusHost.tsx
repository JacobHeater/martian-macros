import type { ReactNode } from 'react';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { DownloadStatusStrip } from '../ui/DownloadStatusStrip';
import './foodPacks.css';

/**
 * Shows a strip along the bottom of every screen for as long as a food
 * download is running, with a Cancel button, so a download is never
 * hidden.
 */
export function DownloadStatusHost({ children }: { children: ReactNode }) {
  const { state } = useApp();
  const download = useCell(state.packDownload.state);
  const running = download.status === 'running';
  const phase = download.progress?.phase;
  const title = download.listing?.title ?? 'food database';
  let label = `Downloading ${title}`;
  if (phase === 'checking') label = `Checking ${title}`;
  else if (phase === 'installing') label = `Installing ${title}`;
  // The same elements in the same places whether or not the strip shows,
  // so the screens underneath are never drawn again from scratch.
  return (
    <div className="food-packs-host">
      <div className="food-packs-host-screens">{children}</div>
      {running ? (
        <DownloadStatusStrip
          label={label}
          fraction={download.progress?.fraction ?? 0}
          onCancel={phase === undefined || phase === 'downloading' ? () => state.packDownload.cancel() : undefined}
        />
      ) : null}
    </div>
  );
}
