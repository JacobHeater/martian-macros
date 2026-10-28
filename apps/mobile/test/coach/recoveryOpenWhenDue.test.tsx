import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { checkInDueScenario } from '../../src/gallery/screens/checkInDueScenario';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-339, amended by MM-676: every fold starts closed, the check-in's too; MM-391: its way in is the one-thing row. */
it('the recovery section starts closed even when the check-in is due; the one-thing row is the way in', async () => {
  const repos = new InMemoryRepositories();
  const today = CalendarDate.of(2026, 10, 12);
  await checkInDueScenario(repos, today);
  renderApp(repos, today);
  await openTab('Coach');
  expect(await screen.findByText('This week’s five questions are due.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^How you are holding up/ })).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByRole('button', { name: /^Answer this week’s five questions/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Answer this week' })).not.toBeInTheDocument();
});
