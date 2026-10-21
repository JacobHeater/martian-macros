import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Pause } from '../../src/domain/Pause';
import { RecoveryCheckIn } from '../../src/domain/RecoveryCheckIn';
import { RecoveryQuestion } from '../../src/domain/RecoveryQuestion';
import { SleepNight } from '../../src/domain/SleepNight';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { recoveryQuestionText } from '../../src/format/recoveryQuestionText';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-116: twenty seconds a week on how the user is holding up. Carried over from recovery_check_in_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today.addDays(-30) }),
  );
  await repos.weights.saveWeight(today, 82);
});

const answered = (daysAgo: number, hunger = 3) =>
  new RecoveryCheckIn({ date: today.addDays(-daysAgo), hunger, energy: 2, sleep: 4, training: 3, mood: 5 });

/** The card on the Coach screen. */
async function openCoach(): Promise<HTMLElement> {
  renderApp(repos, today);
  await openTab('Coach');
  const title = await screen.findByRole('heading', { name: 'How you are holding up' });
  const section = title.closest('.mm-section') as HTMLElement;
  // Folded to one line unless the check-in is due (MM-256).
  const header = within(section).getByRole('button', { name: /^How you are holding up/ });
  if (header.getAttribute('aria-expanded') !== 'true') await userEvent.click(header);
  return section;
}

/** The one way into a due check-in on Coach: the one-thing row under the goal (MM-391). */
const oneThing = () => screen.queryByRole('button', { name: /^Answer this week’s five questions/ });

async function answerThisWeek(): Promise<void> {
  await userEvent.click(oneThing() as HTMLElement);
  await screen.findByRole('heading', { name: 'This week' });
}

const stored = () => first(repos.recovery.watchRecoveryCheckIns());

async function pick(question: RecoveryQuestion, value: number): Promise<void> {
  const control = screen.getByRole('group', { name: recoveryQuestionText(question) });
  await userEvent.click(within(control).getByRole('button', { name: `${value}` }));
}

it('answering stores one record and shows the five lines', async () => {
  await openCoach();
  await answerThisWeek();

  const answers: Readonly<Record<RecoveryQuestion, number>> = { hunger: 2, energy: 3, sleep: 1, training: 4, mood: 5 };
  for (const question of RecoveryQuestion.values) await pick(question, answers[question]);
  await userEvent.type(screen.getByRole('textbox', { name: 'Typical hours of sleep, Hours' }), '6');
  await userEvent.type(screen.getByRole('textbox', { name: 'Typical hours of sleep, Minutes' }), '30');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  await expect.poll(async () => (await stored()).length).toBe(1);
  const saved = (await stored())[0];
  expect(saved?.date).toBe(today);
  for (const question of RecoveryQuestion.values) expect(saved?.answer(question)).toBe(answers[question]);
  expect(saved?.sleepHours).toBe(6.5);

  // Back on the Coach screen: a line per question, and no offer this week.
  const after = (await screen.findByText('2 of 5')).closest('.mm-section') as HTMLElement;
  expect(within(after).getByText('Hunger')).toBeInTheDocument();
  expect(within(after).getByText('Mood')).toBeInTheDocument();
  expect(oneThing()).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Skip this week' })).not.toBeInTheDocument();
});

it('it cannot be saved until all five are answered', async () => {
  await openCoach();
  await answerThisWeek();
  for (const question of RecoveryQuestion.values.slice(0, 4)) await pick(question, 3);
  const save = screen.getByRole('button', { name: 'Save' });
  expect(save).toBeDisabled();
  await userEvent.click(save);
  expect(await stored()).toEqual([]);
});

it('skipping stores no answers and is not asked again this week', async () => {
  const card = await openCoach();
  await userEvent.click(within(card).getByRole('button', { name: 'Skip this week' }));
  await expect.poll(() => screen.queryByRole('button', { name: 'Skip this week' })).toBeNull();
  expect(await stored()).toEqual([]);
  expect(oneThing()).not.toBeInTheDocument();
});

it('a skipped week is offered again the week after', async () => {
  await repos.preferences.saveRecoveryCheckInSkippedOn(today.addDays(-7));
  await openCoach();
  expect(oneThing()).toBeInTheDocument();
});

// MM-391: one control opens a due check-in, and what the questions are for is said once.
it('while the check-in is due Coach has one way into it, and says once what it is for', async () => {
  const card = await openCoach();
  expect(screen.getAllByRole('button', { name: /^Answer/ })).toEqual([oneThing()]);
  expect(screen.getAllByText(/the scale cannot see/)).toHaveLength(1);
  // The section keeps its skip.
  expect(within(card).getByRole('button', { name: 'Skip this week' })).toBeInTheDocument();
});

it('with answers on record the due section keeps them and their promise, without a second way in', async () => {
  await repos.recovery.saveRecoveryCheckIn(answered(14));
  const card = await openCoach();
  expect(oneThing()).toBeInTheDocument();
  expect(within(card).getAllByText(/ of 5$/)).toHaveLength(5);
  expect(within(card).getByText(/never to a lower target/)).toBeInTheDocument();
  expect(within(card).queryByRole('button', { name: /^Answer/ })).not.toBeInTheDocument();
});

