import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useDebounced } from '../../src/app/useDebounced';

/** MM-408: a value held still for the pause is the one work is done on; the first one at once. */
const Shown = ({ value }: { value: string }) => <output>{useDebounced(value, 150)}</output>;

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

it('gives the first value at once, and a changed one only after it has held still for the pause', () => {
  const { rerender } = render(<Shown value="c" />);
  expect(screen.getByRole('status')).toHaveTextContent('c');
  rerender(<Shown value="ch" />);
  rerender(<Shown value="chi" />);
  act(() => vi.advanceTimersByTime(100));
  expect(screen.getByRole('status')).toHaveTextContent('c');
  rerender(<Shown value="chic" />);
  act(() => vi.advanceTimersByTime(100));
  // 200 ms since "ch", but only 100 ms since the last change.
  expect(screen.getByRole('status')).toHaveTextContent('c');
  act(() => vi.advanceTimersByTime(50));
  expect(screen.getByRole('status')).toHaveTextContent('chic');
});
