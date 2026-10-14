import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { rules } from '../support/stylesheetRules';

/**
 * MM-267: every pressable shows a tap landed. Every selector that sets
 * `cursor: pointer` has an `:active` rule, with a `.mm-pressed` twin so the
 * register can show the state; the primary button and the floating action
 * depress to 98%; under reduced motion the scale goes and a non-moving
 * change stays.
 */
const ui = rules(readFileSync('src/ui/ui.css', 'utf8'));
const base = (selector: string) => selector.replace(/::?[a-z-]+(\([^)]*\))?/g, '').replace(/^\.mm-pressed /, '');

describe('pressed states', () => {
  const pressable = [...new Set(ui.filter((rule) => /cursor: pointer/.test(rule.body)).flatMap((rule) => rule.selectors))];
  const pressed = ui.filter((rule) => !rule.reducedMotion && rule.selectors.some((selector) => selector.includes(':active')));

  it('finds the pressable controls', () => {
    expect(pressable).toEqual(expect.arrayContaining(['.mm-button', '.mm-icon-button', '.mm-chip', '.mm-segment', '.mm-option', '.mm-day']));
  });

  it.each(pressable)('%s has an :active rule', (selector) => {
    const match = pressed.some((rule) => rule.selectors.some((s) => s.includes(':active') && base(s) === base(selector)));
    expect(match, `${selector} has no :active rule`).toBe(true);
  });

  it('every :active selector has a .mm-pressed twin in the same rule, for the register', () => {
    const missing: string[] = [];
    for (const rule of pressed) {
      for (const selector of rule.selectors) {
        if (!selector.includes(':active')) continue;
        const twin = `.mm-pressed ${selector.replace(':active', '')}`.replace(/\s+/g, ' ');
        if (!rule.selectors.some((s) => s.replace(/\s+/g, ' ') === twin)) missing.push(selector);
      }
    }
    expect(missing).toEqual([]);
  });

  it('the primary button and the floating action depress to 98% over --motion-fast', () => {
    const primary = ui.find((rule) => rule.selectors.includes('.mm-button-primary:not(:disabled):active'));
    expect(primary?.body).toMatch(/transform: scale\(0\.98\)/);
    const fab = ui.find((rule) => rule.selectors.includes('.mm-fab:active'));
    expect(fab?.body).toMatch(/transform: scale\(0\.98\)/);
    expect(ui.find((rule) => rule.selectors.includes('.mm-button'))?.body).toMatch(/transform var\(--motion-fast\)/);
    expect(ui.find((rule) => rule.selectors.includes('.mm-fab'))?.body).toMatch(/transform var\(--motion-fast\)/);
  });

  it('under reduced motion the scale goes and a non-moving change remains', () => {
    const reduced = ui.filter((rule) => rule.reducedMotion && rule.selectors.includes('.mm-fab:active'));
    expect(reduced.length).toBe(1);
    expect(reduced[0]!.body).toMatch(/transform: none/);
    expect(reduced[0]!.body).toMatch(/opacity|background|box-shadow/);
  });
});
