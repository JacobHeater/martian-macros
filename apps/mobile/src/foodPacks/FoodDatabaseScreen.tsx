import type { InstalledPack } from '../foodCatalog/download/InstalledPack';
import { megabytes } from '../format/megabytes';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
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
 * (MM-56). Nothing is fetched until the user taps a button here.
 */
export function FoodDatabaseScreen() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const url = services.packManifestUrl;
  const manifest = useCell(state.packManifest.state);
  const installed = useLoaded(state.installedPacks) ?? [];
  const download = useCell(state.packDownload.state);
  const titles = new Map<string, string>((manifest.manifest?.packs ?? []).map((pack) => [pack.id, pack.title]));
  if (download.listing !== undefined) titles.set(download.listing.id, download.listing.title);

  const remove = async (pack: InstalledPack) => {
    const confirmed = await overlays.confirm({
      title: 'Remove this food database?',
      message:
        `It frees ${megabytes(pack.bytes)}. Foods you have already logged keep their numbers. You can download it ` +
        'again later.',
      confirmLabel: 'Remove',
    });
    if (!confirmed) return;
    await services.packStore.remove(pack.id);
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
      return manifest.manifest.packs
        .filter(
          (listing) => download.listing?.id !== listing.id || download.status === 'idle' || download.status === 'done',
        )
        .map((listing) => <AvailablePackCard key={listing.id} listing={listing} />);
    }
    if (download.status === 'running') return null;
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
      <MmListGroup>
        {installed.length === 0 ? (
          <MmListRow title="Nothing downloaded yet" />
        ) : (
          installed.map((pack) => (
            <MmListRow
              key={pack.id}
              title={pack.title ?? titles.get(pack.id) ?? pack.id}
              subtitle={`Version ${pack.version} · ${megabytes(pack.bytes)}`}
              trailingAction={<MmButton label="Remove" kind="text" onPress={() => void remove(pack)} />}
            />
          ))
        )}
      </MmListGroup>
      <GroupHeader text="Download" />
      <PackDownloadCard />
      {available()}
      <GroupHeader text="Where the foods come from" />
      <p className="app-text app-muted">
        Food data from Open Food Facts (openfoodfacts.org), available under the Open Database License, and USDA
        FoodData Central. The files are published at github.com/JacobHeater/martian-macros-food-data.
      </p>
    </Screen>
  );
}
