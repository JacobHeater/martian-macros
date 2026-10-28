import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { rules } from '../support/stylesheetRules';

const css = rules(readFileSync('src/ui/ui.css', 'utf8'));
const body = (selector: string) => css.filter((rule) => rule.selectors.includes(selector)).map((rule) => rule.body).join(';');

// MM-675: the grip and Close scrolled away with a long sheet's words; a sheet's grabber stays put on the phone.
it('MM-675: the sheet’s head stays at the top while the content scrolls under it', () => {
  const head = body('.mm-sheet-head');
  expect(head).toMatch(/position:\s*sticky/);
  expect(head).toMatch(/top:\s*0/);
  expect(head).toMatch(/background:\s*var\(--raised\)/);
  expect(body('.mm-sheet')).toMatch(/overflow-y:\s*auto/);
});

it('MM-675: the drag, the spring back and the leaving move on the compositor, on motion tokens', () => {
  expect(body('.mm-sheet')).toMatch(/will-change:\s*transform/);
  expect(body('.mm-sheet-risen')).toMatch(/animation:\s*none/);
  expect(body('.mm-sheet-dragging')).toMatch(/transition:\s*none/);
  expect(body('.mm-sheet-settling')).toMatch(/transition:\s*transform var\(--motion-base\)/);
  expect(body('.mm-sheet-leaving')).toMatch(/transition:\s*transform var\(--motion-slow\)/);
  expect(body('.mm-scrim-leaving')).toMatch(/opacity:\s*0/);
});
