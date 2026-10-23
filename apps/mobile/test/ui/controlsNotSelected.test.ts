import { expect, it } from 'vitest';
import { declarationsOf } from '../support/stylesheetRules';

/** MM-593: a long press on the day's name selected it as text to copy, as it would any button's words. */
it.each([
  ['src/theme/base.css', 'button'],
  ['src/theme/base.css', "[role='button']"],
  ['src/ui/ui.css', '.mm-day-stepper'],
])('MM-593: %s %s cannot be selected or offered to copy', (path, selector) => {
  const body = declarationsOf(path, selector);
  expect(body).toMatch(/(^|[;\s])user-select: none/);
  expect(body).toMatch(/-webkit-user-select: none/);
  expect(body).toMatch(/-webkit-touch-callout: none/);
});
