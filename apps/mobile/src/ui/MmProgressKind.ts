import type { MacroKind } from './MacroKind';

/**
 * What a bar measures, which sets its colour: energy, one macro (MM-278), or
 * a micronutrient against its reference, one quiet neutral for all, never a
 * macro's or a state's colour (MM-310).
 */
export type MmProgressKind = 'energy' | MacroKind | 'nutrient';
