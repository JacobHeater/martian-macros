import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { rules } from '../support/stylesheetRules';

const css = rules(readFileSync('src/ui/ui.css', 'utf8'));
const declared = (selector: string, property: string) =>
  css.filter((rule) => rule.selectors.includes(selector)).some((rule) => new RegExp(`(^|;)\\s*${property}\\s*:\\s*`).test(rule.body));

// MM-329: the owner saw a hard right edge while the water bar pours; the ripple was not clipped to the round end.
it("MM-329: the ripple is clipped to the fill's round end", () => {
  expect(declared('.mm-progress-wave', 'border-radius')).toBe(true);
  expect(declared('.mm-progress-wave', 'overflow')).toBe(true);
});
