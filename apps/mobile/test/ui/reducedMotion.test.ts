import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { rules, stylesheets } from '../support/stylesheetRules';

/**
 * MM-106, rule 7: motion respects the phone's reduce-motion setting. Every
 * transition and animation takes its duration from a `--motion-*` token,
 * and under `prefers-reduced-motion` the tokens go to 0 ms (the spinner
 * turns slowly, fades keep 100 ms), so nothing moves that the stylesheet
 * did not route through a token. The pressed scale becomes a change of
 * opacity there.
 */
const literalDuration = /\b\d+(?:\.\d+)?m?s\b/;

describe('reduced motion', () => {
  it('every transition and animation takes its duration from a motion token', () => {
    const literal: string[] = [];
    for (const path of stylesheets('src')) {
      for (const rule of rules(readFileSync(path, 'utf8'))) {
        for (const declaration of rule.body.split(';')) {
          const [property, value] = declaration.split(':').map((part) => part?.trim());
          if (property === undefined || value === undefined) continue;
          if (!/^(?:transition|animation)(?:-duration|-delay)?$/.test(property)) continue;
          if (value === 'none') continue;
          if (literalDuration.test(value)) literal.push(`${path}: ${rule.selectors.join(', ')} { ${property}: ${value} }`);
          if (!/var\(--motion-/.test(value)) literal.push(`${path}: ${rule.selectors.join(', ')} { ${property}: ${value} } names no token`);
        }
      }
    }
    expect(literal).toEqual([]);
  });

  it('the motion tokens go to 0 ms under prefers-reduced-motion, the spinner excepted', () => {
    const tokens = rules(readFileSync('src/theme/tokens.css', 'utf8'));
    const reduced = tokens.filter((rule) => rule.reducedMotion && rule.selectors.includes(':root')).map((rule) => rule.body).join('\n');
    const normal = tokens.filter((rule) => !rule.reducedMotion && rule.selectors.includes(':root')).map((rule) => rule.body).join('\n');
    const named = [...normal.matchAll(/--(motion-[a-z]+):/g)].map((match) => match[1] as string);
    expect(named.length).toBeGreaterThan(3);
    const valueOf = (token: string, block: string) => new RegExp(`--${token}:\\s*([^;]+);`).exec(block)?.[1]?.trim();
    for (const token of named) {
      const value = valueOf(token, reduced) ?? valueOf(token, normal);
      expect(value, `${token} under reduced motion`).toBeDefined();
      // The spinner keeps turning, slowly; a fade is not movement and keeps its 100 ms; everything else stops.
      if (token === 'motion-turn') expect(Number.parseInt(value!, 10)).toBeGreaterThanOrEqual(1000);
      else if (token === 'motion-fade') expect(Number.parseInt(value!, 10)).toBeLessThanOrEqual(100);
      else expect(value, `${token} under reduced motion`).toBe('0ms');
    }
  });

  it('a pressed primary and the floating action do not scale under reduced motion', () => {
    const reduced = rules(readFileSync('src/ui/ui.css', 'utf8')).filter((rule) => rule.reducedMotion);
    const primary = reduced.find((rule) => rule.selectors.some((selector) => /\.mm-button-primary:not\(:disabled\):active/.test(selector)));
    expect(primary?.body).toMatch(/transform:\s*none/);
    expect(primary?.selectors.some((selector) => /\.mm-fab:active/.test(selector))).toBe(true);
  });
});
