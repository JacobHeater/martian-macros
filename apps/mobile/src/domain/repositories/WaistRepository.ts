import type { WaistReader } from './WaistReader';
import type { WaistWriter } from './WaistWriter';

/** Reads and writes waist measurements. */
export interface WaistRepository extends WaistReader, WaistWriter {}
