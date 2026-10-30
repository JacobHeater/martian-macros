import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { rules } from '../support/stylesheetRules';

/**
 * Layout at 200% text, found in the first stories drawn at that size
 * (`Designs/Coaching insights`, 2026-10-17). The test's document lays out
 * nothing, so the guard reads the rules that make the layout hold (MM-374;
 * MM-373's bar is gone, MM-711); the large-text stories are the check by eye (MM-91).
 */
const ui = rules(readFileSync(new URL('../../src/ui/ui.css', import.meta.url), 'utf8'));
const bodyOf = (selector: string): string => ui.filter((rule) => rule.selectors.includes(selector)).map((rule) => rule.body).join(' ');

describe('at 200% text', () => {
  it('MM-374: the Dashboard title does not overlap "Add food", and the water row stays one row', () => {
    expect(bodyOf('.mm-app-bar-title')).toMatch(/overflow-wrap:\s*anywhere/);
    expect(bodyOf('.mm-app-bar-title')).toMatch(/hyphens:\s*auto/);
    expect(bodyOf('.mm-app-bar > :not(.mm-app-bar-title)')).toMatch(/flex-shrink:\s*0/);
    const action = bodyOf('.mm-list-row-with-action > .mm-button');
    expect(action).toMatch(/white-space:\s*normal/);
    expect(action).toMatch(/min-width:\s*0/);
    // The action takes at most half the row, so the words keep the rest (the UX guard's F8).
    expect(action).toMatch(/max-width:\s*50%/);
  });
});
