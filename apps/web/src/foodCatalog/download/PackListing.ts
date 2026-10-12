/** A pack the manifest offers: what it is, how big, and how to check it. */
export interface PackListing {
  /** `barcode_us`, the same id the pack's header carries. */
  readonly id: string;

  /** What the user is told it is: "Barcode foods, United States". */
  readonly title: string;

  /**
   * A build date or version, shown to the user and used to say an update
   * exists.
   */
  readonly version: string;

  /** The pack format version; a pack newer than the app reads is refused. */
  readonly formatVersion: number;
  readonly url: URL;

  /** The size of the file as downloaded (compressed when `gzip`). */
  readonly downloadBytes: number;

  /** Lower-case hex SHA-256 of the downloaded file. */
  readonly sha256: string;

  /** The downloaded file is gzip-compressed and is unpacked after checking. */
  readonly gzip: boolean;
}
