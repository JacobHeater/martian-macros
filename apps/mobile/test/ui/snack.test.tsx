import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MmOverlays } from '../../src/ui/MmOverlays';
import type { Overlays } from '../../src/ui/Overlays';
import { useOverlays } from '../../src/ui/useOverlays';

/**
 * MM-601 (the owner, 2026-10-24): every snack goes after ten seconds, one
 * with an Undo too, unless it is being read or pointed at. Before then, the
 * action, a dismissal or the back button takes it (MM-272). Every snack,
 * with an action or without, has its own Dismiss (the owner, MM-691).
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
  it('with an action goes after ten seconds, and sooner by a dismissal or the back button', async () => {
    let undone = 0;
    act(() => overlays?.snack('Oats removed.', { label: 'Undo', onAction: () => undone++ }));
    await pass(9_900);
    expect(screen.getByText('Oats removed.')).toBeInTheDocument();
    await pass(200);
    expect(screen.queryByText('Oats removed.'), 'gone after ten seconds').not.toBeInTheDocument();
    expect(undone, 'and nothing undone').toBe(0);

    act(() => overlays?.snack('Oats removed.', { label: 'Undo', onAction: () => undone++ }));
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    act(() => void overlays?.closeTop());
    expect(screen.queryByText('Oats removed.')).not.toBeInTheDocument();
    expect(undone).toBe(0);

    act(() => overlays?.snack('Oats removed.', { label: 'Undo', onAction: () => undone++ }));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Oats removed.')).not.toBeInTheDocument();
  });

  it('with nothing to press goes after ten seconds, and at once by its Dismiss', async () => {
    act(() => overlays?.snack('Saved.'));
    await pass(9_900);
    expect(screen.getByText('Saved.')).toBeInTheDocument();
    await pass(200);
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();

    act(() => overlays?.snack('Saved.'));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Saved.'), 'gone by its Dismiss').not.toBeInTheDocument();
  });

  it('does not go while it is focused or pointed at', async () => {
    act(() => overlays?.snack('Saved.'));
    // Its Dismiss is the focus stop in it; a snack no longer takes focus itself (MM-691).
    const dismiss = screen.getByRole('button', { name: 'Dismiss' });
    act(() => dismiss.focus());
    await pass(20_000);
    expect(screen.getByText('Saved.')).toBeInTheDocument();
    act(() => dismiss.blur());
    await pass(10_100);
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
  });
});
