import type { UserSetup } from '../UserSetup';

/** Saves the user's setup, replacing any existing one. */
export interface SetupWriter {
  saveSetup(setup: UserSetup): Promise<void>;
}
