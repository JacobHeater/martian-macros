import { describe, it } from 'vitest';

/**
 * Layout at 200% text, found in the first stories drawn at that size
 * (`Designs/Coaching insights`, 2026-10-17). The test's document lays out
 * nothing, so these wait for the fix and for a check in a real browser;
 * until then the large-text stories are looked at by eye (MM-91).
 */
describe('at 200% text', () => {
  it.skip('MM-373: every navigation label stays inside its own destination', () => {});
  it.skip('MM-374: the Dashboard title does not overlap "Add food", and the water row stays one row', () => {});
});
