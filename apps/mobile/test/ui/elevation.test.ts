import { describe, expect, it } from 'vitest';
import { declarationsOf } from '../support/stylesheetRules';

/**
 * MM-277: the sheet and the cards match their written spec. The sheet has
 * the sheet-top radius on a raised surface, with the Light shadow; surfaces,
 * list groups and the hero carry the Light shadow and the Dark top
 * highlight.
 */
const ui = 'src/ui/ui.css';

describe('elevation', () => {
  it('the sheet uses --radius-sheet-top on --raised, with the Light shadow', () => {
    const sheet = declarationsOf(ui, '.mm-sheet');
    expect(sheet).toMatch(/border-radius: var\(--radius-sheet-top\) var\(--radius-sheet-top\) 0 0/);
    expect(sheet).toMatch(/background: var\(--raised\)/);
    expect(declarationsOf(ui, '.theme-light .mm-sheet')).toMatch(/box-shadow: 0 8px 24px/);
  });

  it.each(['.mm-surface', '.mm-list-group', '.mm-hero'])('%s carries the Light shadow and the Dark highlight', (selector) => {
    expect(declarationsOf(ui, `.theme-light ${selector}`)).toMatch(/box-shadow: 0 1px 2px/);
    for (const theme of ['martian', 'dark']) {
      expect(declarationsOf(ui, `.theme-${theme} ${selector}`)).toMatch(/box-shadow: inset 0 1px 0 color-mix\(in srgb, var\(--text\) 6%, transparent\)/);
    }
  });
});
