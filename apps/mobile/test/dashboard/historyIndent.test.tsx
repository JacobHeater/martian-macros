import { readFileSync } from 'node:fs';
import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openDashboardHistory } from '../support/dashboardLoaded';
import { renderApp } from '../support/renderApp';
import { rules } from '../support/stylesheetRules';

const today = CalendarDate.of(2026, 10, 10);

// MM-583: History indented its sections under its title, and each section indented its chart again, so the charts
// stood 72 px in. History is flush: its sections start at the screen's edge, as "Days shown" does.
it('MM-583: the History sections start at the edge, not under its title', async () => {
  const repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
  renderApp(repos, today);
  await openDashboardHistory();
  const intake = await screen.findByText('Intake', { selector: '.mm-section-title' });
  const history = intake.closest('.mm-section')?.parentElement?.closest('.mm-section');
  expect(history?.classList.contains('mm-section-flush')).toBe(true);
});

it('MM-583: nothing in a flush body is pulled back under the icon', () => {
  const css = rules(readFileSync('src/ui/ui.css', 'utf8'));
  for (const child of ['.mm-list-group', '.mm-surface']) {
    const selector = `.mm-section-flush > .mm-section-body > ${child}`;
    const body = css.filter((rule) => rule.selectors.includes(selector)).map((rule) => rule.body).join(';');
    expect(body, selector).toMatch(/margin-left:\s*0/);
  }
});
