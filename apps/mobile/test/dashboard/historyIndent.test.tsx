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

it('MM-583: the charts and the header chevrons end at the column’s right edge', () => {
  for (const chart of ['HistoryChart', 'TrendChart', 'WaistChart']) {
    const source = readFileSync(`src/charts/${chart}.tsx`, 'utf8');
    expect(source, chart).toMatch(/className="chart-grid" x1=\{left\} x2=\{width\}/);
  }
  const css = rules(readFileSync('src/ui/ui.css', 'utf8'));
  for (const selector of ['.mm-section-head-body > .mm-section-opens', '.mm-section-head-body > .mm-disclosure-chevron']) {
    const body = css.filter((rule) => rule.selectors.includes(selector)).map((rule) => rule.body).join(';');
    expect(body, selector).toMatch(/margin-inline-end:\s*-\d+px/);
  }
});

// MM-583: the flush rule once matched every body inside, so History's own sections lost their indent: the weight chart
// hung off the screen's edge and the Logging rows slid under their icon.
it('MM-583: only a flush section’s own body is unindented', () => {
  const css = rules(readFileSync('src/ui/ui.css', 'utf8'));
  const padded = css.filter((rule) => /padding-left:\s*0/.test(rule.body)).flatMap((rule) => rule.selectors);
  expect(padded).toContain('.mm-section-flush > .mm-section-body');
  expect(padded).not.toContain('.mm-section-flush .mm-section-body');
});
