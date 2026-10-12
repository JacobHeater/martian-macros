import type { Palette } from './Palette';

/** Whether a palette's background is dark. Martian and Dark are; Light is not. */
export function isDarkPalette(palette: Palette): boolean {
  return palette !== 'light';
}
