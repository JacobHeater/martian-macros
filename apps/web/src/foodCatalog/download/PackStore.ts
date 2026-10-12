import type { SqlDatabase } from '../../sql/SqlDatabase';
import type { InstalledPack } from './InstalledPack';
import type { PackPartial } from './PackPartial';

/**
 * Where downloaded packs live, kept apart from the user's own data: a pack
 * is read-only, replaceable, and never part of a backup. What the storage
 * is (files on the phone) is the platform's to say; this is everything the
 * app asks of it.
 */
export interface PackStore {
  /** The packs installed. */
  installed(): Promise<InstalledPack[]>;

  /** Opens an installed pack to be read. */
  open(pack: InstalledPack): Promise<SqlDatabase>;

  /** Bytes already downloaded of an unfinished `version`, or 0. */
  partialBytes(id: string, version: string): Promise<number>;

  /** Opens the unfinished download of `version` to write: carrying on at its end, or from nothing. */
  writePartial(id: string, version: string, options: { append: boolean }): Promise<PackPartial>;

  /** The lower-case hex SHA-256 of what has been downloaded of `version`. */
  partialSha256(id: string, version: string): Promise<string>;

  /** Deletes an unfinished download without touching the installed pack. */
  discardPartial(id: string, version: string): Promise<void>;

  /**
   * Unpacks what was downloaded of `version` beside the installed pack,
   * and opens the result to be checked. It fails when the download cannot
   * be unpacked or opened.
   */
  stage(id: string, version: string, options: { gzip: boolean }): Promise<SqlDatabase>;

  /** Deletes what `stage` made. */
  discardStaged(id: string): Promise<void>;

  /**
   * Puts the checked, unpacked pack in place of any earlier one. The
   * earlier pack is kept until the new one is in place, so a failure here
   * leaves it working.
   */
  commit(id: string, version: string, options: { title?: string | undefined }): Promise<void>;

  /** Removes the pack `id` and anything left from downloading it. */
  remove(id: string): Promise<void>;
}
