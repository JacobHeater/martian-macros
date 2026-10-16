import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-322: rows straight in a group keep the hairline between them. The
 * test's document computes no borders, so this reads the stylesheet: the
 * group's divider rule has to outweigh a row's own `border: 0` and come
 * after it, so it wins whichever way it is weighed.
 */
it('draws a hairline between two rows', () => {
  const css = readFileSync('src/ui/ui.css', 'utf8');
  const row = css.indexOf('.mm-list-row,\n.mm-toggle-row {');
  const divider = /\.mm-list-group > :not\(:first-child\) \{\s*border-top: 1px solid var\(--outline\);/.exec(css);
  expect(row).toBeGreaterThan(-1);
  expect(divider).not.toBeNull();
  expect(divider!.index).toBeGreaterThan(row);
  expect(css).not.toContain('.mm-list-group > * + *');
});
