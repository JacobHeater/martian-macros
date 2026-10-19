import { act, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { useAsync } from '../../src/app/useAsync';

/** MM-408: with `keep`, the last answer stays while a newer question is pending; without it, the answer empties. */
const pending = new Map<string, (value: string) => void>();
const ask = (key: string) => new Promise<string>((resolve) => pending.set(key, resolve));
const answer = (key: string, value: string) => act(async () => pending.get(key)?.(value));

const Shown = ({ question, keep = false }: { question: string; keep?: boolean }) => (
  <output>{useAsync(() => ask(question), question, { keep }) ?? '(nothing)'}</output>
);

it('without keep, a new question empties the answer until its own arrives', async () => {
  const { rerender } = render(<Shown question="a" />);
  await answer('a', 'A');
  expect(screen.getByRole('status')).toHaveTextContent('A');
  rerender(<Shown question="b" />);
  expect(screen.getByRole('status')).toHaveTextContent('(nothing)');
  await answer('b', 'B');
  expect(screen.getByRole('status')).toHaveTextContent('B');
});

it('with keep, the last answer stays until the new one arrives, and a late answer to an old question is dropped', async () => {
  const { rerender } = render(<Shown question="a" keep />);
  await answer('a', 'A');
  rerender(<Shown question="b" keep />);
  expect(screen.getByRole('status')).toHaveTextContent('A');
  rerender(<Shown question="c" keep />);
  await answer('b', 'B');
  expect(screen.getByRole('status')).toHaveTextContent('A');
  await answer('c', 'C');
  expect(screen.getByRole('status')).toHaveTextContent('C');
});
