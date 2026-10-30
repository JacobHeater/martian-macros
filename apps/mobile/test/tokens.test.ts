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

// MM-297, SC 1.4.11: a field's border identifies it, so it holds 3:1 against
// every background a field sits on, in every palette.
describe('the field border', () => {
  const luminance = (hex: string) => {
    const channel = (i: number) => {
      const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  };
  const ratio = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
    return (hi + 0.05) / (lo + 0.05);
  };
  for (const palette of ['martian', 'dark', 'light']) {
    it(`holds 3:1 against surface, raised and canvas in ${palette}`, () => {
      const tokens = cssBlock(`.theme-${palette}`);
      const border = tokens.get('outline-strong')!;
      for (const background of ['surface', 'raised', 'canvas']) {
        expect(ratio(border, tokens.get(background)!), `${palette} ${background}`).toBeGreaterThanOrEqual(3);
      }
    });

    // design/color-and-theme-system.md §6, carried over from the Flutter tests (MM-375): every text role is readable on
    // every surface level, and the macros stay at least 10 L* apart so they survive grayscale.
    it(`gives every text role 4.5:1 on canvas, surface, raised and overlay in ${palette}`, () => {
      const tokens = cssBlock(`.theme-${palette}`);
      for (const text of ['text', 'text2', 'text3']) {
        for (const level of ['canvas', 'surface', 'raised', 'overlay']) {
          expect(ratio(tokens.get(text)!, tokens.get(level)!), `${palette} ${text} on ${level}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });

    // MM-362: the coach's insight lines are caption text in ion, so ion is readable on every surface level (UX-7).
    it(`gives ion 4.5:1 on canvas, surface, raised and overlay in ${palette}`, () => {
      const tokens = cssBlock(`.theme-${palette}`);
      for (const level of ['canvas', 'surface', 'raised', 'overlay']) {
        expect(ratio(tokens.get('ion')!, tokens.get(level)!), `${palette} ion on ${level}`).toBeGreaterThanOrEqual(4.5);
      }
    });

    it(`keeps protein, carbs and fat at least 10 L* apart in ${palette}`, () => {
      const tokens = cssBlock(`.theme-${palette}`);
      const lightness = (hex: string) => {
        const y = luminance(hex);
        return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y;
      };
      const [protein, carbs, fat] = ['protein', 'carbs', 'fat'].map((macro) => lightness(tokens.get(macro)!)) as [number, number, number];
      expect(Math.abs(protein - carbs), `${palette} protein-carbs`).toBeGreaterThanOrEqual(10);
      expect(Math.abs(protein - fat), `${palette} protein-fat`).toBeGreaterThanOrEqual(10);
      expect(Math.abs(carbs - fat), `${palette} carbs-fat`).toBeGreaterThanOrEqual(10);
    });

    // MM-106: Ember carries the one primary action: its label on its fill, and as the lead text action and the
    // current destination on the canvas and the surface; the semantic colours are text and icons on every level, overlay
    // included, where dialogs show their errors (MM-554).
    it(`gives Ember's label, Ember as text and the semantic colours their contrast in ${palette}`, () => {
      const tokens = cssBlock(`.theme-${palette}`);
      expect(ratio(tokens.get('on-ember')!, tokens.get('ember')!), `${palette} on-ember on ember`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(tokens.get('on-danger')!, tokens.get('danger')!), `${palette} on-danger on danger`).toBeGreaterThanOrEqual(4.5);
      for (const level of ['canvas', 'surface', 'raised', 'overlay']) {
        expect(ratio(tokens.get('ember')!, tokens.get(level)!), `${palette} ember on ${level}`).toBeGreaterThanOrEqual(4.5);
        for (const meaning of ['caution', 'info', 'danger', 'positive']) {
          expect(ratio(tokens.get(meaning)!, tokens.get(level)!), `${palette} ${meaning} on ${level}`).toBeGreaterThanOrEqual(4.5);
        }
      }
      // A chosen segment and the current tab wear chosen, their words and icon on-chosen (MM-555).
      expect(ratio(tokens.get('on-chosen')!, tokens.get('chosen')!), `${palette} on-chosen on chosen`).toBeGreaterThanOrEqual(4.5);
      // A field sits on sunken, a chosen chip on selected: the text stays readable there.
      for (const level of ['sunken', 'selected']) {
        expect(ratio(tokens.get('text')!, tokens.get(level)!), `${palette} text on ${level}`).toBeGreaterThanOrEqual(4.5);
      }
      // The macro bars and the water bar are graphics: 3:1 against their track.
      for (const fill of ['protein', 'carbs', 'fat', 'water']) {
        expect(ratio(tokens.get(fill)!, tokens.get('track')!), `${palette} ${fill} on track`).toBeGreaterThanOrEqual(3);
      }
    });

    // MM-556, MM-558: a section's mark, the calorie arc and the hero's line are graphics (3:1), the ink holds
    // 4.5:1 on the neon-orange fill, and Dark and Light show no line.
    it(`gives the section mark, the arc and the bar's line their contrast in ${palette}`, () => {
      const tokens = cssBlock(`.theme-${palette}`);
      for (const level of ['canvas', 'surface', 'raised']) {
        expect(ratio(tokens.get('mark')!, tokens.get(level)!), `${palette} mark on ${level}`).toBeGreaterThanOrEqual(3);
      }
      expect(ratio(tokens.get('arc')!, tokens.get('track')!), `${palette} arc on track`).toBeGreaterThanOrEqual(3);
      expect(ratio(tokens.get('on-flare')!, tokens.get('flare')!), `${palette} on-flare on flare`).toBeGreaterThanOrEqual(4.5);
      if (palette === 'martian') {
        expect(ratio(tokens.get('accent-line')!, tokens.get('raised')!), 'martian line on raised').toBeGreaterThanOrEqual(3);
      } else {
        expect(tokens.get('accent-line')).toBe('transparent');
      }
    });

    // MM-370: the letter carries a grade's meaning, so it holds 4.5:1 on its band's fill.
    it(`gives every grade letter 4.5:1 on its fill in ${palette}`, () => {
      const tokens = cssBlock(`.theme-${palette}`);
      for (const band of ['a', 'b', 'c', 'd']) {
        expect(ratio(tokens.get('on-grade')!, tokens.get(`grade-${band}`)!), `${palette} ${band}`).toBeGreaterThanOrEqual(4.5);
      }
    });

    // MM-375: a grade badge is told apart from where it sits: its fill holds 3:1 there, or, where the fill is too pale
    // for that (light), its edge does.
    it(`gives every grade badge a 3:1 boundary on canvas, surface and raised in ${palette}`, () => {
      const tokens = cssBlock(`.theme-${palette}`);
      const edge = tokens.get('grade-edge')!;
      for (const level of ['canvas', 'surface', 'raised']) {
        if (edge !== 'transparent') {
          expect(ratio(edge, tokens.get(level)!), `${palette} grade edge on ${level}`).toBeGreaterThanOrEqual(3);
          continue;
        }
        for (const band of ['a', 'b', 'c', 'd']) {
          expect(ratio(tokens.get(`grade-${band}`)!, tokens.get(level)!), `${palette} ${band} on ${level}`).toBeGreaterThanOrEqual(3);
        }
      }
    });

    // MM-375: macro colours mean their macro only, so none is water or a grade fill, and no grade wears the action.
    it(`keeps the macros off water and the grade fills, and the grades off the action, in ${palette}`, () => {
      const tokens = cssBlock(`.theme-${palette}`);
      const grades = ['a', 'b', 'c', 'd'].map((band) => tokens.get(`grade-${band}`)!.toLowerCase());
      for (const macro of ['protein', 'carbs', 'fat']) {
        const value = tokens.get(macro)!.toLowerCase();
        expect(value, `${palette} ${macro} is water`).not.toBe(tokens.get('water')!.toLowerCase());
        expect(grades, `${palette} ${macro} is a grade fill`).not.toContain(value);
      }
      expect(grades, `${palette} a grade is the action`).not.toContain(tokens.get('ember')!.toLowerCase());
    });
  }
});
