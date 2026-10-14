import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Pause } from '../../src/domain/Pause';
import { RecoveryCheckIn } from '../../src/domain/RecoveryCheckIn';
import { RecoveryQuestion } from '../../src/domain/RecoveryQuestion';
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
  if (within(section).queryByRole('button', { name: /^Answer/ }) === null) {
    await userEvent.click(within(section).getByRole('button', { name: /^How you are holding up/ }));
  }
  return section;
}

const stored = () => first(repos.recovery.watchRecoveryCheckIns());

async function pick(question: RecoveryQuestion, value: number): Promise<void> {
  const control = screen.getByRole('group', { name: recoveryQuestionText(question) });
  await userEvent.click(within(control).getByRole('button', { name: `${value}` }));
}

it('answering stores one record and shows the five lines', async () => {
  const card = await openCoach();
  await userEvent.click(within(card).getByRole('button', { name: 'Answer this week' }));
  await screen.findByRole('heading', { name: 'This week' });

  const answers: Readonly<Record<RecoveryQuestion, number>> = { hunger: 2, energy: 3, sleep: 1, training: 4, mood: 5 };
  for (const question of RecoveryQuestion.values) await pick(question, answers[question]);
  await userEvent.type(screen.getByRole('textbox', { name: 'Typical hours of sleep' }), '6.5');
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
  expect(screen.queryByRole('button', { name: 'Answer this week' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Skip this week' })).not.toBeInTheDocument();
});

it('it cannot be saved until all five are answered', async () => {
  const card = await openCoach();
  await userEvent.click(within(card).getByRole('button', { name: 'Answer this week' }));
  await screen.findByRole('heading', { name: 'This week' });
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
  expect(screen.queryByRole('button', { name: 'Answer this week' })).not.toBeInTheDocument();
});

it('a skipped week is offered again the week after', async () => {
  await repos.preferences.saveRecoveryCheckInSkippedOn(today.addDays(-7));
  const card = await openCoach();
  expect(within(card).getByRole('button', { name: 'Answer this week' })).toBeInTheDocument();
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
  expect(within(card).queryByRole('button', { name: 'Answer this week' })).not.toBeInTheDocument();
  expect(within(card).queryByRole('button', { name: 'Skip this week' })).not.toBeInTheDocument();
});
