import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * MM-229: until the Flutter app is removed, its theme is the reference. Every
 * color, radius, spacing step and type role here equals its value there.
 */
const flutterTheme = resolve(__dirname, '../../mobile/lib/src/theme');
const dart = (name: string) => readFileSync(resolve(flutterTheme, name), 'utf8');
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
  const colors = dart('mm_colors.dart');
  for (const palette of ['martian', 'dark', 'light']) {
    it(`of ${palette} equal the Flutter theme's`, () => {
      const start = colors.indexOf(`static const ${palette} = MmColors(`);
      expect(start).toBeGreaterThanOrEqual(0);
      const body = colors.slice(start, colors.indexOf(');', start));
      const expected = [...body.matchAll(/(\w+): Color\(0xFF([0-9A-F]{6})\)/g)];
      expect(expected.length).toBe(25);
      const tokens = cssBlock(`.theme-${palette}`);
      for (const [, name, hex] of expected) {
        expect(tokens.get(kebab(name!)), `${palette} ${name}`).toBe(`#${hex!.toLowerCase()}`);
      }
    });
  }
});

describe('radii and spacing', () => {
  const root = cssBlock(':root {\n  /* Radii');

  it('equal MmRadius', () => {
    const radius = dart('mm_radius.dart');
    const value = (name: string) => Number(new RegExp(`${name} = (\\d+)`).exec(radius)![1]);
    expect(root.get('radius-control')).toBe(`${value('control')}px`);
    expect(root.get('radius-chip')).toBe(`${value('chip')}px`);
    expect(root.get('radius-sheet-top')).toBe(`${value('sheetTop')}px`);
    // The group radius is 16, and 12 in Martian (mm_theme.dart).
    expect(cssBlock('.theme-dark').get('radius-group')).toBe(`${value('group')}px`);
    expect(cssBlock('.theme-light').get('radius-group')).toBe(`${value('group')}px`);
    expect(cssBlock('.theme-martian').get('radius-group')).toBe('12px');
  });

  it('equal MmSpace', () => {
    const space = dart('mm_space.dart');
    const steps = [...space.matchAll(/s(\d+) = (\d+)/g)];
    expect(steps.length).toBe(6);
    for (const [, name, value] of steps) expect(root.get(`space-${name}`)).toBe(`${value}px`);
  });
});

describe('the type roles', () => {
  it('equal MmType, with sizes in rem at 16px', () => {
    const root = cssBlock(':root {\n  /* Radii');
    // role: [size, line height, weight, family] as mm_type.dart sets them.
    const roles: Record<string, [number, number, number, string]> = {
      'figure-xl': [48, 52, 600, 'figures'],
      figure: [32, 36, 600, 'figures'],
      title: [22, 28, 600, 'figures'],
      heading: [17, 24, 600, 'text'],
      body: [15, 22, 400, 'text'],
      label: [13, 16, 600, 'text'],
      caption: [12, 16, 400, 'text'],
    };
    const source = dart('mm_type.dart');
    for (const [role, [size, line, weight, family]] of Object.entries(roles)) {
      expect(root.get(`type-${role}`), role).toBe(`${weight} ${size / 16}rem/${line / 16}rem var(--font-${family})`);
    }
    // The numbers above are the ones in the Dart file.
    expect(source).toContain('grotesk(48, 52)');
    expect(source).toContain('grotesk(32, 36)');
    expect(source).toContain('grotesk(22, 28)');
    for (const [size, line] of [[17, 24], [15, 22], [13, 16], [12, 16]]) {
      expect(source).toMatch(new RegExp(`size: ${size},\\s+line: ${line},`));
    }
  });
});
