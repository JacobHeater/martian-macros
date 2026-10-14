import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MmOverlays } from '../../src/ui/MmOverlays';
import type { Overlays } from '../../src/ui/Overlays';
import { useOverlays } from '../../src/ui/useOverlays';

/**
 * MM-272: a snack carrying an action waits for it; one without goes after
 * four seconds, unless it is being read or pointed at.
 */
let overlays: Overlays | undefined;

function Grab() {
  overlays = useOverlays();
  return null;
}

beforeEach(() => {
  vi.useFakeTimers();
  render(
    <MmOverlays>
      <Grab />
    </MmOverlays>,
  );
});

afterEach(() => {
  vi.useRealTimers();
  overlays = undefined;
});

const pass = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('a snack', () => {
  it('with an action stays until the action, a dismissal or the back button', async () => {
    let undone = 0;
    act(() => overlays?.snack('Oats removed.', { label: 'Undo', onAction: () => undone++ }));
    await pass(10_000);
    expect(screen.getByText('Oats removed.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    act(() => void overlays?.closeTop());
    expect(screen.queryByText('Oats removed.')).not.toBeInTheDocument();
    expect(undone).toBe(0);

    act(() => overlays?.snack('Oats removed.', { label: 'Undo', onAction: () => undone++ }));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Oats removed.')).not.toBeInTheDocument();
  });

  it('with nothing to press goes after four seconds', async () => {
    act(() => overlays?.snack('Saved.'));
    await pass(3_900);
    expect(screen.getByText('Saved.')).toBeInTheDocument();
    await pass(200);
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
  });

  it('does not go while it is focused or pointed at', async () => {
    act(() => overlays?.snack('Saved.'));
    const snack = screen.getByText('Saved.').parentElement as HTMLElement;
    act(() => snack.focus());
    await pass(10_000);
    expect(screen.getByText('Saved.')).toBeInTheDocument();
    act(() => snack.blur());
    await pass(4_100);
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
  });
});
