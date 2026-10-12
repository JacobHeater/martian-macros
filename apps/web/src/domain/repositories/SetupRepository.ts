import type { SetupReader } from './SetupReader';
import type { SetupWriter } from './SetupWriter';

/** Reads and writes the user's setup. */
export interface SetupRepository extends SetupReader, SetupWriter {}
