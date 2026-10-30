/** What a move carries (MM-695): the database's snapshot and the progress photos' archive, as a backup holds them. */
export interface MovePayload {
  readonly snapshot: Uint8Array;
  readonly photos: Uint8Array;
}
