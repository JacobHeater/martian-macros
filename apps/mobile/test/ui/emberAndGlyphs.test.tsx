import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MmChoiceChip } from '../../src/ui/MmChoiceChip';
import { rules, stylesheets } from '../support/stylesheetRules';

/**
 * MM-276: Ember is never a tint and never a background mixed with
 * transparency; a check is the one icon family's glyph, never a font
 * character.
 */
describe('Ember and the glyphs', () => {
  it('no stylesheet mixes Ember into a background', () => {
    const tinted: string[] = [];
    for (const path of stylesheets('src')) {
      for (const rule of rules(readFileSync(path, 'utf8'))) {
        if (/background[^;]*color-mix\([^)]*var\(--ember\)/.test(rule.body)) tinted.push(`${path}: ${rule.selectors.join(', ')}`);
      }
    }
    expect(tinted).toEqual([]);
  });

  it('no stylesheet draws a check as text', () => {
    for (const path of stylesheets('src')) {
      expect(readFileSync(path, 'utf8'), path).not.toMatch(/content:\s*['"]✓['"]/);
    }
  });

  it('a chosen chip carries the icon family’s check', () => {
    const { container, rerender } = render(<MmChoiceChip label="Chest" selected onSelect={() => undefined} />);
    expect(container.querySelector('.mm-chip-check svg')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Chest' })).toHaveAttribute('aria-pressed', 'true');
    rerender(<MmChoiceChip label="Chest" selected={false} onSelect={() => undefined} />);
    expect(container.querySelector('svg')).toBeNull();
  });
});
