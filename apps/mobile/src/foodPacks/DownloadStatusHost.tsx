import type { ReactNode } from 'react';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { DownloadStatusStrip } from '../ui/DownloadStatusStrip';
import './foodPacks.css';

/**
 * Shows a strip along the bottom of every screen for as long as a food
 * download is running, one line per download with its own Cancel button
 * (MM-384), so a download is never hidden. The lines share one container
 * that carries the safe-area inset once.
 */
export function DownloadStatusHost({ children }: { children: ReactNode }) {
  const { state } = useApp();
  const running = useCell(state.packDownloads.downloads).filter((d) => d.status === 'running');
  // The same elements in the same places whether or not the strip shows,
  // so the screens underneath are never drawn again from scratch.
  return (
    <div className="food-packs-host">
      <div className="food-packs-host-screens">{children}</div>
      {running.length === 0 ? null : (
        <div className="mm-download-strips">
          {running.map((download) => {
            const phase = download.progress?.phase;
            const title = download.listing?.title ?? 'food database';
            const id = download.listing?.id ?? '';
            let label = `Downloading ${title}`;
            if (phase === 'checking') label = `Checking ${title}`;
            else if (phase === 'installing') label = `Installing ${title}`;
            return (
              <DownloadStatusStrip
                key={id}
                label={label}
                cancelName={`Cancel downloading ${title}`}
                fraction={download.progress?.fraction ?? 0}
                onCancel={phase === undefined || phase === 'downloading' ? () => state.packDownloads.cancel(id) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
