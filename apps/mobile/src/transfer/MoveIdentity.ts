/**
 * What the two phones compare before any data is sent (MM-695): the app's version as the phone reports it, and the
 * database's schema version. Both must be the same on both phones.
 */
export interface MoveIdentity {
  readonly app: string;
  readonly schema: number;
}
