import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import record from './support/flutterTheme.json';

/**
 * MM-229: the Flutter theme was the reference, and `support/flutterTheme.json`
 * records it as it stood when the Flutter app was removed (MM-232). Every
 * color, radius, spacing step and type role here equals its value there; a
 * deliberate visual change updates the record knowingly, in its own ticket.
 */
const css = readFileSync(resolve(__dirname, '../src/theme/tokens.css'), 'utf8');

function cssBlock(selector: string): Map<string, string> {
  const start = css.indexOf(selector);
  expect(start, `tokens.css has no ${selector}`).toBeGreaterThanOrEqual(0);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  const found = new Map<string, string>();
  for (const match of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) found.set(match[1]!, match[2]!.trim());
  return found;
}

const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

describe('the colors', () => {
  for (const [palette, expected] of Object.entries(record.colors)) {
    it(`of ${palette} equal the recorded Flutter theme's`, () => {
      expect(Object.keys(expected).length).toBe(25);
      const tokens = cssBlock(`.theme-${palette}`);
      for (const [name, hex] of Object.entries(expected)) {
        expect(tokens.get(kebab(name)), `${palette} ${name}`).toBe(hex);
      }
    });
  }
});

describe('radii and spacing', () => {
  const root = cssBlock(':root {\n  /* Radii');

  it('equal MmRadius', () => {
    expect(root.get('radius-control')).toBe(`${record.radius.control}px`);
    expect(root.get('radius-chip')).toBe(`${record.radius.chip}px`);
    expect(root.get('radius-sheet-top')).toBe(`${record.radius.sheetTop}px`);
    // The group radius is 16, and 12 in Martian (as mm_theme.dart had it).
    expect(cssBlock('.theme-dark').get('radius-group')).toBe(`${record.radius.group}px`);
    expect(cssBlock('.theme-light').get('radius-group')).toBe(`${record.radius.group}px`);
    expect(cssBlock('.theme-martian').get('radius-group')).toBe(`${record.martianRadiusGroup}px`);
  });

  it('equal MmSpace', () => {
    const steps = Object.entries(record.space);
    expect(steps.length).toBe(6);
    for (const [name, value] of steps) expect(root.get(`space-${name.slice(1)}`)).toBe(`${value}px`);
  });
});

describe('the type roles', () => {
  it('equal MmType, with sizes in rem at 16px', () => {
    const root = cssBlock(':root {\n  /* Radii');
    for (const [role, [size, line, weight, family]] of Object.entries(record.type as unknown as Record<string, [number, number, number, string]>)) {
      expect(root.get(`type-${role}`), role).toBe(`${weight} ${size / 16}rem/${line / 16}rem var(--font-${family})`);
    }
  });
});
