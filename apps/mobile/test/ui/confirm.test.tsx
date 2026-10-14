import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { MmOverlays } from '../../src/ui/MmOverlays';
import { useOverlays } from '../../src/ui/useOverlays';

/**
 * MM-280: the destructive action is the quiet button and Cancel the
 * stronger one, in every confirmation, through the one dialog.
 */
function Erase() {
  const overlays = useOverlays();
  useEffect(() => {
    void overlays.confirm({ title: 'Erase everything?', message: 'This cannot be undone.', confirmLabel: 'Erase' });
  }, [overlays]);
  return null;
}

describe('a confirmation', () => {
  it('draws Erase quiet in the danger colour and Cancel as the stronger button', async () => {
    render(
      <MmOverlays>
        <Erase />
      </MmOverlays>,
    );
    const dialog = await screen.findByRole('dialog', { name: 'Erase everything?' });
    const erase = within(dialog).getByRole('button', { name: 'Erase' });
    expect(erase).toHaveClass('mm-button-destructive');
    expect(erase).not.toHaveClass('mm-button-primary');
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveClass('mm-button-secondary');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
