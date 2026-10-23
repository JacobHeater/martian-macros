import { act, fireEvent, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MartianRidge } from '../../src/ui/MartianRidge';

/**
 * MM-577: tap the ridge's alien and a UFO takes it up and off the page;
 * five seconds later it is back. The ridge stays decoration, never spoken.
 */
describe('the Martian ridge', () => {
  afterEach(() => vi.useRealTimers());

  it('sends the alien away on a tap and brings it back five seconds later', () => {
    vi.useFakeTimers();
    const { container } = render(<MartianRidge />);
    const ridge = container.querySelector('.mm-ridge') as HTMLElement;
    expect(ridge.dataset['away']).toBe('false');
    fireEvent.click(container.querySelector('.mm-ridge-alien') as HTMLElement);
    expect(ridge.dataset['away']).toBe('true');
    act(() => vi.advanceTimersByTime(4999));
    expect(ridge.dataset['away']).toBe('true');
    act(() => vi.advanceTimersByTime(1));
    expect(ridge.dataset['away']).toBe('false');
  });

  it('is hidden from assistive technology', () => {
    const { container } = render(<MartianRidge />);
    expect(container.querySelector('.mm-ridge')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('ends every page body', () => {
    for (const path of ['src/app/Screen.tsx', 'src/app/HomeShell.tsx', 'src/onboarding/OnboardingScreen.tsx']) {
      expect(readFileSync(path, 'utf8'), path).toMatch(/<MartianRidge \/>\n\s*<\/main>/);
    }
  });

  it('meets the navigation bar: the Martian body keeps no padding under it', () => {
    const css = readFileSync('src/app/app.css', 'utf8');
    expect(css).toMatch(/\.theme-martian \.app-body \{\n  padding-bottom: 0;/);
    expect(css).toMatch(/\.app-body > \.mm-ridge \{\n  margin: auto calc\(-1 \* var\(--space-16\)\) 0;/);
  });

  it('clips the ducked alien at the ridge, so the page cannot scroll past it', () => {
    const { container } = render(<MartianRidge />);
    expect(container.querySelector('.mm-ridge-pit > .mm-ridge-alien')).not.toBeNull();
    const pit = /\.mm-ridge-pit \{([^}]*)\}/.exec(readFileSync('src/ui/ui.css', 'utf8'))?.[1] ?? '';
    expect(pit).toMatch(/overflow: hidden/);
    expect(pit).toMatch(/inset: -16px 0 0;/);
  });

  it('flies the UFO for a motion token, so it stops under reduced motion', () => {
    const css = readFileSync('src/ui/ui.css', 'utf8');
    expect(css).toMatch(/animation: mm-ufo-leave var\(--motion-abduct\)/);
    expect(readFileSync('src/theme/tokens.css', 'utf8')).toMatch(/--motion-abduct: 0ms;/);
  });
});
