import type { MenstruationReader } from './MenstruationReader';
import type { MenstruationWriter } from './MenstruationWriter';

/** Reads and writes the days marked with menstrual flow (MM-20). */
export interface MenstruationRepository extends MenstruationReader, MenstruationWriter {}
