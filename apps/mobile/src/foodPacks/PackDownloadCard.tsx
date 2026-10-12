import { megabytes } from '../format/megabytes';
import { packDownloadProblemText } from '../format/packDownloadProblemText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { InfoCard } from '../ui/InfoCard';
import { MmButton } from '../ui/MmButton';
import { MmProgressBar } from '../ui/MmProgressBar';
import { Notice } from '../ui/Notice';

const phaseTitle = { downloading: 'Downloading', checking: 'Checking the download', installing: 'Installing' } as const;

/**
 * The download as it is now: how far along, a Cancel button while it can
 * be stopped, and what to do after it stops. Shows nothing when there is
 * no download to talk about.
 */
export function PackDownloadCard() {
  const { state } = useApp();
  const controller = state.packDownload;
  const download = useCell(controller.state);
  const listing = download.listing;
  if (listing === undefined || download.status === 'idle') return null;
  const total = listing.downloadBytes;
  if (download.status === 'running') {
    const progress = download.progress;
    const phase = progress?.phase ?? 'downloading';
    return (
      <InfoCard title={phaseTitle[phase]}>
        <p className="app-text">{listing.title}</p>
        <MmProgressBar value={progress?.fraction ?? 0} />
        <p className="app-text app-muted">
          {megabytes(progress?.receivedBytes ?? 0)} of {megabytes(total)}
        </p>
        {phase === 'downloading' ? <MmButton label="Cancel" kind="secondary" onPress={() => controller.cancel()} /> : null}
      </InfoCard>
    );
  }
  if (download.status === 'paused') {
    return (
      <InfoCard title="Paused">
        <p className="app-text">{listing.title}</p>
        <p className="app-text app-muted">
          {megabytes(download.keptBytes)} of {megabytes(total)} is kept on your phone. Resume to get the rest, or
          discard it.
        </p>
        <div className="app-row">
          <MmButton label="Resume" onPress={() => void controller.start(listing)} />
          <MmButton label="Discard" kind="text" onPress={() => void controller.discard()} />
        </div>
      </InfoCard>
    );
  }
  if (download.status === 'failed') {
    return (
      <div className="app-stack-item">
        <Notice kind="caution" text={packDownloadProblemText(download.problem ?? 'connection')} />
        <div className="app-gap-small" />
        <MmButton label={download.keptBytes > 0 ? 'Resume' : 'Try again'} onPress={() => void controller.start(listing)} />
      </div>
    );
  }
  return (
    <div className="app-stack-item">
      <Notice text={`${listing.title} is on your phone.`} />
    </div>
  );
}
