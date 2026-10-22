import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MmButton } from '../../src/ui/MmButton';
import { declarationsOf } from '../support/stylesheetRules';

/**
 * MM-288, the Ember budget under (a): a text action is in the text colour at
 * the heading weight; Ember text is only the lead kind, the screen's primary
 * where it stands in the app bar and cannot be a fill.
 */
const ui = 'src/ui/ui.css';

describe('text actions and the Ember budget', () => {
  it('a text action is in the text colour, never Ember', () => {
    const text = declarationsOf(ui, '.mm-button-text');
    expect(text).toMatch(/color:\s*var\(--text\)/);
    expect(text).not.toMatch(/var\(--ember\)/);
    // The heading rung: the button's font is the heading role, weight 600.
    expect(declarationsOf(ui, '.mm-button')).toMatch(/font:\s*var\(--type-heading\)/);
    expect(readFileSync('src/theme/tokens.css', 'utf8')).toMatch(/--type-heading:\s*600 /);
  });

  it('the lead kind is the one Ember text, and the icon action follows the text button', () => {
    expect(declarationsOf(ui, '.mm-button-lead')).toMatch(/color:\s*var\(--ember\)/);
    expect(declarationsOf(ui, '.mm-icon-button-action:not(:disabled)')).toMatch(/color:\s*var\(--text\)/);
    expect(declarationsOf(ui, '.mm-icon-button-action:not(:disabled)')).not.toMatch(/var\(--ember\)/);
  });

  it('a text action is underlined, so it is told from the value or title beside it without colour (the panel\'s PD2, F7)', () => {
    expect(declarationsOf(ui, '.mm-button-text:not(:disabled)')).toMatch(/text-decoration:\s*underline/);
  });

  it('MM-436: the add plate\'s plus rests in the text colour; Ember only when pressed, hovered or focused', () => {
    const plate = declarationsOf(ui, '.mm-icon-button-plate');
    expect(plate).toMatch(/color:\s*var\(--text\)/);
    expect(plate).not.toMatch(/color:\s*var\(--ember\)/);
  });

  it('MM-437, MM-555: a chosen segment is its ink on the chosen fill, not Ember', () => {
    const chosen = declarationsOf(ui, '.mm-segment-selected');
    expect(chosen).toMatch(/background:\s*var\(--chosen\)/);
    expect(chosen).toMatch(/color:\s*var\(--on-chosen\)/);
    expect(chosen).not.toMatch(/var\(--ember\)/);
  });

  it('a button of each kind carries its kind as a class, so the register and the rule can tell them apart', () => {
    render(<MmButton label="Add food" kind="lead" onPress={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Add food' })).toHaveClass('mm-button-lead');
  });
});
