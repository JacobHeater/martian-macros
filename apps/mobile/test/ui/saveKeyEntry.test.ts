import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { rules } from '../support/stylesheetRules';

const css = rules(readFileSync('src/ui/ui.css', 'utf8'));
const body = (selector: string) => css.filter((rule) => rule.selectors.includes(selector)).map((rule) => rule.body).join(';');

// MM-669: the API key's field and its Save key sat in a div of class names no stylesheet defines, so the button
// hugged the field; outlined in the field's own violet, it read as a second field.
it('MM-669: the key’s actions stand in a row 12 px under its field, in classes a stylesheet defines', () => {
  const source = readFileSync('src/settings/CoachSettingsSection.tsx', 'utf8');
  expect(source).toMatch(/<div className="app-stack-item">\s*<MmTextField\s+name="Coaching API key"/);
  expect(source).toMatch(/<div className="app-row">\s*<MmButton label="Save key"/);
  expect(source).not.toMatch(/number-entry__/);
  expect(rules(readFileSync('src/app/app.css', 'utf8')).some((rule) => rule.selectors.includes('.app-stack-item'))).toBe(true);
});

it('MM-669: a secondary button is outlined in the text colour, a field in the frame’s', () => {
  expect(body('.mm-button-secondary')).toMatch(/border-color:\s*var\(--text2\)/);
  expect(body('.mm-field-box')).toMatch(/border:\s*1px solid var\(--outline-strong\)/);
});
