import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { rules } from '../support/stylesheetRules';

/**
 * MM-281: 48 dp for everything pressable. No rule for a pressable control
 * sets a min-height under 48 px; a status chip, which does nothing when
 * touched, is the one chip allowed to be smaller.
 */
const ui = rules(readFileSync('src/ui/ui.css', 'utf8'));
const pressable = new Set(
  ui
    .filter((rule) => /cursor: pointer/.test(rule.body))
    .flatMap((rule) => rule.selectors)
    .map((selector) => selector.replace(/::?[a-z-]+(\([^)]*\))?$/g, '')),
);

describe('touch targets', () => {
  it('no pressable rule sets a min-height under 48px', () => {
    const short: string[] = [];
    for (const rule of ui) {
      const height = /min-height:\s*(\d+)px/.exec(rule.body);
      if (height === null || Number(height[1]) >= 48) continue;
      for (const selector of rule.selectors) {
        const last = selector.split(/\s+/).pop()!.replace(/::?[a-z-]+(\([^)]*\))?$/g, '');
        if (pressable.has(last)) short.push(`${selector}: ${height[0]}`);
      }
    }
    expect(short).toEqual([]);
  });

  it('chips and compact segments are 48 dp', () => {
    expect(ui.find((rule) => rule.selectors.includes('.mm-chip'))?.body).toMatch(/min-height: 48px/);
    expect(ui.find((rule) => rule.selectors.includes('.mm-segmented-compact .mm-segment'))?.body).toMatch(/min-height: 48px/);
  });
});
