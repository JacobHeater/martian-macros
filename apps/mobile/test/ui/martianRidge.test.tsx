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

  // MM-581: on a long page the ridge sat right under the last row, and the alien's tap area (8 px around it) reached
  // over that row, so a tap on the alien could press it.
  it('MM-581: clear ground above the ridge keeps the alien’s tap area off the row above', () => {
    const css = readFileSync('src/ui/ui.css', 'utf8');
    const ridge = /\.theme-martian \.mm-ridge \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    const clearance = Number(/border-top: (\d+)px solid transparent;/.exec(ridge)?.[1] ?? 0);
    expect(ridge).toMatch(/box-sizing: content-box;/);
    // The highest point of the tap area: the pit's top, the alien's top in it, less the area's reach.
    const pitTop = Number(/\.mm-ridge-pit \{[^}]*inset: (-?\d+)px/.exec(css)?.[1]);
    const alienTop = Number(/\.mm-ridge-alien \{[^}]*top: (\d+)px/.exec(css)?.[1]);
    const reach = Number(/\.mm-ridge-alien::before \{[^}]*inset: -(\d+)px/.exec(css)?.[1]);
    expect(clearance + pitTop + alienTop - reach).toBeGreaterThanOrEqual(16);
  });

  // MM-580: the flight ended fully drawn and was held there (`forwards`) until the alien came back, so scrolling up
  // found the UFO parked in the page.
  it('MM-580: the UFO has faded out by the end of its flight, so it is never left in the page', () => {
    const css = readFileSync('src/ui/ui.css', 'utf8');
    const flight = /@keyframes mm-ufo-leave \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    const last = /100% \{([^}]*)\}/.exec(flight)?.[1] ?? '';
    expect(last).toMatch(/opacity: 0;/);
    expect(css).toMatch(/animation: mm-ufo-leave var\(--motion-abduct\) ease-in forwards;/);
  });
});
