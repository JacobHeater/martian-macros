import { describe, expect, it } from 'vitest';
import { paletteFor } from './paletteFor';

describe('the palette a theme choice means', () => {
  it('is the choice itself for Martian, Light and Dark', () => {
    expect(paletteFor('martian', false)).toBe('martian');
    expect(paletteFor('light', true)).toBe('light');
    expect(paletteFor('dark', false)).toBe('dark');
  });

  it('follows the phone for System', () => {
    expect(paletteFor('system', true)).toBe('dark');
    expect(paletteFor('system', false)).toBe('light');
  });
});
