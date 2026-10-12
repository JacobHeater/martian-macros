/** A pack that is installed on this device. */
export interface InstalledPack {
  readonly id: string;
  readonly version: string;
  /** How much room it takes on the phone. */
  readonly bytes: number;
  /** What the user was told it is when they downloaded it. */
  readonly title?: string | undefined;
}
