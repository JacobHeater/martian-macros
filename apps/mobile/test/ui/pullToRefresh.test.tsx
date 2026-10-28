import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MmPullToRefresh } from '../../src/ui/MmPullToRefresh';
import { usePullToRefresh } from '../../src/ui/usePullToRefresh';

/**
 * MM-670: a pull down from the top of a body follows the finger, is ready
 * past 72 px (the finger moves twice that), and let go there refreshes;
 * let go sooner it springs back. Up, sideways, scrolled down or with nothing
 * to refresh, nothing starts.
 */
function Body({ onRefresh }: { onRefresh: (() => Promise<unknown>) | undefined }) {
  const body = useRef<HTMLDivElement>(null);
  const pull = usePullToRefresh(body, onRefresh);
  return (
    <div ref={body} data-testid="body" {...pull.handlers}>
      <MmPullToRefresh pull={pull.state} />
      <p>rows</p>
    </div>
  );
}

const down = (body: HTMLElement, y: number) => fireEvent.pointerDown(body, { clientX: 100, clientY: y, pointerId: 1 });
const move = (body: HTMLElement, y: number, x = 100) => fireEvent.pointerMove(body, { clientX: x, clientY: y, pointerId: 1 });
const up = (body: HTMLElement, y: number) => fireEvent.pointerUp(body, { clientX: 100, clientY: y, pointerId: 1 });
// Idle, the strip is no live region (nothing to say), so it is found by its class; pulled, its words are a status.
const strip = () => screen.getByTestId('body').querySelector('.mm-pull') as HTMLElement;
const status = () => strip().querySelector('.mm-pull-words') as HTMLElement;

describe('a pull to refresh', () => {
  it('follows the finger, is ready past 72 px, and let go there refreshes, drawn down while it runs', async () => {
    let finish!: () => void;
    const onRefresh = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    render(<Body onRefresh={onRefresh} />);
    const body = screen.getByTestId('body');
    down(body, 100);
    move(body, 200);
    expect(status()).toHaveTextContent('Pull to refresh');
    expect(strip().dataset['phase']).toBe('pulling');
    expect(strip().dataset['distance']).toBe('50');
    move(body, 300);
    expect(status()).toHaveTextContent('Let go to refresh');
    expect(strip().dataset['phase']).toBe('ready');
    up(body, 300);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(status()).toHaveTextContent('Refreshing…');
    expect(status()).toHaveAttribute('role', 'status');
    expect(strip().dataset['distance']).toBe('56');
    finish();
    await waitFor(() => expect(strip().dataset['phase']).toBe('idle'), { timeout: 2000 });
    expect(status()).toHaveTextContent('');
    expect(status()).not.toHaveAttribute('role');
    expect(strip().dataset['distance']).toBe('0');
  });

  it('let go short of 72 px springs back without refreshing', () => {
    const onRefresh = vi.fn(async () => undefined);
    render(<Body onRefresh={onRefresh} />);
    const body = screen.getByTestId('body');
    down(body, 100);
    move(body, 200);
    up(body, 200);
    expect(onRefresh).not.toHaveBeenCalled();
    expect(strip().dataset['phase']).toBe('idle');
  });

  it('up, sideways, scrolled down or with nothing to refresh, nothing starts', () => {
    const onRefresh = vi.fn(async () => undefined);
    const { rerender } = render(<Body onRefresh={onRefresh} />);
    const body = screen.getByTestId('body');
    down(body, 300);
    move(body, 100);
    expect(strip().dataset['phase']).toBe('idle');
    down(body, 100);
    move(body, 130, 300);
    move(body, 400, 300);
    expect(strip().dataset['phase']).toBe('idle');
    up(body, 400);
    expect(onRefresh).not.toHaveBeenCalled();
    body.scrollTop = 40;
    down(body, 100);
    move(body, 300);
    expect(strip().dataset['phase']).toBe('idle');
    up(body, 300);
    body.scrollTop = 0;
    rerender(<Body onRefresh={undefined} />);
    down(body, 100);
    move(body, 300);
    expect(strip().dataset['phase']).toBe('idle');
    up(body, 300);
    expect(onRefresh).not.toHaveBeenCalled();
  });
});
