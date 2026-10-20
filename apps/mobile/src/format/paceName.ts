import type { FatLossPace } from '../engine/FatLossPace';

const names: Readonly<Record<FatLossPace, string>> = { gentle: 'Gentle', standard: 'Standard', faster: 'Faster' };

/** A fat-loss pace by its name (MM-128). */
export const paceName = (pace: FatLossPace): string => names[pace];
