import type { SqlDatabase } from '../../sql/SqlDatabase';
import type { InstalledPack } from './InstalledPack';
import type { PackPartial } from './PackPartial';
import type { PackStore } from './PackStore';

const joined = (chunks: readonly Uint8Array[]): Uint8Array => {
  const whole = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let at = 0;
  for (const chunk of chunks) {
    whole.set(chunk, at);
    at += chunk.length;
  }
  return whole;
};

/** What `transform` makes of `bytes`. */
async function through(bytes: Uint8Array, transform: ReadableWritablePair<Uint8Array, BufferSource>): Promise<Uint8Array> {
  const source = new ReadableStream<BufferSource>({
    start(controller) {
      controller.enqueue(bytes as BufferSource);
      controller.close();
    },
  });
  const reader = source.pipeThrough(transform).getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const next = await reader.read();
    if (next.done) break;
    chunks.push(next.value);
  }
  return joined(chunks);
}

const unzipped = (bytes: Uint8Array) => through(bytes, new DecompressionStream('gzip'));

/**
 * A `PackStore` held in memory, for tests and demos: no files. `openBytes`
 * opens a database from the bytes of a pack file.
 */
export class InMemoryPackStore implements PackStore {
  private readonly openBytes: (bytes: Uint8Array) => Promise<SqlDatabase>;
  private readonly packs = new Map<string, { version: string; title: string | undefined; bytes: Uint8Array }>();
  private readonly partials = new Map<string, Uint8Array[]>();
  private readonly staged = new Map<string, Uint8Array>();

  constructor(openBytes: (bytes: Uint8Array) => Promise<SqlDatabase>) {
    this.openBytes = openBytes;
  }

  private static key(id: string, version: string): string {
    return `${id}.${version}`;
  }

  installed(): Promise<InstalledPack[]> {
    return Promise.resolve(
      [...this.packs].map(([id, pack]) => ({ id, version: pack.version, bytes: pack.bytes.length, title: pack.title })),
    );
  }

  open(pack: InstalledPack): Promise<SqlDatabase> {
    const held = this.packs.get(pack.id);
    if (held === undefined) return Promise.reject(new Error(`No pack "${pack.id}" is installed.`));
    return this.openBytes(held.bytes);
  }

  partialBytes(id: string, version: string): Promise<number> {
    const chunks = this.partials.get(InMemoryPackStore.key(id, version)) ?? [];
    return Promise.resolve(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  }

  writePartial(id: string, version: string, { append }: { append: boolean }): Promise<PackPartial> {
    const key = InMemoryPackStore.key(id, version);
    const chunks = append ? (this.partials.get(key) ?? []) : [];
    this.partials.set(key, chunks);
    return Promise.resolve({
      write: (chunk) => {
        // A copy: the sender may use its buffer again.
        chunks.push(chunk.slice());
        return Promise.resolve();
      },
      close: () => Promise.resolve(),
    });
  }

  async partialSha256(id: string, version: string): Promise<string> {
    const bytes = joined(this.partials.get(InMemoryPackStore.key(id, version)) ?? []);
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as BufferSource));
    return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  discardPartial(id: string, version: string): Promise<void> {
    this.partials.delete(InMemoryPackStore.key(id, version));
    return Promise.resolve();
  }

  async stage(id: string, version: string, { gzip }: { gzip: boolean }): Promise<SqlDatabase> {
    const downloaded = joined(this.partials.get(InMemoryPackStore.key(id, version)) ?? []);
    const bytes = gzip ? await unzipped(downloaded) : downloaded;
    this.staged.set(id, bytes);
    return this.openBytes(bytes);
  }

  discardStaged(id: string): Promise<void> {
    this.staged.delete(id);
    return Promise.resolve();
  }

  commit(id: string, version: string, { title }: { title?: string | undefined }): Promise<void> {
    const bytes = this.staged.get(id);
    if (bytes === undefined) return Promise.reject(new Error(`Nothing is staged for "${id}".`));
    this.packs.set(id, { version, title, bytes });
    this.staged.delete(id);
    return Promise.resolve();
  }

  remove(id: string): Promise<void> {
    this.packs.delete(id);
    this.staged.delete(id);
    for (const key of [...this.partials.keys()]) {
      if (key.startsWith(`${id}.`)) this.partials.delete(key);
    }
    return Promise.resolve();
  }
}
