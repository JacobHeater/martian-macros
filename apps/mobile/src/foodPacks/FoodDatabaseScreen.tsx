import { useRef } from 'react';
import type { InstalledPack } from '../foodCatalog/download/InstalledPack';
import { megabytes } from '../format/megabytes';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { focusNeighbourOf } from '../ui/focusNeighbourOf';
import { GroupHeader } from '../ui/GroupHeader';
import { MmButton } from '../ui/MmButton';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSpinner } from '../ui/MmSpinner';
import { Notice } from '../ui/Notice';
import { useOverlays } from '../ui/useOverlays';
import { AvailablePackCard } from './AvailablePackCard';
import { PackDownloadCard } from './PackDownloadCard';
import './foodPacks.css';

/**
 * What food data is on this phone, and the only place a download starts
 * (MM-56). Nothing is fetched until the user taps a button here. Any
 * number of packs can be downloading at once (MM-384).
 */
export function FoodDatabaseScreen() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const url = services.packManifestUrl;
  const manifest = useCell(state.packManifest.state);
  const installed = useLoaded(state.installedPacks) ?? [];
  const downloads = useCell(state.packDownloads.downloads);
  const installedList = useRef<HTMLDivElement>(null);
  const titles = new Map<string, string>((manifest.manifest?.packs ?? []).map((pack) => [pack.id, pack.title]));
  for (const download of downloads) if (download.listing !== undefined) titles.set(download.listing.id, download.listing.title);
  const downloadOf = (id: string) => downloads.find((d) => d.listing?.id === id);

  const remove = async (pack: InstalledPack, button: HTMLElement | null) => {
    const confirmed = await overlays.confirm({
      title: 'Remove this food database?',
      message:
        `It frees ${megabytes(pack.bytes)}. Foods you have already logged keep their numbers. You can download it ` +
        'again later.',
      confirmLabel: 'Remove',
    });
    if (!confirmed) return;
    // The row and its button go; focus moves to a neighbour first (MM-379).
    focusNeighbourOf(button);
    await services.packStore.remove(pack.id);
    // A finished, paused or failed download of the pack is forgotten with it (MM-385).
    state.packDownloads.forget(pack.id);
    state.packsChanged();
  };

  const available = () => {
    if (url === '') {
      return <Notice text="Food downloads are not set up in this version of the app, so nothing can be fetched." />;
    }
    if (manifest.checking) {
      return (
        <div className="app-row food-packs-checking">
          <MmSpinner />
          <span>Checking what is available…</span>
        </div>
      );
    }
    if (manifest.manifest !== undefined) {
      // A pack on the phone at the listed version is said once, above (MM-346); a pack being downloaded has its card.
      const offered = manifest.manifest.packs
        .filter((listing) => {
          const status = downloadOf(listing.id)?.status;
          return status === undefined || status === 'idle' || status === 'done';
        })
        .filter((listing) => installed.find((pack) => pack.id === listing.id)?.version !== listing.version);
      if (offered.length > 0) {
        // What every download will tell the host, said once above the cards, naming every host (MM-384, the UX guard's N1).
        const hosts = [...new Set(offered.map((listing) => listing.url.host))];
        return (
          <>
            <p className="app-text app-muted">
              Downloading contacts {hosts.join(' and ')}. That tells the host your IP address and which file you asked
              for, and nothing else about you. It can use a lot of mobile data, so Wi-Fi is better. You can cancel at any
              time.
            </p>
            {offered.map((listing) => (
              <AvailablePackCard key={listing.id} listing={listing} />
            ))}
          </>
        );
      }
      // A download that just finished says so itself, and a pack running, paused or failed has its card above (MM-384).
      if (downloads.some((d) => d.status === 'done')) return null;
      if (manifest.manifest.packs.length > 0 && manifest.manifest.packs.every((listing) => downloadOf(listing.id) !== undefined)) return null;
      return (
        <MmListGroup>
          <MmListRow
            leadingIcon={installed.length > 0 ? 'checkCircle' : 'info'}
            title="Nothing new to download"
            subtitle={installed.length > 0 ? 'Your food database is the newest version.' : 'No food database is offered yet.'}
          />
        </MmListGroup>
      );
    }
    if (downloads.some((d) => d.status === 'running')) return null;
    return (
      <>
        {manifest.message === undefined ? null : (
          <div className="app-stack-item">
            <Notice kind="caution" text={`${manifest.message} Nothing was changed.`} />
          </div>
        )}
        <MmButton
          label={manifest.message === undefined ? 'See what is available' : 'Try again'}
          kind="secondary"
          onPress={() => void state.packManifest.check()}
        />
        <p className="app-text app-muted">
          This contacts {new URL(url).host} once to read a small list. It reveals your IP address and nothing else.
        </p>
      </>
    );
  };

  return (
    <Screen title="Food database">
      <p className="app-text app-muted">
        Barcode scanning needs a database of foods. It is a separate download, and nothing is downloaded unless you
        choose to.
      </p>
      <GroupHeader text="On this phone" />
      <div ref={installedList}>
        <MmListGroup>
          {installed.length === 0 ? (
            <MmListRow title="Nothing downloaded yet" />
          ) : (
            installed.map((pack) => {
              const title = pack.title ?? titles.get(pack.id) ?? pack.id;
              return (
                <MmListRow
                  key={pack.id}
                  title={title}
                  subtitle={`Version ${pack.version} · ${megabytes(pack.bytes)}`}
                  trailingAction={
                    <MmButton
                      label="Remove"
                      name={`Remove ${title}`}
                      kind="text"
                      onPress={() => void remove(pack, installedList.current?.querySelector<HTMLElement>(`button[aria-label="Remove ${title}"]`) ?? null)}
                    />
                  }
                />
              );
            })
          )}
        </MmListGroup>
      </div>
      <GroupHeader text="Download" />
      {downloads.map((download) => (
        <PackDownloadCard key={download.listing?.id} download={download} />
      ))}
      {available()}
      <GroupHeader text="Where the foods come from" />
      <p className="app-text app-muted">
        Food data from Open Food Facts (openfoodfacts.org), available under the Open Database License, and USDA
        FoodData Central (its Foundation, SR Legacy, FNDDS survey and Branded foods, public domain). The files are
        published at github.com/JacobHeater/martian-macros-food-data.
      </p>
    </Screen>
  );
}
