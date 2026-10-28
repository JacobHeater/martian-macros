import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { rules } from '../support/stylesheetRules';

const css = rules(readFileSync('src/ui/ui.css', 'utf8'));
const body = (selector: string) => css.filter((rule) => rule.selectors.includes(selector)).map((rule) => rule.body).join(';');

// MM-668: a section carries a top margin and a surface or list group a bottom one, so a section before a card
// touched it (the Dashboard's insight on its rows, the Coach's summary on the weigh-in), and a card before a framed
// section stood 24 px off. Cards stand 12 px apart whichever comes first.
it('MM-668: a surface or a list group after a section stands 12 px under it', () => {
  for (const selector of ['.mm-section + .mm-surface', '.mm-section + .mm-list-group']) {
    expect(body(selector), selector).toMatch(/margin-top:\s*var\(--space-12\)/);
  }
});

it('MM-668: a framed section after a card adds no margin of its own, so the card’s 12 px is the gap', () => {
  for (const selector of ['.mm-surface + .mm-section-framed', '.mm-list-group + .mm-section-framed']) {
    expect(body(selector), selector).toMatch(/margin-top:\s*0/);
  }
  for (const card of ['.mm-surface', '.mm-list-group']) {
    expect(body(card), card).toMatch(/margin:\s*0 0 var\(--space-12\)/);
  }
  expect(body('.mm-section')).toMatch(/margin:\s*var\(--space-12\) 0 0/);
});

// MM-668: "Open on Coach" stood 12 px in from the insight's words: the rule that hangs a text button's padding out
// matched one after a paragraph only, and that button follows the disclosure.
it('MM-668: a text button directly in a section body hangs its padding out, wherever it stands', () => {
  expect(body('.mm-section-body > .mm-button-text:not(.mm-button-expand)')).toMatch(
    /margin-inline-start:\s*calc\(-1 \* var\(--space-12\)\)/,
  );
  expect(css.flatMap((rule) => rule.selectors)).not.toContain('.mm-section-body > p + .mm-button-text');
});
