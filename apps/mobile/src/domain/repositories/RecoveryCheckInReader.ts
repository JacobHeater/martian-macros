import type { Watched } from '../../lang/Watched';
import type { RecoveryCheckIn } from '../RecoveryCheckIn';

/** Reads the weekly recovery check-ins (MM-116). */
export interface RecoveryCheckInReader {
  /** Every check-in, oldest first, then the full list after each change. */
  watchRecoveryCheckIns(): Watched<RecoveryCheckIn[]>;
}
