import { useRef } from 'react';
import type { PackListing } from '../foodCatalog/download/PackListing';
import { megabytes } from '../format/megabytes';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { focusNeighbourOf } from '../ui/focusNeighbourOf';
import { InfoCard } from '../ui/InfoCard';
import { MmIconButton } from '../ui/MmIconButton';

/** What each published pack is for, in a line (the UX guard's F7); a pack the app does not know says nothing. */
const purposes: Readonly<Record<string, string>> = {
  generic: 'Foods by name, for search.',
  barcode_us: 'Packaged foods, for scanning a barcode.',
};

/**
 * A pack the host offers, not on the phone or newer than the one there
 * (MM-346), with its size and version and the one action that starts it:
 * the download icon in the card's title row, as the exercise card's and a
 * section header's actions sit (MM-384), named for what it does and to what
 * (MM-99's rule). Never starts by itself, and any number of packs can be
 * downloading at once. The host disclosure is said once above the cards.
 */
export function AvailablePackCard({ listing }: { listing: PackListing }) {
  const { state } = useApp();
  const installed = (useLoaded(state.installedPacks) ?? []).find((pack) => pack.id === listing.id);
  const running = useCell(state.packDownloads.stateOf(listing.id)).status === 'running';
  const verb = installed === undefined ? 'Download' : 'Update';
  const card = useRef<HTMLDivElement>(null);
  const start = () => {
    // The icon goes with the card once the download runs; focus moves to a neighbour first (MM-379).
    const button = card.current?.querySelector<HTMLElement>('button') ?? null;
    focusNeighbourOf(button);
    void state.packDownloads.start(listing);
  };
  const purpose = purposes[listing.id];
  return (
    <div ref={card}>
      <InfoCard title={listing.title} trailing={<MmIconButton icon="download" label={`${verb} ${listing.title}`} kind="action" onPress={running ? undefined : start} />}>
        {purpose === undefined ? null : <p className="app-text">{purpose}</p>}
        <p className="app-text">
          {megabytes(listing.downloadBytes)} to download · version {listing.version}
        </p>
      </InfoCard>
    </div>
  );
}
