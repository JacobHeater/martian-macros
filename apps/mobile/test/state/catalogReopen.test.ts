import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryPackHttp } from '../../src/foodCatalog/download/InMemoryPackHttp';
import { InMemoryPackStore } from '../../src/foodCatalog/download/InMemoryPackStore';
import type { PackListing } from '../../src/foodCatalog/download/PackListing';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';
import { AppState } from '../../src/state/AppState';
import { installedCatalog } from '../../src/state/installedCatalog';
import { fixtureDownload, packUrl } from '../support/fixtureDownload';
import { servicesOf } from '../support/servicesOf';

/**
 * MM-386: re-opening the catalog after an install or a removal closes the
 * packs of the catalog it replaces, and one superseded while still opening
 * is closed when it settles. The store counts the pack handles open; the
 * catalog is the one the phone uses (`installedCatalog`, as
 * `openAppServices` gives it).
 */
let open: number;
let store: InMemoryPackStore;
let listing: PackListing;
let state: AppState;
let stop: () => void = () => undefined;

beforeEach(async () => {
  open = 0;
  store = new InMemoryPackStore(async (bytes) => {
    const db = await WasmSqlDatabase.open({ bytes });
    open += 1;
    const close = db.close.bind(db);
    let closed = false;
    return Object.assign(db, {
      close: async () => {
        if (!closed) open -= 1;
        closed = true;
        await close();
      },
    });
  });
  const d = await fixtureDownload();
  listing = d.listing;
  state = new AppState({
    ...servicesOf(new InMemoryRepositories(), new FixedClock(CalendarDate.of(2026, 10, 21))),
    packStore: store,
    packHttp: new InMemoryPackHttp([[packUrl, d.gz]]),
    catalog: installedCatalog(store),
  });
  // Search watches the catalog while it is open, as the Add food sheet does.
  stop = state.foodCatalog.subscribe(() => undefined);
});

afterEach(() => stop());

const now = (): FoodCatalog | undefined => {
  const loaded = state.foodCatalog.peek();
  return loaded.ready ? loaded.value : undefined;
};

/** Resolves once the catalog given is a different one from `before`, with a pack in it. */
const replaced = (before: FoodCatalog | undefined) =>
  vi.waitFor(() => {
    const catalog = now();
    expect(catalog).toBeDefined();
    expect(catalog).not.toBe(before);
    expect(catalog?.installedPacks.length).toBe(1);
  });

it('MM-386: two packsChanged() calls leave only the newest catalog’s packs open', async () => {
  // The install itself asks for the catalog again.
  await state.packDownloads.start(listing);
  await replaced(undefined);
  const afterInstall = now();

  state.packsChanged();
  await replaced(afterInstall);
  const afterFirst = now();
  state.packsChanged();
  await replaced(afterFirst);

  // Before the fix every re-open left its packs open: three here.
  await vi.waitFor(() => expect(open).toBe(1));
  stop();
  await vi.waitFor(() => expect(open).toBe(0));
});

it('MM-386: a re-open superseded while still opening is closed when it settles', async () => {
  await state.packDownloads.start(listing);
  await replaced(undefined);
  const afterInstall = now();

  state.packsChanged();
  // The first re-open has begun (its microtask ran) and is still reading when the second change comes.
  await Promise.resolve();
  state.packsChanged();
  await replaced(afterInstall);

  await vi.waitFor(() => expect(open).toBe(1));
});
