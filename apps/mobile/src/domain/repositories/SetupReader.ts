import type { Watched } from '../../lang/Watched';
import type { UserSetup } from '../UserSetup';

/** Reads the user's setup. There is at most one. */
export interface SetupReader {
  /** The setup, then every change. Gives undefined before onboarding. */
  watchSetup(): Watched<UserSetup | undefined>;

  /** The setup now, or undefined before onboarding. */
  loadSetup(): Promise<UserSetup | undefined>;
}
