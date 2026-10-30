import type { MoveOpener } from './MoveOpener';
import type { MoveSealer } from './MoveSealer';

/**
 * The sealing of a move (MM-698): a fresh key for each code shown, and a stream sealed under it in each direction.
 * Behind an interface so the library stays in one adapter (MM-162).
 */
export interface MoveCipher {
  /** A new random 32-byte key. */
  newKey(): Promise<Uint8Array>;
  sealer(key: Uint8Array): Promise<MoveSealer>;
  /** Fails when `header` is not one a sealer gave. */
  opener(key: Uint8Array, header: Uint8Array): Promise<MoveOpener>;
}
