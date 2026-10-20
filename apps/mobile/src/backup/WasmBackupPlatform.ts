import type { WasmSqlDatabase } from '../sql/wasm/WasmSqlDatabase';
import type { BackupPlatform } from './BackupPlatform';
import type { SaveOutcome } from './SaveOutcome';

/**
 * A browser's backup (MM-63): the in-memory database exported as bytes, a
 * download for saving and a file input for picking. The development build
 * only; the phone has `NativeBackupPlatform`.
 */
export class WasmBackupPlatform implements BackupPlatform {
  private readonly live: WasmSqlDatabase;

  constructor(live: WasmSqlDatabase) {
    this.live = live;
  }

  snapshot(): Promise<Uint8Array> {
    return this.live.exportBytes();
  }

  async save(file: Uint8Array, name: string): Promise<SaveOutcome> {
    const url = URL.createObjectURL(new Blob([file as BlobPart], { type: 'application/octet-stream' }));
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = name;
      anchor.click();
      return 'saved';
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  pick(): Promise<Uint8Array | undefined> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = async () => {
        const chosen = input.files?.[0];
        resolve(chosen === undefined ? undefined : new Uint8Array(await chosen.arrayBuffer()));
      };
      input.oncancel = () => resolve(undefined);
      input.click();
    });
  }
}
