import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { rules } from '../support/stylesheetRules';

/** The value of `--name` in a palette's block of tokens.css. */
const tokens = readFileSync('src/theme/tokens.css', 'utf8');
const token = (palette: string, name: string) => {
  const start = tokens.indexOf(`.theme-${palette}`);
  const body = tokens.slice(tokens.indexOf('{', start) + 1, tokens.indexOf('}', start));
  return new RegExp(`--${name}:\\s*([^;]+);`).exec(body)?.[1]?.trim();
};

/** The token a notice inside a sheet is painted with: a rule of its own, or the notice's own background. */
const css = rules(readFileSync('src/ui/ui.css', 'utf8'));
const background = (selector: string) =>
  /background:\s*var\(--([a-z-]+)\)/.exec(css.find((rule) => rule.selectors.includes(selector))?.body ?? '')?.[1];

// MM-338: in Light a notice (--surface) on a sheet (--overlay) is white on white.
it('MM-338: a notice on a sheet stands apart from the sheet in every palette', () => {
  const notice = background('.mm-sheet .mm-notice') ?? background('.mm-notice');
  const sheet = background('.mm-sheet');
  expect(notice).toBeDefined();
  expect(sheet).toBeDefined();
  for (const palette of ['martian', 'dark', 'light']) {
    expect(token(palette, notice!), palette).not.toBe(token(palette, sheet!));
  }
});
