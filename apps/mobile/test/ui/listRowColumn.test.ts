import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { rules } from '../support/stylesheetRules';

/** MM-324: a row's words start on one column whether or not it has an action: both rows share one gap. */
it('a row with an action and a row without lay out their words with the same gap', () => {
  const ui = rules(readFileSync(new URL('../../src/ui/ui.css', import.meta.url), 'utf8'));
  const gapOf = (selector: string): string | undefined =>
    ui
      .filter((rule) => rule.selectors.includes(selector))
      .map((rule) => /(?:^|;)\s*gap:\s*([^;]+)/.exec(rule.body)?.[1]?.trim())
      .find((gap) => gap !== undefined);
  expect(gapOf('.mm-list-row-main')).toBeDefined();
  expect(gapOf('.mm-list-row-main')).toBe(gapOf('.mm-list-row'));
});

/** MM-352: a notice stands apart from the canvas in Light, with the hairline the list groups beside it have; a well of a sheet keeps no rim. */
it('a notice carries a hairline on the canvas, and none as an info well of a sheet or dialog', () => {
  const ui = rules(readFileSync(new URL('../../src/ui/ui.css', import.meta.url), 'utf8'));
  const notice = ui.filter((rule) => rule.selectors.includes('.mm-notice')).map((rule) => rule.body).join(' ');
  expect(notice).toMatch(/border:\s*1px solid var\(--outline\)/);
  const well = ui.filter((rule) => rule.selectors.includes('.mm-sheet .mm-notice-info') && rule.selectors.includes('.mm-dialog .mm-notice-info'));
  expect(well.map((rule) => rule.body).join(' ')).toMatch(/border-color:\s*transparent/);
});
