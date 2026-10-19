import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { rules } from '../support/stylesheetRules';

/**
 * MM-400: on a phone the whole frame scrolled, the app bar under the status
 * bar and the navigation bar halfway up the screen. Visually hidden words
 * deep in the Dashboard were positioned against the screen's layer, not the
 * scrolling body, so they lengthened the page (2,500 px on a 915 px screen
 * in the Dashboard's history story), and the page scrolled.
 */
const css = (path: string) => rules(readFileSync(join(__dirname, '../../src', path), 'utf8'));

it('a screen body holds what is positioned inside it', () => {
  const body = css('app/app.css').filter((rule) => rule.selectors.includes('.app-body'));
  expect(body.some((rule) => /position:\s*relative/.test(rule.body))).toBe(true);
});

it('a Storybook canvas taller than the frame scrolls itself, the page not scrolling (the UX guard’s UX-B1)', () => {
  const canvas = rules(readFileSync(join(__dirname, '../../.storybook/preview.css'), 'utf8')).filter((rule) =>
    rule.selectors.includes('.story-canvas'),
  );
  expect(canvas.some((rule) => /overflow-y:\s*auto/.test(rule.body) && /(^|;)\s*height:\s*100vh/.test(rule.body))).toBe(true);
});

it('the page itself never scrolls', () => {
  const page = css('theme/base.css').filter((rule) => rule.selectors.includes('html') && rule.selectors.includes('body'));
  expect(page.some((rule) => /overflow:\s*hidden/.test(rule.body))).toBe(true);
});
