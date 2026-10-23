import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { rules } from '../support/stylesheetRules';

const css = rules(readFileSync('src/ui/ui.css', 'utf8'));
const body = (selector: string) => css.filter((rule) => rule.selectors.includes(selector)).map((rule) => rule.body).join(';');

// MM-579: a surface in a section was pulled under the icon but kept `width: 100%` of the indented body, so it ended
// 36 px short of the list group above it (the waist chart under "Today's waist").
it('MM-579: a surface in a section runs the column’s width, as a list group does', () => {
  for (const selector of ['.mm-section-body > .mm-surface', '.mm-section-body > .mm-list-group']) {
    expect(body(selector), selector).toMatch(/margin-left:\s*calc\(-1 \* \(24px \+ var\(--space-12\)\)\)/);
    expect(body(selector), selector).toMatch(/width:\s*auto/);
  }
  expect(body('.mm-surface')).toMatch(/width:\s*100%/);
});
