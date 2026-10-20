import { base64OfBytes } from '../lang/base64OfBytes';
import { bytesOfBase64 } from '../lang/bytesOfBase64';
import type { MmBackupApi } from '../platform/MmBackupApi';
import type { BackupPlatform } from './BackupPlatform';
import type { SaveOutcome } from './SaveOutcome';

/** The phone's backup (MM-63): the `MmBackup` plugin for the copy, the share sheet and the picker. */
export class NativeBackupPlatform implements BackupPlatform {
  private readonly api: MmBackupApi;
  private readonly databaseName: string;

  constructor({ api, databaseName }: { api: MmBackupApi; databaseName: string }) {
    this.api = api;
    this.databaseName = databaseName;
  }

  async snapshot(): Promise<Uint8Array> {
    return bytesOfBase64((await this.api.snapshot({ name: this.databaseName })).data);
  }

  async save(file: Uint8Array, name: string): Promise<SaveOutcome> {
    return (await this.api.share({ name, data: base64OfBytes(file) })).outcome;
  }

  async pick(): Promise<Uint8Array | undefined> {
    const picked = await this.api.pick();
    return picked.cancelled || picked.data === undefined ? undefined : bytesOfBase64(picked.data);
  }
}
