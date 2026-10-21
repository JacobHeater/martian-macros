import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { HealthProfile } from '../../src/domain/integration/HealthProfile';
import { InMemoryHealthProfile } from '../../src/fixtures/InMemoryHealthProfile';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { renderApp } from '../support/renderApp';

/** MM-69: on an iPhone, onboarding's first answers can be filled in from Apple Health, and are still confirmed. */
const today = CalendarDate.of(2026, 10, 10);

async function begin({
  platform = 'ios',
  health = new InMemoryHealthProfile(),
}: { platform?: 'ios' | 'android'; health?: InMemoryHealthProfile } = {}) {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  renderApp(repos, today, {
    change: (services) => ({ ...services, platform, ...(platform === 'ios' ? { healthProfile: health } : {}) }),
  });
  await userEvent.click(await screen.findByRole('button', { name: 'Begin' }));
  return health;
}

const holding = (profile: Partial<HealthProfile>) => new InMemoryHealthProfile({ profile });
const next = () => screen.getByRole('button', { name: 'Next' });
const fill = () => userEvent.click(screen.getByRole('button', { name: 'Fill in from Apple Health' }));
const card = (name: 'Female' | 'Male') => screen.getByRole('button', { name });

describe('pre-filling sex', () => {
  it('Apple Health reporting female selects Female, and the person still presses Next past it', async () => {
    const health = await begin({ health: holding({ sex: 'female' }) });
    expect(health.asked, 'nothing is read before the person asks').toBe(0);
    await fill();
    expect(await screen.findByText(/Filled in from Apple Health where it had an answer/)).toBeInTheDocument();
    expect(health.asked).toBe(1);
    expect(card('Female')).toHaveAttribute('aria-pressed', 'true');
    expect(card('Male')).toHaveAttribute('aria-pressed', 'false');
    // Still the first step: nothing moves on by itself.
    expect(screen.getByRole('heading', { name: 'Biological sex' })).toBeInTheDocument();
    expect(next()).toBeEnabled();
  });

  it('other or not set selects nothing, and the step cannot be skipped', async () => {
    // HealthKit's other and not set reach the app as no sex at all.
    await begin({ health: holding({}) });
    await fill();
    expect(await screen.findByText(/Apple Health had nothing to fill in/)).toBeInTheDocument();
    expect(card('Female')).toHaveAttribute('aria-pressed', 'false');
    expect(card('Male')).toHaveAttribute('aria-pressed', 'false');
    expect(next()).toBeDisabled();
    expect(screen.getByText(/Settings, Health, Data Access & Devices/)).toBeInTheDocument();
  });

  it('a failed read says so, and fills nothing', async () => {
    await begin({ health: new InMemoryHealthProfile({ profile: { sex: 'male' }, unreadable: true }) });
    await fill();
    expect(await screen.findByText(/Apple Health could not be read just now/)).toBeInTheDocument();
    expect(card('Male')).toHaveAttribute('aria-pressed', 'false');
    expect(next()).toBeDisabled();
  });
});

it('the date of birth and the height are filled in on their steps, each still confirmed', async () => {
  await begin({ health: holding({ sex: 'male', birthDate: CalendarDate.of(1990, 4, 12), heightCm: 180.3 }) });
  await fill();
  expect(await screen.findByText(/Filled in from Apple Health/)).toBeInTheDocument();
  await userEvent.click(next());
  expect(screen.getByRole('button', { name: /April 12, 1990/ })).toBeInTheDocument();
  expect(next()).toBeEnabled();
  await userEvent.click(next());
  // 180.3 cm is 71 inches: 5 ft 11 in.
  expect(screen.getByRole('textbox', { name: 'Feet' })).toHaveValue('5');
  expect(screen.getByRole('textbox', { name: 'Inches' })).toHaveValue('11');
  expect(next(), 'the weight is still to be typed').toBeDisabled();
});

it('a height Apple Health holds outside what onboarding takes is not filled in', async () => {
  await begin({ health: holding({ heightCm: 40 }) });
  await fill();
  expect(await screen.findByText(/Apple Health had nothing to fill in/)).toBeInTheDocument();
});

it('an Android phone is not offered Apple Health', async () => {
  await begin({ platform: 'android' });
  expect(screen.queryByRole('button', { name: 'Fill in from Apple Health' })).not.toBeInTheDocument();
});
