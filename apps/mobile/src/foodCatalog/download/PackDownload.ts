import { SqliteFoodPack } from '../SqliteFoodPack';
import { PackDownloadCancelled } from './PackDownloadCancelled';
import { PackDownloadFailed } from './PackDownloadFailed';
import type { PackDownloadPhase } from './PackDownloadPhase';
import { PackDownloadProgress } from './PackDownloadProgress';
import type { PackFileFetch } from './PackFileFetch';
import type { PackFileTransfer } from './PackFileTransfer';
import type { PackListing } from './PackListing';
import type { PackStore } from './PackStore';
import { PackWriteFailed } from './PackWriteFailed';

const said = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * One download of one pack, from the first byte to the swap (MM-56).
 *
 * It writes to a partial file, resumes from it when there is one, checks
 * the SHA-256, unpacks, confirms the result opens as a pack this app reads,
 * and only then replaces the installed pack. Until that last step the
 * installed pack is untouched, so a download that fails or is cancelled
 * costs nothing.
 *
 * Nothing starts until `PackDownload.start` is called; the app only does so
 * when the user asks.
 */
export class PackDownload {
  readonly listing: PackListing;

  /**
   * Settles when the download ends: with nothing when the pack is
   * installed, with `PackDownloadFailed` if it could not be, or with
   * `PackDownloadCancelled` if `cancel` was called first.
   */
  readonly done: Promise<void>;

  private readonly fetcher: PackFileFetch;
  private readonly store: PackStore;
  private readonly listeners = new Set<(progress: PackDownloadProgress) => void>();
  private cancelled = false;
  private finished = false;
  private transfer: PackFileTransfer | undefined;

  private constructor(listing: PackListing, fetcher: PackFileFetch, store: PackStore) {
    this.listing = listing;
    this.fetcher = fetcher;
    this.store = store;
    this.done = this.run();
    // Whoever started it may not be listening yet; a failure is theirs to read from `done`.
    this.done.catch(() => undefined);
  }

  /** Begins downloading `listing` now: `fetch` brings the file into `store`'s partial, and `store` checks and installs it. */
  static start({ listing, fetch, store }: { listing: PackListing; fetch: PackFileFetch; store: PackStore }): PackDownload {
    return new PackDownload(listing, fetch, store);
  }

  /** Tells `listener` of progress as it happens, until the download ends. Gives the way to stop being told. */
  onProgress(listener: (progress: PackDownloadProgress) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Stops now. What has been downloaded is kept so a later start resumes. */
  cancel(): void {
    if (this.cancelled || this.finished) return;
    this.cancelled = true;
    this.transfer?.abort();
  }

  private emit(phase: PackDownloadPhase, receivedBytes: number): void {
    if (this.finished) return;
    const progress = new PackDownloadProgress({ phase, receivedBytes, totalBytes: this.listing.downloadBytes });
    for (const listener of [...this.listeners]) listener(progress);
  }

  private checkCancelled(): void {
    if (this.cancelled) throw new PackDownloadCancelled();
  }

  private async run(): Promise<void> {
    // Whoever started it gets to listen before the first progress is told.
    await Promise.resolve();
    try {
      await this.fetch();
      this.checkCancelled();
      await this.verify();
      this.checkCancelled();
      await this.install();
    } finally {
      this.finished = true;
      this.listeners.clear();
    }
  }

  private async fetch(): Promise<void> {
    const { id, version, downloadBytes: total, url } = this.listing;
    let have = await this.store.partialBytes(id, version);
    if (have > total) {
      await this.store.discardPartial(id, version);
      have = 0;
    }
    this.emit('downloading', have);
    if (have === total) return;

    let transfer: PackFileTransfer;
    try {
      transfer = await this.fetcher.fetchInto({ url, id, version, rangeStart: have > 0 ? have : undefined });
    } catch (error) {
      throw new PackDownloadFailed('connection', said(error));
    }
    this.transfer = transfer;
    if (this.cancelled) {
      transfer.abort();
      throw new PackDownloadCancelled();
    }
    const status = transfer.statusCode;
    if (status !== 200 && status !== 206) {
      transfer.abort();
      throw new PackDownloadFailed('serverError', `HTTP ${status}`);
    }
    // A server that ignores the range sends the whole file again.
    const kept = status === 206 && have > 0 ? have : 0;
    have = kept;

    // Only counts arrive here: on the phone the bytes go from the connection to the file natively (MM-387).
    const counts = transfer.written[Symbol.asyncIterator]();
    try {
      for (;;) {
        let next: IteratorResult<number>;
        try {
          next = await counts.next();
        } catch (error) {
          if (this.cancelled) throw new PackDownloadCancelled();
          if (error instanceof PackWriteFailed) throw new PackDownloadFailed('noSpace', said(error));
          throw new PackDownloadFailed('connection', said(error));
        }
        if (this.cancelled) throw new PackDownloadCancelled();
        if (next.done === true) break;
        have = kept + next.value;
        this.emit('downloading', have);
      }
    } finally {
      // Stopping early closes the file.
      await counts.return?.();
    }
    if (have < total) {
      throw new PackDownloadFailed('connection', `the connection ended at ${have} of ${total} bytes`);
    }
  }

  private async verify(): Promise<void> {
    const { id, version, downloadBytes, sha256 } = this.listing;
    this.emit('checking', downloadBytes);
    if ((await this.store.partialSha256(id, version)) !== sha256) {
      await this.store.discardPartial(id, version);
      throw new PackDownloadFailed('checksumMismatch');
    }
  }

  private async install(): Promise<void> {
    const { id, version, downloadBytes, gzip, title } = this.listing;
    this.emit('installing', downloadBytes);
    const discard = async () => {
      await this.store.discardStaged(id);
      await this.store.discardPartial(id, version);
    };
    let held: string;
    try {
      // Opening it is the check that it is a pack this app reads; it closes what is not.
      const pack = await SqliteFoodPack.open(await this.store.stage(id, version, { gzip }));
      held = pack.header.packId;
      await pack.close();
    } catch (error) {
      await discard();
      throw new PackDownloadFailed('unreadablePack', said(error));
    }
    if (held !== id) {
      await discard();
      throw new PackDownloadFailed('unreadablePack', `it holds "${held}", not "${id}"`);
    }
    try {
      await this.store.commit(id, version, { title });
    } catch (error) {
      throw new PackDownloadFailed('noSpace', said(error));
    }
    await this.store.discardPartial(id, version);
  }
}