it('no screen combines the answers into one number or grade', async () => {
  for (let week = 0; week < 3; week++) await repos.recovery.saveRecoveryCheckIn(answered(week * 7 + 1, week + 1));
  const card = await openCoach();
  await within(card).findByText('Hunger');
  const all = (card.textContent ?? '').toLowerCase();
  for (const word of ['score', 'grade', 'overall', 'total', 'average']) expect(all, word).not.toContain(word);
  // One figure per question and nothing that sums them.
  expect(within(card).getAllByText(/ of 5$/)).toHaveLength(5);
});

it('in the first week it can be answered but is not asked for', async () => {
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-3), healthCheckConfirmedOn: today.addDays(-3) }),
  );
  const card = await openCoach();
  expect(within(card).getByRole('button', { name: 'Answer now' })).toBeInTheDocument();
  expect(within(card).queryByRole('button', { name: 'Answer again' })).not.toBeInTheDocument();
  expect(within(card).queryByRole('button', { name: 'Skip this week' })).not.toBeInTheDocument();
});

it('it is not offered during a pause', async () => {
  await repos.pauses.savePause(new Pause({ from: today.addDays(-1), to: today.addDays(5), reason: 'travel' }));
  const card = await openCoach();
  expect(oneThing()).not.toBeInTheDocument();
  expect(within(card).queryByRole('button', { name: 'Skip this week' })).not.toBeInTheDocument();
});

// MM-252: the fourteen-night average fills the typical hours, and can be changed.
it('typical hours are filled from the last fourteen nights recorded, and can be changed', async () => {
  for (let night = 0; night < 14; night++) {
    await repos.sleep.saveSleepNight(new SleepNight({ date: today.addDays(-night), minutesAsleep: 410, source: 'typed' }));
  }
  await openCoach();
  await answerThisWeek();
  const hours = screen.getByRole<HTMLInputElement>('textbox', { name: 'Typical hours of sleep, Hours' });
  const minutes = screen.getByRole<HTMLInputElement>('textbox', { name: 'Typical hours of sleep, Minutes' });
  expect([hours.value, minutes.value]).toEqual(['6', '50']);
  expect(screen.getByText('Your average over the last 14 nights, from 14 recorded. Change it if that is not typical.')).toBeInTheDocument();

  await userEvent.clear(minutes);
  await userEvent.type(minutes, '20');
  for (const question of RecoveryQuestion.values) await pick(question, 3);
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  await expect.poll(async () => (await stored()).length).toBe(1);
  expect((await stored())[0]?.sleepHours).toBeCloseTo(6 + 20 / 60, 6);
});

// MM-252, the panel's F7: a value the app would refuse on Progress is refused here too, not dropped.
it('more than a day of sleep is refused under the field and holds Save', async () => {
  await openCoach();
  await answerThisWeek();
  for (const question of RecoveryQuestion.values) await pick(question, 3);
  const hours = screen.getByRole<HTMLInputElement>('textbox', { name: 'Typical hours of sleep, Hours' });
  await userEvent.type(hours, '25');
  expect(screen.getByText('Up to 24 hours.')).toBeInTheDocument();
  expect(hours).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  await userEvent.clear(hours);
  await userEvent.type(hours, '7');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  await expect.poll(async () => (await stored()).length).toBe(1);
  expect((await stored())[0]?.sleepHours).toBe(7);
});

/** MM-116: a previously regular cycle with no period marked for 46 days. */
async function missedPeriod(sex: 'female' | 'male', goalMode: 'fatLoss' | 'leanGain' = 'fatLoss'): Promise<void> {
  await repos.setup.saveSetup(
    typicalSetup({ sex, goalMode, onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today.addDays(-30) }),
  );
  for (const ago of [104, 75, 46]) {
    for (let d = 0; d < 4; d++) await repos.flowDays.markFlowDay(today.addDays(-ago + d));
  }
}

const periodQuestion = 'No period marked for 46 days. Is that expected?';

async function openCheckIn(): Promise<void> {
  const card = await openCoach();
  await userEvent.click(within(card).getByRole('button', { name: 'Answer this week' }));
  await screen.findByRole('heading', { name: 'This week' });
}

it('a missed period is asked about, and "not sure" on fat loss brings the notice', async () => {
  await missedPeriod('female');
  await openCheckIn();
  const answers = await screen.findByRole('group', { name: periodQuestion });
  for (const label of ['Contraception', 'Pregnancy', 'Menopause']) {
    await userEvent.click(within(answers).getByRole('button', { name: label }));
    expect(screen.queryByText(/^Missed periods can follow/)).not.toBeInTheDocument();
  }
  await userEvent.click(within(answers).getByRole('button', { name: 'Not sure' }));
  expect(screen.getByText(/^Missed periods can follow eating too little/)).toHaveTextContent('This is not a diagnosis.');

  // Optional, and not kept: the check-in saves as ever, with nothing about periods in it.
  for (const question of RecoveryQuestion.values) await pick(question, 3);
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  await expect.poll(async () => (await stored()).length).toBe(1);
});

it('off a deficit goal "not sure" brings no notice', async () => {
  await missedPeriod('female', 'leanGain');
  await openCheckIn();
  const answers = await screen.findByRole('group', { name: periodQuestion });
  await userEvent.click(within(answers).getByRole('button', { name: 'Not sure' }));
  expect(screen.queryByText(/^Missed periods can follow/)).not.toBeInTheDocument();
});

it('a male profile is never asked about periods', async () => {
  await missedPeriod('male');
  await openCheckIn();
  expect(screen.queryByText(/No period marked/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Not sure' })).not.toBeInTheDocument();
});
