import type { LeanGainPace } from '../domain/LeanGainPace';

const names: Readonly<Record<LeanGainPace, string>> = { standard: 'Standard', slower: 'Slower' };

/** A lean-gain pace by its name (MM-480). */
export const leanGainPaceName = (pace: LeanGainPace): string => names[pace];
