import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { MmSection } from '../../src/ui/MmSection';

/**
 * MM-399: a section that folds put its heading inside its button, which
 * HTML does not allow and which hides the heading from heading navigation.
 * The APG accordion puts the button inside the heading, as a section that
 * opens a screen already does (MM-335).
 */
it('a section that folds is a heading holding its button, which says whether it is open', () => {
  render(
    <MmSection icon="settings" title="Reminders" collapsible initiallyExpanded={false}>
      <p>Rows</p>
    </MmSection>,
  );
  const heading = screen.getByRole('heading', { level: 2, name: /^Reminders/ });
  const button = within(heading).getByRole('button', { name: /^Reminders/ });
  expect(button).toHaveAttribute('aria-expanded', 'false');
  expect(button.querySelector('h1, h2, h3, h4, h5, h6'), 'no heading inside the button').toBeNull();
});
