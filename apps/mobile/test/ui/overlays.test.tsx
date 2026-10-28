import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { EditHeightSheet } from '../../src/settings/EditHeightSheet';
import { MmOverlays } from '../../src/ui/MmOverlays';
import type { Overlays } from '../../src/ui/Overlays';
import { useOverlays } from '../../src/ui/useOverlays';

/**
 * MM-271: an overlay keeps the keyboard inside it, closes on Escape from
 * anywhere, and always has a visible way out; the app beneath it is inert.
 */
function Asker({ ask }: { ask: (overlays: Overlays) => Promise<unknown> }) {
  const overlays = useOverlays();
  const [answer, setAnswer] = useState('not asked');
  return (
    <>
      <button type="button" onClick={() => void ask(overlays).then((a) => setAnswer(JSON.stringify(a) ?? 'nothing'))}>
        Ask
      </button>
      <output>{answer}</output>
    </>
  );
}

async function asking(ask: (overlays: Overlays) => Promise<unknown>) {
  const view = render(
    <MmOverlays>
      <Asker ask={ask} />
    </MmOverlays>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
  return { dialog: await screen.findByRole('dialog'), root: view.container.querySelector('.mm-app-root') as HTMLElement };
}

const question = { title: 'Keep these targets?', message: 'They may come down.', primaryLabel: 'Keep', primary: 1, secondaryLabel: 'Change', secondary: 2 };

describe('an overlay', () => {
  it('makes the app beneath it inert while it is up', async () => {
    const { dialog, root } = await asking((o) => o.choice(question));
    expect(root).toHaveAttribute('inert');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Keep' }));
    expect(root).not.toHaveAttribute('inert');
  });

  it('keeps Tab inside: from its last control Tab lands on its first, and Shift+Tab the other way', async () => {
    const { dialog } = await asking((o) => o.choice(question));
    const [change, keep] = within(dialog).getAllByRole('button');
    expect(document.activeElement).toBe(change);
    keep!.focus();
    fireEvent.keyDown(keep!, { key: 'Tab' });
    expect(document.activeElement).toBe(change);
    fireEvent.keyDown(change!, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(keep);
  });

  it('closes on Escape from any control inside it', async () => {
    const { dialog } = await asking((o) => o.choice(question));
    within(dialog).getByRole('button', { name: 'Keep' }).focus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('nothing')).toBeInTheDocument();
  });

  it('the options dialog has a Cancel that answers nothing', async () => {
    const { dialog } = await asking((o) => o.options({ title: 'Rest', options: [{ value: 60, label: '1:00' }], selected: 60 }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('nothing')).toBeInTheDocument();
  });

  it('a sheet has a visible Close, and its handle drags it away', async () => {
    const { dialog } = await asking((o) => o.sheet('Height', () => <p>Inside</p>));
    expect(within(dialog).getByText('Inside')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
    const sheet = await screen.findByRole('dialog');
    const grip = sheet.querySelector('.mm-sheet-grip') as HTMLElement;
    fireEvent.pointerDown(grip, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(grip, { clientY: 160, pointerId: 1 });
    // MM-675: moved on the compositor, by a 3D transform set on the element itself.
    expect(sheet.style.transform).toBe('translate3d(0, 60px, 0)');
    expect(sheet.classList.contains('mm-sheet-dragging')).toBe(true);
    fireEvent.pointerUp(grip, { clientY: 200, pointerId: 1 });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // MM-675: a drag down and back up, let go, replayed the sheet's rise-in from nothing: a flash read as a reload.
  it('a sheet dragged and let go short springs back in place, the same sheet, and never rises in again', async () => {
    await asking((o) => o.sheet('Height', () => <p>Inside</p>));
    const sheet = await screen.findByRole('dialog');
    const grip = sheet.querySelector('.mm-sheet-grip') as HTMLElement;
    fireEvent.pointerDown(grip, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(grip, { clientY: 160, pointerId: 1 });
    fireEvent.pointerMove(grip, { clientY: 110, pointerId: 1 });
    fireEvent.pointerUp(grip, { clientY: 110, pointerId: 1 });
    expect(screen.getByRole('dialog')).toBe(sheet);
    expect(sheet.classList.contains('mm-sheet-dragging')).toBe(false);
    expect(sheet.classList.contains('mm-sheet-risen')).toBe(true);
    expect(sheet.style.transform).toBe('');
    expect(within(sheet).getByText('Inside')).toBeInTheDocument();
  });
});

describe('the height sheet', () => {
  it('says the allowed range as a helper, as an error when the value is outside it, and has Cancel', async () => {
    let cancelled = 0;
    render(<EditHeightSheet initialCm={180} imperial={false} onSave={() => undefined} onCancel={() => cancelled++} />);
    expect(screen.getByRole('textbox', { name: 'Centimetres' })).toHaveAccessibleDescription('Between 100 and 250 cm.');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    const field = screen.getByRole('textbox', { name: 'Centimetres' });
    await userEvent.clear(field);
    await userEvent.type(field, '300');
    expect(screen.getByRole('alert')).toHaveTextContent('Between 100 and 250 cm.');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(cancelled).toBe(1);
  });
});
