import { readFileSync } from 'node:fs';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { evidenceText } from '../../src/app/evidenceText';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/** MM-143: the app explains where its numbers come from. Carried over from how_this_works_test.dart. */
const today = CalendarDate.of(2026, 10, 5);

it('what the app is built with is docs/evidence.md itself', () => {
  expect(evidenceText).toBe(readFileSync('../../docs/evidence.md', 'utf8'));
});

it('a question shows its answer, the grade in words, then the source', async () => {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
  renderApp(repos, today);
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('button', { name: /^How this works/ }));
  await userEvent.click(await within(topLayer()).findByRole('button', { name: /^How are my calories set\?/ }));

  const question = within(topLayer());
  expect(await question.findByRole('heading', { name: 'The rules behind this' })).toBeInTheDocument();
  expect(
    question.getAllByText(/Well established|Reasonably supported|Early evidence|Our judgement/).length,
  ).toBeGreaterThan(0);
  expect(question.queryByText(/^Source:/)).not.toBeInTheDocument();
  const rules = topLayer().querySelectorAll<HTMLElement>('.mm-pressable');
  await userEvent.click(rules[0] as HTMLElement);
  expect(question.getAllByText(/^Source:/)).toHaveLength(1);
});
