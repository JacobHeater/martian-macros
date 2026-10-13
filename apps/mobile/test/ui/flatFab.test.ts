import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-181: the owner rejected the glow around the floating Add food button.
 * The primary action is a flat Ember fill in every state: no shadow, halo
 * or elevation at rest, on hover, focus or press. Nothing lays out in the
 * test browser, so this reads the design system's stylesheet.
 */
function rules(css: string): { selectors: string[]; body: string }[] {
  const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...plain.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selectors: match[1]!.split(',').map((selector) => selector.trim()),
    body: match[2]!,
  }));
}

const glow = /(?:^|;|\s)(?:box-shadow|text-shadow|filter|backdrop-filter):\s*(?!none\b)/;

it('the floating action has no shadow, halo or elevation in any state', () => {
  const fabRules = rules(readFileSync('src/ui/ui.css', 'utf8')).filter((rule) =>
    rule.selectors.some((selector) => /(?:^|\s|,)\.mm-fab(?![\w-])/.test(selector)),
  );
  expect(fabRules.length, 'the FAB is styled in ui.css').toBeGreaterThan(0);
  const glowing = fabRules.filter((rule) => glow.test(rule.body)).map((rule) => rule.selectors.join(', '));
  expect(glowing).toEqual([]);
});
