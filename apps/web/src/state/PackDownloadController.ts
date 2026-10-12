import { PackDownload } from '../foodCatalog/download/PackDownload';
import { PackDownloadCancelled } from '../foodCatalog/download/PackDownloadCancelled';
import { PackDownloadFailed } from '../foodCatalog/download/PackDownloadFailed';
import { PackDownloadProgress } from '../foodCatalog/download/PackDownloadProgress';
import type { PackHttp } from '../foodCatalog/download/PackHttp';
import type { PackListing } from '../foodCatalog/download/PackListing';
import type { PackStore } from '../foodCatalog/download/PackStore';
import type { Cell } from './Cell';
import type { PackDownloadState } from './PackDownloadState';
import { ValueCell } from './ValueCell';

const idle: PackDownloadState = { status: 'idle', keptBytes: 0 };

/** Runs the one food-pack download, and only when asked: nothing here starts by itself. */
export class PackDownloadController {
  private readonly held = new ValueCell<PackDownloadState>(idle);
  private readonly http: PackHttp;
  private readonly store: PackStore;
  private readonly onInstalled: () => void;
  private download: PackDownload | undefined;

  constructor({ http, store, onInstalled }: { http: PackHttp; store: PackStore; onInstalled: () => void }) {
    this.http = http;
    this.store = store;
    this.onInstalled = onInstalled;
  }

  /** The download as it is now. */
  get state(): Cell<PackDownloadState> {
    return this.held;
  }

  /** Starts (or resumes) downloading `listing`. Settles when the download ends, however it ends. */
  async start(listing: PackListing): Promise<void> {
    if (this.held.peek().status === 'running') return;
    const kept = await this.store.partialBytes(listing.id, listing.version);
    if (this.held.peek().status === 'running') return;
    const download = PackDownload.start({ listing, http: this.http, store: this.store });
    this.download = download;
    this.held.put({
      status: 'running',
      listing,
      keptBytes: kept,
      progress: new PackDownloadProgress({
        phase: 'downloading',
        receivedBytes: kept,
        totalBytes: listing.downloadBytes,
      }),
    });
    download.onProgress((progress) => {
      if (this.download === download) this.held.put({ status: 'running', listing, progress, keptBytes: kept });
    });
    const keptNow = () => this.store.partialBytes(listing.id, listing.version);
    try {
      await download.done;
      this.held.put({ status: 'done', listing, keptBytes: 0 });
      this.onInstalled();
    } catch (error) {
      if (error instanceof PackDownloadCancelled) {
        this.held.put({ status: 'paused', listing, keptBytes: await keptNow() });
      } else if (error instanceof PackDownloadFailed) {
        this.held.put({ status: 'failed', listing, problem: error.problem, keptBytes: await keptNow() });
      } else {
        this.held.put({ status: 'failed', listing, problem: 'connection', keptBytes: 0 });
      }
    }
  }

  /** Stops now, keeping what arrived. */
  cancel(): void {
    this.download?.cancel();
  }

  /** Throws away an unfinished download. */
  async discard(): Promise<void> {
    const { listing, status } = this.held.peek();
    if (listing === undefined || status === 'running') return;
    await this.store.discardPartial(listing.id, listing.version);
    this.held.put(idle);
  }
}
