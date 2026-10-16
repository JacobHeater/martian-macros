import { render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MmProgressBar } from '../../src/ui/MmProgressBar';

/** MM-327: with reduced motion the water bar takes its level at once, never blinking empty first. */
const original = window.matchMedia;
afterEach(() => {
  window.matchMedia = original;
});

it('with reduced motion, the water bar is at its level on its first paint', () => {
  window.matchMedia = vi.fn((query: string) => ({ ...original(query), matches: query === '(prefers-reduced-motion: reduce)' }));
  const { container } = render(<MmProgressBar kind="water" value={0.5} />);
  expect((container.querySelector('.mm-progress-fill') as HTMLElement).style.width).toBe('50%');
});

it('without it, the water bar is painted empty first and then pours', async () => {
  const { container } = render(<MmProgressBar kind="water" value={0.5} />);
  const fill = container.querySelector('.mm-progress-fill') as HTMLElement;
  expect(fill.style.width).toBe('0%');
  await expect.poll(() => fill.style.width).toBe('50%');
});
