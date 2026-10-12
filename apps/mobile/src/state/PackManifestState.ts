import type { PackManifest } from '../foodCatalog/download/PackManifest';

/** The result of asking the host which packs exist. */
export interface PackManifestState {
  readonly checking: boolean;
  readonly manifest?: PackManifest | undefined;
  /** Why the host could not be read, in a sentence. */
  readonly message?: string | undefined;
}
