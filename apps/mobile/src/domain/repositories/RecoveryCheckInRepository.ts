import type { RecoveryCheckInReader } from './RecoveryCheckInReader';
import type { RecoveryCheckInWriter } from './RecoveryCheckInWriter';

/** Reads and writes the weekly recovery check-ins (MM-116). */
export interface RecoveryCheckInRepository extends RecoveryCheckInReader, RecoveryCheckInWriter {}
