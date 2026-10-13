import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

/**
 * MM-239: a focused text field drew two outlines, because the rule that
 * removed the input's outline tied with the app-wide focus ring and lost to
 * it by load order. Nothing lays out in the test browser, so this reads the
 * stylesheets: a rule that removes an outline has to name the focused state,
 * which outranks the app-wide ring wherever it is loaded.
 */
function stylesheets(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) return stylesheets(path);
    return entry.name.endsWith('.css') ? [path] : [];
  });
}

/** Every rule of `css` as its selectors and its declarations. */
function rules(css: string): { selectors: string[]; body: string }[] {
  const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...plain.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selectors: match[1]!.split(',').map((selector) => selector.trim()),
    body: match[2]!,
  }));
}

const removesOutline = /(?:^|;|\s)outline:\s*(?:0|none)\b/;

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
