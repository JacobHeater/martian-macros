/**
 * The part of every id the app writes to the health platform that is this
 * install's and this run of its data's own (MM-522). Entry ids start again
 * after "Erase all data" or a restore, so without it a new entry would be
 * written under the id of an older one and replace that record on the
 * platform. The namespace is kept by the platform's plugin, and renewed
 * whenever the app's data is erased or replaced, so nothing written after
 * can share an id with anything written before.
 */
export interface HealthWriteNamespace {
  /** The namespace now: never empty, and the same on every call until it is renewed. */
  writeNamespace(): Promise<string>;

  /** Replaces it with one never given before. */
  renewWriteNamespace(): Promise<void>;
}
