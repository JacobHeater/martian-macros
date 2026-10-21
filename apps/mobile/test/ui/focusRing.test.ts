import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { rules, stylesheets } from '../support/stylesheetRules';

/**
 * MM-239: a focused text field drew two outlines, because the rule that
 * removed the input's outline tied with the app-wide focus ring and lost to
 * it by load order. Nothing lays out in the test browser, so this reads the
 * stylesheets: a rule that removes an outline has to name the focused state,
 * which outranks the app-wide ring wherever it is loaded.
 *
 * MM-275: the ring is never partly hidden. Every container that clips its
 * overflow has a rule drawing the ring inset for the controls inside it.
 */
const removesOutline = /(?:^|;|\s)outline:\s*(?:0|none)\b/;

/** Rules that hide overflow without holding anything pressable. */
const notContainers: Record<string, string> = {
  '.mm-visually-hidden': 'A 1 px box that hides text from sight.',
  '.mm-progress': 'A bar that clips its fill; nothing in it is pressed.',
  '.mm-progress-wave': 'The fill’s ripple, clipped to its round end (MM-329); nothing in it is pressed.',
  '.mm-picker-value': 'A line of text that ends in an ellipsis.',
};

it('no rule removes an outline without naming the focused state', () => {
  const weak: string[] = [];
  for (const path of stylesheets('src')) {
    for (const rule of rules(readFileSync(path, 'utf8'))) {
      if (!removesOutline.test(rule.body)) continue;
      for (const selector of rule.selectors) {
        if (!selector.includes(':focus-visible')) weak.push(`${path}: ${selector}`);
      }
    }
  }
  expect(weak).toEqual([]);
});

it('a field shows focus on its box and nothing inside it', () => {
  const ui = rules(readFileSync('src/ui/ui.css', 'utf8'));
  const input = ui.find((rule) => rule.selectors.includes('.mm-field-input:focus-visible'));
  expect(input?.body).toMatch(removesOutline);
  const box = ui.find((rule) => rule.selectors.includes('.mm-field-box:focus-within'));
  expect(box?.body).toMatch(/border-color: var\(--text\)/);
});

it('every container that hides overflow draws the ring inset for the controls inside it (MM-275)', () => {
  const ui = rules(readFileSync('src/ui/ui.css', 'utf8'));
  const inset = new Set(
    ui
      .filter((rule) => /outline-offset: -2px/.test(rule.body))
      .flatMap((rule) => rule.selectors)
      .map((selector) => selector.replace(/\s*:focus-visible$/, '').trim()),
  );
  const unguarded: string[] = [];
  for (const rule of ui) {
    if (!/overflow(?:-y|-x)?: hidden/.test(rule.body)) continue;
    for (const selector of rule.selectors) {
      if (selector in notContainers || inset.has(selector)) continue;
      unguarded.push(selector);
    }
  }
  expect(unguarded).toEqual([]);
});
