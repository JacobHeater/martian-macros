import { within } from '@testing-library/react';

/** The energy of each sector of the macro split drawn in `sheet`, in order; empty when none is drawn. */
export function sectors(sheet: HTMLElement): number[] {
  return [...sheet.querySelectorAll('.chart-sector')].map((sector) => Number(sector.getAttribute('data-energy')));
}

/** A macro as the split names it; carbs are "Net carbs" while carbs are shown net (MM-396). */
type SplitMacro = 'Protein' | 'Carbs' | 'Net carbs' | 'Fat';

/** What the macro split in `sheet` says of one macro: "100 g · 27.6%". */
export function macroLine(sheet: HTMLElement, macro: SplitMacro): string {
  const chart = sheet.querySelector<HTMLElement>('.chart-split');
  if (chart === null) throw new Error('No macro split is drawn.');
  return (within(chart).getByText(macro).closest('li')?.textContent ?? '').replace(macro, '').trim();
}

/** The grams the macro split in `sheet` gives for one macro. */
export function macroGrams(sheet: HTMLElement, macro: SplitMacro): number {
  return Number(macroLine(sheet, macro).split(' g')[0]);
}

/** Whether a macro split (drawn or explaining why not) is in `sheet`. */
export const hasPreview = (sheet: HTMLElement) => sheet.querySelector('.chart-split') !== null;
