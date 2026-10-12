import { base64OfBytes } from '../../../lang/base64OfBytes';
import type { MmDbApi } from '../../../sql/native/MmDbApi';
import { NativeSqlDatabase } from '../../../sql/native/NativeSqlDatabase';
import type { SqlDatabase } from '../../../sql/SqlDatabase';
import type { InstalledPack } from '../InstalledPack';
import type { PackPartial } from '../PackPartial';
import type { PackStore } from '../PackStore';
import type { MmPacksApi } from './MmPacksApi';

/** `PackStore` over the native plugins: pack files on the phone's own storage (MM-56). */
export class NativePackStore implements PackStore {
  private readonly api: MmPacksApi;
  private readonly db: MmDbApi;

  constructor({ api, db }: { api: MmPacksApi; db: MmDbApi }) {
    this.api = api;
    this.db = db;
  }

  async installed(): Promise<InstalledPack[]> {
    const { packs } = await this.api.installed();
    return packs.map(({ id, version, bytes, title }) => ({ id, version, bytes, ...(title === undefined ? {} : { title }) }));
  }

  async open(pack: InstalledPack): Promise<SqlDatabase> {
    const { packs } = await this.api.installed();
    const found = packs.find((candidate) => candidate.id === pack.id);
    if (found === undefined) throw new Error(`No pack "${pack.id}" is installed.`);
    return NativeSqlDatabase.open({ path: found.path, readOnly: true }, this.db);
  }

  async partialBytes(id: string, version: string): Promise<number> {
    return (await this.api.partialBytes({ id, version })).bytes;
  }

  async writePartial(id: string, version: string, options: { append: boolean }): Promise<PackPartial> {
    const { writer } = await this.api.writePartial({ id, version, append: options.append });
    return {
      write: (chunk) => this.api.write({ writer, data: base64OfBytes(chunk) }),
      close: () => this.api.closeWriter({ writer }),
    };
  }

  async partialSha256(id: string, version: string): Promise<string> {
    return (await this.api.partialSha256({ id, version })).sha256;
  }

  discardPartial(id: string, version: string): Promise<void> {
    return this.api.discardPartial({ id, version });
  }

  async stage(id: string, version: string, options: { gzip: boolean }): Promise<SqlDatabase> {
    const { path } = await this.api.stage({ id, version, gzip: options.gzip });
    return NativeSqlDatabase.open({ path }, this.db);
  }

  discardStaged(id: string): Promise<void> {
    return this.api.discardStaged({ id });
  }

  commit(id: string, version: string, options: { title?: string | undefined }): Promise<void> {
    return this.api.commit({ id, version, ...(options.title === undefined ? {} : { title: options.title }) });
  }

  remove(id: string): Promise<void> {
    return this.api.remove({ id });
  }
}
