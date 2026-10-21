import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { RecoveryCheckIn } from '../../src/domain/RecoveryCheckIn';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { SleepNight } from '../../src/domain/SleepNight';
import type { TargetsRecord } from '../../src/engine/TargetsRecord';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { dashboardLoaded } from '../support/dashboardLoaded';
import { failing } from '../support/failing';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-252: the coach reads the record of nights; MM-251: a sleep disorder is a caution and nothing more. */
const today = CalendarDate.of(2026, 10, 20);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today.addDays(-30) }));
  await repos.weights.saveWeight(today, 82);
  await repos.targets.saveTargets(
    targetsFrom(today.addDays(-3), { mode: 'fatLoss', kcal: 2000, proteinG: 160, carbsG: 200, tdeeKcal: 2600, tdeeSigmaKcal: 300, weeklyRateFraction: -0.0075 }),
  );
});

async function nights(minutes: number, count = 14): Promise<void> {
  for (let i = 0; i < count; i++) {
    await repos.sleep.saveSleepNight(new SleepNight({ date: today.addDays(-i), minutesAsleep: minutes, source: 'typed' }));
  }
}

const history = (): Promise<TargetsRecord[]> => first(repos.targets.watchTargetsHistory());

async function openCoach(): Promise<void> {
  renderApp(repos, today);
  await dashboardLoaded();
  await openTab('Coach');
}

/** The "How you are holding up" section, opened: it is folded to one line unless the check-in is due (MM-256). */
async function holdingUp(): Promise<HTMLElement> {
  const section = (await screen.findByRole('heading', { name: 'How you are holding up' })).closest('.mm-section') as HTMLElement;
  // Judged by the header, not by an answer button: on Coach a due section has none (MM-391).
  const header = within(section).getByRole('button', { name: /^How you are holding up/ });
  if (header.getAttribute('aria-expanded') !== 'true') await userEvent.click(header);
  return section;
}

it('the sleep line: the fourteen-night average in hours and minutes and the nights, no score', async () => {
  await nights(410, 12);
  // Answered yesterday, so the check-in is not due and the folded line carries the sleep figure.
  await repos.recovery.saveRecoveryCheckIn(
    new RecoveryCheckIn({ date: today.addDays(-1), hunger: 4, energy: 4, sleep: 3, training: 4, mood: 4 }),
  );
  await openCoach();
  const section = await holdingUp();
  expect(within(section).getByText(/Sleep 6 h 50 m over 12 nights\.$/)).toBeInTheDocument();
  expect(within(section).getByText('Sleep, last 14 nights')).toBeInTheDocument();
  expect(within(section).getByText('6 h 50 m')).toBeInTheDocument();
  expect(within(section).getByText('12 of 14 nights recorded')).toBeInTheDocument();
  const all = (section.textContent ?? '').toLowerCase();
  for (const word of ['score', 'grade', '%']) expect(all, word).not.toContain(word);
});

it('with no night recorded the line says so', async () => {
  await openCoach();
  const section = await holdingUp();
  expect(within(section).getByText('Not recorded')).toBeInTheDocument();
  expect(within(section).getByText('Nights are typed on Progress or read from your health platform.')).toBeInTheDocument();
});

// The panel's F4: a read that went wrong is never "Not recorded".
it('when the nights cannot be read the line says so', async () => {
  renderApp(repos, today, {
    change: (s) => ({
      ...s,
      sleep: { saveSleepNight: (night) => s.sleep.saveSleepNight(night), watchSleepNights: () => failing() },
    }),
  });
  await dashboardLoaded();
  await openTab('Coach');
  const section = await holdingUp();
  expect(within(section).getByText('Not read')).toBeInTheDocument();
  expect(within(section).queryByText('Not recorded')).not.toBeInTheDocument();
});

it('short sleep alone brings the offer with the sentence and the gentler pace, and nothing changes until it is pressed', async () => {
  await nights(330);
  await openCoach();
  const offer = (await screen.findByText('Two weeks of short sleep')).closest('.mm-notice') as HTMLElement;
  expect(
    within(offer).getByText(
      /Your sleep averaged 5 h 30 m over the last 14 nights\. With short sleep, more of what you lose appears to be lean tissue and hunger runs higher\./,
    ),
  ).toBeInTheDocument();
  const before = await history();
  expect((await repos.setup.loadSetup())?.requestedLossFraction).toBeUndefined();
  await userEvent.click(within(offer).getByRole('button', { name: 'Slow to 0.5% a week' }));
  await expect.poll(async () => (await repos.setup.loadSetup())?.requestedLossFraction).toBe(0.005);
  expect((await repos.setup.loadSetup())?.reliefAnsweredOn).toBe(today);
  // The pace change issues targets at once (MM-128); the sleep alone had issued none.
  await expect.poll(async () => (await history()).length).toBe(before.length + 1);
});

it('six hours and over is no offer', async () => {
  await nights(360);
  await openCoach();
  await screen.findByRole('heading', { name: 'How you are holding up' });
  expect(screen.queryByText('Two weeks of short sleep')).not.toBeInTheDocument();
});

it('a diagnosed sleep disorder is a caution with a clinician pointer, and the targets are what they would be without it', async () => {
  const setup = await repos.setup.loadSetup();
  if (setup === undefined) throw new Error('set up');
  await repos.setup.saveSetup(setup.copyWith({ screening: new ScreeningAnswers({ sleepDisorder: true }) }));
  await openCoach();
  expect(
    await screen.findByText(
      'Sleep disorders change how a deficit works for you; keep your care team in the loop. The app changes none of your numbers for this.',
    ),
  ).toBeInTheDocument();
  const [current] = (await history()).slice(-1);
  expect(current?.targets.kcal).toBe(2000);
  expect(current?.targets.flags.size).toBe(0);
});

// The panel's PD-10: while the check-in is due, the folded line is its call alone.
it('while the check-in is due the folded line does not carry the sleep figure', async () => {
  await nights(410, 12);
  await openCoach();
  const section = (await screen.findByRole('heading', { name: 'How you are holding up' })).closest('.mm-section') as HTMLElement;
  expect(within(section).getByText('This week’s five questions are due.')).toBeInTheDocument();
});