import type { BackupStorage } from '../domain/integration/BackupStorage';
import type { Denied } from '../domain/integration/Denied';
import { NotFound } from '../domain/integration/NotFound';
import type { Outcome } from '../domain/integration/Outcome';
import { Succeeded } from '../domain/integration/Succeeded';
import type { Unavailable } from '../domain/integration/Unavailable';
import { compareStrings } from '../lang/compareStrings';

/**
 * A `BackupStorage` that keeps blobs in memory. Script it to fail with
 * `failWith` to test offline and denied paths.
 */
export class InMemoryBackupStorage implements BackupStorage {
  private readonly blobs = new Map<string, Uint8Array>();
  private failure: Unavailable | Denied | undefined;

  failWith(failure: Unavailable | Denied): void {
    this.failure = failure;
  }

  recover(): void {
    this.failure = undefined;
  }

  async list(): Promise<Outcome<string[]>> {
    if (this.failure !== undefined) return this.failure;
    return new Succeeded([...this.blobs.keys()].sort(compareStrings));
  }

  async get(name: string): Promise<Outcome<Uint8Array>> {
    if (this.failure !== undefined) return this.failure;
    const blob = this.blobs.get(name);
    return blob === undefined ? new NotFound() : new Succeeded(Uint8Array.from(blob));
  }

  async put(name: string, bytes: Uint8Array): Promise<Outcome<void>> {
    if (this.failure !== undefined) return this.failure;
    this.blobs.set(name, Uint8Array.from(bytes));
    return new Succeeded(undefined);
  }

  async delete(name: string): Promise<Outcome<void>> {
    if (this.failure !== undefined) return this.failure;
    this.blobs.delete(name);
    return new Succeeded(undefined);
  }
}
