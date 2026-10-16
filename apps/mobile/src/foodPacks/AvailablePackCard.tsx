import type { PackListing } from '../foodCatalog/download/PackListing';
import { megabytes } from '../format/megabytes';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { InfoCard } from '../ui/InfoCard';
import { MmButton } from '../ui/MmButton';

/**
 * A pack the host offers, not on the phone or newer than the one there
 * (MM-346), with what the download will and will not do, and a button that
 * starts it. Never starts by itself.
 */
export function AvailablePackCard({ listing }: { listing: PackListing }) {
  const { state } = useApp();
  const installed = (useLoaded(state.installedPacks) ?? []).find((pack) => pack.id === listing.id);
  const running = useCell(state.packDownload.state).status === 'running';
  return (
    <InfoCard title={listing.title}>
      <p className="app-text">
        {megabytes(listing.downloadBytes)} to download · version {listing.version}
      </p>
      <p className="app-text app-muted">It is stored on this phone and used without a connection.</p>
      <p className="app-text app-muted">
        Downloading contacts {listing.url.host}. That tells the host your IP address and which file you asked for, and
        nothing else about you. It can use a lot of mobile data, so Wi-Fi is better. You can cancel at any time.
      </p>
      <MmButton
        label={installed === undefined ? 'Download' : 'Update'}
        onPress={running ? undefined : () => void state.packDownload.start(listing)}
      />
    </InfoCard>
  );
}
