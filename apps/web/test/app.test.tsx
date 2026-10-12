import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App';

/** MM-229: the shell of the app. */
describe('the five destinations', () => {
  it('are in a bottom bar, Dashboard first and current', () => {
    render(<App />);
    const bar = screen.getByRole('navigation', { name: 'Destinations' });
    const places = within(bar).getAllByRole('button');
    expect(places.map((place) => place.textContent)).toEqual(['Dashboard', 'Food', 'Train', 'Progress', 'Coach']);
    expect(places[0]).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Today');
  });

  it('show the chosen one and mark it current in words', async () => {
    render(<App />);
    const bar = screen.getByRole('navigation', { name: 'Destinations' });
    await userEvent.click(within(bar).getByRole('button', { name: 'Progress' }));

    expect(within(bar).getByRole('button', { name: 'Progress' })).toHaveAttribute('aria-current', 'page');
    expect(within(bar).getByRole('button', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Progress');
  });
});

describe('the theme', () => {
  it('is Martian for a new installation', () => {
    render(<App />);
    expect(document.documentElement).toHaveClass('theme-martian');
  });

  it('changes at once when another is chosen in Settings', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Settings');

    await userEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(document.documentElement).toHaveClass('theme-light');
    expect(screen.getByRole('button', { name: 'Light (chosen)' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('navigation', { name: 'Destinations' })).toBeInTheDocument();
  });

  it('follows the phone when System is chosen', () => {
    render(<App initialTheme="system" />);
    // The test phone is set to a light appearance (test/setup.ts).
    expect(document.documentElement).toHaveClass('theme-light');
  });
});
