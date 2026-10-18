import { useRef } from 'react';
import { megabytes } from '../format/megabytes';
import { packDownloadProblemText } from '../format/packDownloadProblemText';
import { useApp } from '../app/useApp';
import type { PackDownloadState } from '../state/PackDownloadState';
import { focusNeighbourOf } from '../ui/focusNeighbourOf';
import { InfoCard } from '../ui/InfoCard';
import { MmButton } from '../ui/MmButton';
import { MmProgressBar } from '../ui/MmProgressBar';
import { Notice } from '../ui/Notice';

const phaseWord = { downloading: 'Downloading', checking: 'Checking the download', installing: 'Installing' } as const;

/**
 * One pack's download as it is now (MM-384): headed by the pack's name, as
 * its offer card and its installed row are, with the phase and the bytes
 * on the first line; a Cancel button while it can be stopped, and what to
 * do after it stops. Resume and Try again are secondary, so two paused
 * downloads never show two filled buttons. A finished or failed pack is
 * announced once (the UX guard's F4). Shows nothing when there is no
 * download to talk about.
 */
export function PackDownloadCard({ download }: { download: PackDownloadState }) {
  const { state } = useApp();
  const controller = state.packDownloads;
  const card = useRef<HTMLDivElement>(null);
  const listing = download.listing;
  if (listing === undefined || download.status === 'idle') return null;
  const total = listing.downloadBytes;
  const cancel = () => {
    // The Cancel goes with the running card; focus moves to a neighbour first (MM-379).
    focusNeighbourOf(card.current?.querySelector<HTMLElement>('button') ?? null);
    controller.cancel(listing.id);
  };
  if (download.status === 'running') {
    const progress = download.progress;
    const phase = progress?.phase ?? 'downloading';
    return (
      <div ref={card}>
        <InfoCard title={listing.title}>
          <p className="app-text">
            {phaseWord[phase]} · {megabytes(progress?.receivedBytes ?? 0)} of {megabytes(total)}
          </p>
          <MmProgressBar value={progress?.fraction ?? 0} />
          {phase === 'downloading' ? <MmButton label="Cancel" name={`Cancel downloading ${listing.title}`} kind="secondary" onPress={cancel} /> : null}
        </InfoCard>
      </div>
    );
  }
  if (download.status === 'paused') {
    return (
      <InfoCard title={listing.title}>
        <p className="app-text">
          Paused · {megabytes(download.keptBytes)} of {megabytes(total)} is kept on your phone. Resume to get the rest, or discard it.
        </p>
        <div className="app-row">
          <MmButton label="Resume" name={`Resume ${listing.title}`} kind="secondary" onPress={() => void controller.start(listing)} />
          <MmButton label="Discard" name={`Discard ${listing.title}`} kind="text" onPress={() => void controller.discard(listing.id)} />
        </div>
      </InfoCard>
    );
  }
  if (download.status === 'failed') {
    return (
      <div className="app-stack-item" role="status">
        <Notice kind="caution" text={`${listing.title}: ${packDownloadProblemText(download.problem ?? 'connection')}`} />
        <div className="app-gap-small" />
        <MmButton
          label={download.keptBytes > 0 ? 'Resume' : 'Try again'}
          name={`${download.keptBytes > 0 ? 'Resume' : 'Try again'} ${listing.title}`}
          kind="secondary"
          onPress={() => void controller.start(listing)}
        />
      </div>
    );
  }
  return (
    <div className="app-stack-item" role="status">
      <Notice text={`${listing.title} is on your phone.`} />
    </div>
  );
}
