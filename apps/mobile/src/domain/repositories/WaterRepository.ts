import type { WaterReader } from './WaterReader';
import type { WaterWriter } from './WaterWriter';

/** Reads and writes the water log. */
export interface WaterRepository extends WaterReader, WaterWriter {}
