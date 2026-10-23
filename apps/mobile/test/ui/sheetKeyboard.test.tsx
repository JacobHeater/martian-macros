import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { MmOverlays } from '../../src/ui/MmOverlays';
import type { Overlays } from '../../src/ui/Overlays';
import { useOverlays } from '../../src/ui/useOverlays';

/**
 * MM-566: searching with no results let the keyboard cover the add-food
 * sheet, and the sheet shrank and grew with its results. A tall sheet keeps
 * one height, and every sheet stands in what the keyboard leaves in sight.
 */
function Asker({ ask }: { ask: (overlays: Overlays) => Promise<unknown> }) {
  const overlays = useOverlays();
  return (
    <button type="button" onClick={() => void ask(overlays)}>
      Ask
    </button>
  );
}

async function open(size?: 'fit' | 'tall') {
  render(
    <MmOverlays>
      <Asker ask={(overlays) => overlays.sheet('Add food', () => <p>Nothing found.</p>, size === undefined ? undefined : { size })} />
    </MmOverlays>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
  return screen.findByRole('dialog', { name: 'Add food' });
}

/** A visual viewport the test moves, as the phone's keyboard does. */
class FakeViewport extends EventTarget {
  height = window.innerHeight;
  offsetTop = 0;
}

const real = Object.getOwnPropertyDescriptor(window, 'visualViewport');
afterEach(() => {
  if (real === undefined) Reflect.deleteProperty(window, 'visualViewport');
  else Object.defineProperty(window, 'visualViewport', real);
});

describe('a sheet', () => {
  it('keeps one height when tall', async () => {
    expect((await open('tall')).classList.contains('mm-sheet-tall')).toBe(true);
  });

  it('fits its content by default', async () => {
    expect((await open()).classList.contains('mm-sheet-tall')).toBe(false);
  });

  it('stands above the keyboard: what the keyboard hides is kept clear under it', async () => {
    const view = new FakeViewport();
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: view });
    const sheet = await open('tall');
    const scrim = sheet.parentElement as HTMLElement;
    expect(scrim.style.paddingBottom).toBe('');
    act(() => {
      view.height = window.innerHeight - 300;
      view.dispatchEvent(new Event('resize'));
    });
    expect(scrim.style.paddingBottom).toBe('300px');
    act(() => {
      view.height = window.innerHeight;
      view.dispatchEvent(new Event('resize'));
    });
    expect(scrim.style.paddingBottom).toBe('');
  });
});
