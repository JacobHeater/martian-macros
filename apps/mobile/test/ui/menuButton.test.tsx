import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MmMenuButton } from '../../src/ui/MmMenuButton';
import { MmOverlays } from '../../src/ui/MmOverlays';

/**
 * MM-268: a menu of actions is drawn by the overlay host at the trigger's
 * anchor, never inside a row or a group that could clip it; it opens with
 * focus on its first item, the arrows move between items, and focus
 * returns to the trigger when it closes.
 */
function Menu({ onSelect = () => undefined }: { onSelect?: (value: string) => void }) {
  return (
    <MmOverlays>
      <div className="mm-swipe">
        <MmMenuButton
          icon="more"
          label="More actions"
          items={[
            { value: 'copy', label: 'Copy to today' },
            { value: 'delete', label: 'Delete' },
          ]}
          onSelect={onSelect}
        />
      </div>
    </MmOverlays>
  );
}

describe('the menu button', () => {
  it('draws its list through the overlay host, outside the row that holds the button', async () => {
    render(<Menu />);
    const trigger = screen.getByRole('button', { name: 'More actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await userEvent.click(trigger);
    const menu = screen.getByRole('menu', { name: 'More actions' });
    expect(menu.closest('.mm-swipe')).toBeNull();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens with focus on its first item, the arrows move, and focus returns to the trigger on close', async () => {
    const chosen: string[] = [];
    render(<Menu onSelect={(value) => chosen.push(value)} />);
    const trigger = screen.getByRole('button', { name: 'More actions' });
    await userEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Copy to today' }));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Delete' }));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Copy to today' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
    expect(chosen).toEqual([]);

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(chosen).toEqual(['delete']);
    expect(document.activeElement).toBe(trigger);
  });

  // MM-565: pressing the button of an open menu reopened it; the press outside closed it, then landed on the button.
  it('a second press on the button closes the menu, and a press outside lands on nothing under it', async () => {
    render(<Menu />);
    const trigger = screen.getByRole('button', { name: 'More actions' });
    await userEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    // The phone's sequence: the finger goes down on the scrim over the button, the click arrives at the button.
    fireEvent.pointerDown(document.querySelector('.mm-menu-scrim')!);
    fireEvent.click(trigger);
    await screen.findByRole('button', { name: 'More actions', expanded: false });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await userEvent.click(trigger);
    await userEvent.click(document.querySelector('.mm-menu-scrim')!);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
