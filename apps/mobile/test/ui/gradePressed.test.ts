import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { rules } from '../support/stylesheetRules';

/**
 * MM-376: pressing a filled grade badge took the shared pressed background
 * (`--selected`), which outranked the band's fill while the letter kept its
 * ink colour, so the letter all but vanished for as long as it was held
 * (1.8:1 in Martian). A pressed badge keeps its fill and its letter.
 */
const ui = rules(readFileSync('src/ui/ui.css', 'utf8'));

describe('a pressed grade badge', () => {
  const pressed = ui.filter((rule) => rule.selectors.some((selector) => /\.mm-grade-button:active|\.mm-pressed \.mm-grade-button/.test(selector)));

  it('has a pressed state', () => {
    expect(pressed.length).toBeGreaterThan(0);
  });

  it('never changes its background or its colour, so the fill and the letter stay', () => {
    for (const rule of pressed) {
      expect(rule.body, rule.selectors.join(', ')).not.toMatch(/background|(^|[^-])color\s*:/);
    }
  });
});
