import type { HealthDataType } from './HealthDataType';
import type { HealthImportResult } from './HealthImportResult';
import type { HealthSampleStore } from './HealthSampleStore';
import type { HealthSource } from './HealthSource';

/**
 * Brings what is stored up to date with the platform (MM-67).
 *
 * It asks only for what changed since last time. A reading edited on the
 * platform replaces the stored one; one deleted there is removed here;
 * importing twice changes nothing. When the platform has forgotten the
 * token, everything is read again and the store made to match.
 *
 * When the source cannot be read it throws `HealthReadFailure`, and what
 * is stored is left exactly as it was.
 */
export class HealthImporter {
  readonly source: HealthSource;
  readonly store: HealthSampleStore;

  constructor(init: { source: HealthSource; store: HealthSampleStore }) {
    this.source = init.source;
    this.store = init.store;
  }

  async import(type: HealthDataType): Promise<HealthImportResult> {
    if (!(await this.source.permitted()).has(type)) {
      return { status: 'notPermitted', upserted: 0, deleted: 0 };
    }
    const changes = await this.source.changesSince(type, await this.store.token(type));
    if (changes.tokenExpired) {
      const all = await this.source.changesSince(type, undefined);
      await this.store.replace(type, all.upserted);
      await this.store.saveToken(type, all.nextToken);
      return { status: 'readAgain', upserted: all.upserted.length, deleted: 0 };
    }
    await this.store.upsert(changes.upserted);
    await this.store.delete(type, changes.deletedIds);
    // Last, so an import cut short is asked for again and applied again,
    // which changes nothing the second time.
    await this.store.saveToken(type, changes.nextToken);
    return { status: 'updated', upserted: changes.upserted.length, deleted: changes.deletedIds.length };
  }
}
