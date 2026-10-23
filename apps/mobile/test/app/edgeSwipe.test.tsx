import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { NavigatorHost } from '../../src/app/NavigatorHost';
import type { Navigator } from '../../src/app/Navigator';
import { useNavigator } from '../../src/app/useNavigator';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { MmOverlays } from '../../src/ui/MmOverlays';
import { renderApp } from '../support/renderApp';

/**
 * MM-578: a swipe in from a side of the screen goes back on a pushed screen,
 * and between the destinations at home. jsdom's window is 1024 wide.
 */
const right = window.innerWidth - 4;

function swipe(element: Element, from: number, to: number, { drift = 0 } = {}) {
  fireEvent.pointerDown(element, { clientX: from, clientY: 300, pointerId: 1 });
  fireEvent.pointerMove(element, { clientX: from + (to - from) / 2, clientY: 300 + drift / 2, pointerId: 1 });
  fireEvent.pointerMove(element, { clientX: to, clientY: 300 + drift, pointerId: 1 });
  fireEvent.pointerUp(element, { clientX: to, clientY: 300 + drift, pointerId: 1 });
}

describe('on a pushed screen', () => {
  function Probe({ seen }: { seen: { navigator?: Navigator } }) {
    seen.navigator = useNavigator();
    return <p>home</p>;
  }

  async function pushed() {
    const seen: { navigator?: Navigator } = {};
    render(
      <MmOverlays>
        <NavigatorHost>
          <Probe seen={seen} />
        </NavigatorHost>
      </MmOverlays>,
    );
    void seen.navigator!.push(() => (
      <div>
        <p>the pushed screen</p>
        <input type="range" aria-label="A slider" />
      </div>
    ));
    return screen.findByText('the pushed screen');
  }

  it('a swipe in from the left past a third of the width goes back', async () => {
    swipe(await pushed(), 4, 500);
    await waitFor(() => expect(screen.queryByText('the pushed screen')).toBeNull());
    expect(screen.getByText('home')).toBeInTheDocument();
  });

  it('a swipe in from the right goes back too', async () => {
    swipe(await pushed(), right, right - 500);
    await waitFor(() => expect(screen.queryByText('the pushed screen')).toBeNull());
  });

  it('a short swipe springs back and the screen stays', async () => {
    const text = await pushed();
    swipe(text, 4, 40);
    expect(screen.getByText('the pushed screen')).toBeInTheDocument();
    expect(text.closest('.app-layer')).toHaveAttribute('data-edge-swipe', 'settling');
  });

  it('a swipe that starts away from a side, or turns into a scroll, does nothing', async () => {
    const text = await pushed();
    swipe(text, 200, 800);
    swipe(text, 4, 60, { drift: 400 });
    expect(screen.getByText('the pushed screen')).toBeInTheDocument();
  });

  it('a control that drags sideways keeps its drag at the edge', async () => {
    await pushed();
    swipe(screen.getByRole('slider', { name: 'A slider' }), 4, 500);
    expect(screen.getByText('the pushed screen')).toBeInTheDocument();
  });
});

describe('at home', () => {
  const today = CalendarDate.of(2026, 10, 13);
  let repos: InMemoryRepositories;

  beforeEach(async () => {
    repos = new InMemoryRepositories();
    await repos.preferences.saveThemePreference('martian');
    await new DemoSeed(today).replace(repos);
  });

  const current = async () => {
    const bar = await screen.findByRole('navigation', { name: 'Destinations' });
    return bar.querySelector('[aria-current="page"]')?.textContent;
  };
  const page = () => document.querySelector('.app-body')!;

  it('a swipe in from the right goes to the next destination, from the left to the one before', async () => {
    renderApp(repos, today);
    expect(await current()).toContain('Dashboard');
    swipe(page(), right, right - 500);
    await waitFor(async () => expect(await current()).toContain('Food'));
    swipe(page(), right, right - 500);
    await waitFor(async () => expect(await current()).toContain('Train'));
    swipe(page(), 4, 500);
    await waitFor(async () => expect(await current()).toContain('Food'));
  });

  it('nothing goes before Dashboard', async () => {
    renderApp(repos, today);
    expect(await current()).toContain('Dashboard');
    swipe(page(), 4, 500);
    expect(await current()).toContain('Dashboard');
    expect(page()).not.toHaveAttribute('data-edge-swipe');
  });
});
