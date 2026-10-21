import { PackDownload } from '../foodCatalog/download/PackDownload';
import { PackDownloadCancelled } from '../foodCatalog/download/PackDownloadCancelled';
import { PackDownloadFailed } from '../foodCatalog/download/PackDownloadFailed';
import { PackDownloadProgress } from '../foodCatalog/download/PackDownloadProgress';
import type { PackFileFetch } from '../foodCatalog/download/PackFileFetch';
import type { PackListing } from '../foodCatalog/download/PackListing';
import type { PackStore } from '../foodCatalog/download/PackStore';
import type { Cell } from './Cell';
import { DerivedCell } from './DerivedCell';
import type { PackDownloadState } from './PackDownloadState';
import { ValueCell } from './ValueCell';

const idle: PackDownloadState = { status: 'idle', keptBytes: 0 };

/**
 * Runs the food-pack downloads, as many at once as there are packs offered
 * (MM-56, MM-384), and only when asked: nothing here starts by itself.
 * Each pack has its own cell, keyed by its id, so a card re-renders for its
 * own pack's bytes and not another's (the panel's F1); the list of every
 * download this session is derived from them, in the order started.
 */
export class PackDownloadsController {
  /** Every download this session, in the order started; nothing idle. */
  readonly downloads: Cell<readonly PackDownloadState[]>;

  private readonly cells = new Map<string, ValueCell<PackDownloadState>>();
  private readonly order = new ValueCell<readonly string[]>([]);
  private readonly running = new Map<string, PackDownload>();
  private readonly starting = new Set<string>();
  private readonly fetch: PackFileFetch;
  private readonly store: PackStore;
  private readonly onInstalled: () => void;

  constructor({ fetch, store, onInstalled }: { fetch: PackFileFetch; store: PackStore; onInstalled: () => void }) {
    this.fetch = fetch;
    this.store = store;
    this.onInstalled = onInstalled;
    this.downloads = new DerivedCell<readonly PackDownloadState[]>(() => this.order.value.map((id) => this.cellOf(id).value).filter((d) => d.status !== 'idle'));
  }

  /** The same as `downloads`, for callers that think of it as the state. */
  get state(): Cell<readonly PackDownloadState[]> {
    return this.downloads;
  }

  /** One pack's download as it is now, idle when it has none; the same cell for the same id. */
  stateOf(id: string): Cell<PackDownloadState> {
    return this.cellOf(id);
  }

  /** One pack's download as it is now, or undefined when it was never started. */
  of(id: string): PackDownloadState | undefined {
    const found = this.cells.get(id)?.peek();
    return found === undefined || found.status === 'idle' ? undefined : found;
  }

  /** Starts (or resumes) downloading `listing`; nothing while that pack is already starting or running. Settles when its download ends. */
  async start(listing: PackListing): Promise<void> {
    const id = listing.id;
    if (this.starting.has(id) || this.running.has(id)) return;
    this.starting.add(id);
    let kept: number;
    try {
      kept = await this.store.partialBytes(id, listing.version);
    } finally {
      this.starting.delete(id);
    }
    if (this.running.has(id)) return;
    const download = PackDownload.start({ listing, fetch: this.fetch, store: this.store });
    this.running.set(id, download);
    this.put({
      status: 'running',
      listing,
      keptBytes: kept,
      progress: new PackDownloadProgress({ phase: 'downloading', receivedBytes: kept, totalBytes: listing.downloadBytes }),
    });
    download.onProgress((progress) => {
      if (this.running.get(id) === download) this.put({ status: 'running', listing, progress, keptBytes: kept });
    });
    const keptNow = () => this.store.partialBytes(id, listing.version);
    try {
      await download.done;
      this.running.delete(id);
      this.put({ status: 'done', listing, keptBytes: 0 });
      this.onInstalled();
    } catch (error) {
      this.running.delete(id);
      if (error instanceof PackDownloadCancelled) {
        this.put({ status: 'paused', listing, keptBytes: await keptNow() });
      } else if (error instanceof PackDownloadFailed) {
        this.put({ status: 'failed', listing, problem: error.problem, keptBytes: await keptNow() });
      } else {
        this.put({ status: 'failed', listing, problem: 'connection', keptBytes: 0 });
      }
    }
  }

  /** Stops that pack's download now, keeping what arrived. */
  cancel(id: string): void {
    this.running.get(id)?.cancel();
  }

  /** Throws away that pack's unfinished download and forgets it; nothing while it runs. */
  async discard(id: string): Promise<void> {
    const found = this.of(id);
    if (found?.listing === undefined || found.status === 'running') return;
    await this.store.discardPartial(found.listing.id, found.listing.version);
    this.forget(id);
  }

  /** Forgets a pack's finished, paused or failed download, as when the pack is removed (MM-385); nothing while it runs. */
  forget(id: string): void {
    if (this.running.has(id)) return;
    this.cells.get(id)?.put(idle);
    this.order.put(this.order.peek().filter((held) => held !== id));
  }

  private cellOf(id: string): ValueCell<PackDownloadState> {
    let cell = this.cells.get(id);
    if (cell === undefined) {
      cell = new ValueCell<PackDownloadState>(idle);
      this.cells.set(id, cell);
    }
    return cell;
  }

  /** Replaces that pack's state, keeping the order the packs were first started in. */
  private put(next: PackDownloadState): void {
    const id = next.listing?.id ?? '';
    if (!this.order.peek().includes(id)) this.order.put([...this.order.peek(), id]);
    this.cellOf(id).put(next);
  }
}
