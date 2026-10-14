import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { rules, stylesheets } from '../support/stylesheetRules';

/**
 * MM-274: every value is a token. Across every stylesheet under `src/`:
 * each radius is a `--radius-*` token (or full-round, a circle or the 2 px
 * of a hairline bar), each transition and animation duration a
 * `--motion-*` token, each gap a `--space-*` token, every custom property
 * used is declared in tokens.css or in the same sheet (or carries a
 * fallback), and no hex colour appears outside tokens.css.
 */
const tokens = readFileSync('src/theme/tokens.css', 'utf8');
const declaredInTokens = new Set([...tokens.matchAll(/--([a-z0-9-]+):/g)].map((match) => match[1]!));

const sheets = stylesheets('src').filter((path) => !path.endsWith('tokens.css'));

const declarations = (body: string) =>
  body
    .split(';')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => {
      const colon = line.indexOf(':');
      return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()] as const;
    });

describe('the stylesheets', () => {
  it('draw every radius from a token', () => {
    const literal: string[] = [];
    for (const path of sheets) {
      for (const rule of rules(readFileSync(path, 'utf8'))) {
        for (const [property, value] of declarations(rule.body)) {
          if (!property.startsWith('border-radius') && !/^border-(top|bottom|start|end).*-radius$/.test(property)) continue;
          const parts = value.split(/\s+/);
          if (!parts.every((part) => /^var\(--radius-[a-z-]+\)$/.test(part) || part === '50%' || part === '999px' || part === '2px' || part === '0' || part === 'inherit')) {
            literal.push(`${path}: ${rule.selectors.join(', ')} { ${property}: ${value} }`);
          }
        }
      }
    }
    expect(literal).toEqual([]);
  });

  it('take every transition and animation duration from a motion token', () => {
    const literal: string[] = [];
    for (const path of sheets) {
      for (const rule of rules(readFileSync(path, 'utf8'))) {
        for (const [property, value] of declarations(rule.body)) {
          if (!['transition', 'animation', 'transition-duration', 'animation-duration'].includes(property)) continue;
          if (value === 'none') continue;
          if (/\b\d+(\.\d+)?m?s\b/.test(value)) literal.push(`${path}: ${rule.selectors.join(', ')} { ${property}: ${value} }`);
          if (!/var\(--motion-[a-z]+\)/.test(value)) literal.push(`${path}: ${rule.selectors.join(', ')} { ${property}: ${value} } names no motion token`);
        }
      }
    }
    expect(literal).toEqual([]);
  });

  it('take every gap from the spacing scale', () => {
    const literal: string[] = [];
    for (const path of sheets) {
      for (const rule of rules(readFileSync(path, 'utf8'))) {
        for (const [property, value] of declarations(rule.body)) {
          if (!['gap', 'row-gap', 'column-gap'].includes(property)) continue;
          if (!value.split(/\s+/).every((part) => /^var\(--space-\d+\)$/.test(part) || part === '0')) {
            literal.push(`${path}: ${rule.selectors.join(', ')} { ${property}: ${value} }`);
          }
        }
      }
    }
    expect(literal).toEqual([]);
  });

  it('use only custom properties that are declared', () => {
    const undeclared: string[] = [];
    for (const path of sheets) {
      const css = readFileSync(path, 'utf8');
      const local = new Set([...css.matchAll(/--([a-z0-9-]+):/g)].map((match) => match[1]!));
      for (const match of css.matchAll(/var\(--([a-z0-9-]+)(,|\))/g)) {
        const [, name, after] = match as unknown as [string, string, string];
        if (after === ',' || declaredInTokens.has(name) || local.has(name)) continue;
        undeclared.push(`${path}: --${name}`);
      }
    }
    expect(undeclared).toEqual([]);
  });

  it('name no colour by hex outside tokens.css', () => {
    const hex: string[] = [];
    for (const path of sheets) {
      const css = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const match of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) hex.push(`${path}: ${match[0]}`);
    }
    expect(hex).toEqual([]);
  });

  it('declares the motion tokens the interaction doc names, zeroed under reduced motion', () => {
    for (const [name, ms] of [['fast', 100], ['base', 180], ['slow', 280], ['reveal', 600]] as const) {
      expect(tokens).toMatch(new RegExp(`--motion-${name}: ${ms}ms;`));
    }
    const reduced = /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/.exec(tokens)?.[0] ?? '';
    for (const name of ['fast', 'base', 'slow', 'reveal']) expect(reduced).toMatch(new RegExp(`--motion-${name}: 0ms;`));
  });
});
