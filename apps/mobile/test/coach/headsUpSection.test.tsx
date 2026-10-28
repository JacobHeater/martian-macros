import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { HeadsUpSection } from '../../src/coach/HeadsUpSection';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { cautionMessage } from '../../src/format/cautionMessage';
import { targetFlagMessage } from '../../src/format/targetFlagMessage';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { dashboardLoaded } from '../support/dashboardLoaded';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { declarationsOf } from '../support/stylesheetRules';
import { targetsFrom } from '../support/targetsFrom';
import type { TargetFlag } from '../../src/engine/TargetFlag';

/**
 * MM-553 (owner, 2026-10-22): Coach's cautions and target flags are one
 * "Heads up" section under the hero, folded by default to its count, the
 * caution's icon and colour on the folded line; opened, each note in full.
 */
describe('the Heads up section', () => {
  it('is folded by default to its count, with the caution mark', () => {
    render(<HeadsUpSection notes={['First note.', 'Second note.', 'Third note.']} />);
    const toggle = screen.getByRole('button', { name: /^Heads up/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('3 notes about your targets')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Heads up' })).toHaveClass('mm-section-caution');
    expect(screen.queryByText('First note.')).not.toBeInTheDocument();
  });

  it('opened, says each note in full, in the order given', async () => {
    render(<HeadsUpSection notes={['First note.', 'Second note.']} />);
    await userEvent.click(screen.getByRole('button', { name: /^Heads up/ }));
    const region = screen.getByRole('region', { name: 'Heads up' });
    const notes = [...region.querySelectorAll('.mm-section-body p')].map((p) => p.textContent);
    expect(notes).toEqual(['First note.', 'Second note.']);
  });

  it('counts one note as one', () => {
    render(<HeadsUpSection notes={['Only note.']} />);
    expect(screen.getByText('1 note about your targets')).toBeInTheDocument();
  });

  it('with no notes draws nothing', () => {
    const view = render(<HeadsUpSection notes={[]} />);
    expect(view.container).toBeEmptyDOMElement();
  });

  it('keeps the caution colour on its icon', () => {
    expect(declarationsOf('src/ui/ui.css', '.mm-section-caution .mm-section-icon')).toMatch(/color: var\(--caution\)/);
  });
});

describe('on Coach', () => {
  const today = CalendarDate.of(2026, 10, 20);
  let repos: InMemoryRepositories;

  async function seed({ screening, flags }: { screening?: ScreeningAnswers; flags?: ReadonlySet<TargetFlag> }): Promise<void> {
    await repos.setup.saveSetup(
      typicalSetup({ onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today.addDays(-30), ...(screening === undefined ? {} : { screening }) }),
    );
    await repos.weights.saveWeight(today, 82);
    await repos.targets.saveTargets(
      targetsFrom(today.addDays(-3), {
        mode: 'fatLoss',
        kcal: 2000,
        proteinG: 160,
        carbsG: 200,
        tdeeKcal: 2600,
        tdeeSigmaKcal: 300,
        weeklyRateFraction: -0.0075,
        ...(flags === undefined ? {} : { flags }),
      }),
    );
    renderApp(repos, today);
    await dashboardLoaded();
    await openTab('Coach');
  }

  beforeEach(async () => {
    repos = new InMemoryRepositories();
    await repos.preferences.saveThemePreference('martian');
  });

  it('holds the cautions, then the target flags, folded under the targets; opening says each in full', async () => {
    await seed({ screening: new ScreeningAnswers({ sleepDisorder: true }), flags: new Set<TargetFlag>(['rateLimited']) });
    const toggle = await screen.findByRole('button', { name: /^Heads up/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveTextContent('2 notes about your targets');
    expect(screen.queryByText(cautionMessage('sleepDisorder'))).not.toBeInTheDocument();
    expect(screen.queryByText(targetFlagMessage('rateLimited'))).not.toBeInTheDocument();

    const section = toggle.closest('.mm-section') as HTMLElement;
    const hero = document.querySelector('.app-layer:not([hidden]) .mm-hero') as HTMLElement;
    // MM-676: under the targets it is about, after the goal; the hero still above it.
    const targets = screen.getByRole('heading', { name: 'Your targets' });
    const follows = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    expect(follows(hero, section)).toBe(true);
    expect(follows(targets, section)).toBe(true);

    await userEvent.click(toggle);
    const notes = [...section.querySelectorAll('.mm-section-body p')].map((p) => p.textContent);
    expect(notes).toEqual([cautionMessage('sleepDisorder'), targetFlagMessage('rateLimited')]);
    expect(within(section).getByText(cautionMessage('sleepDisorder'))).toBeVisible();
  });

  it('stays as it was left for the session, across tabs', async () => {
    await seed({ screening: new ScreeningAnswers({ sleepDisorder: true }) });
    await userEvent.click(await screen.findByRole('button', { name: /^Heads up/ }));
    await openTab('Dashboard');
    await openTab('Coach');
    expect(await screen.findByRole('button', { name: /^Heads up/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('with no caution and no flag, there is no Heads up section', async () => {
    await seed({});
    await screen.findByRole('heading', { name: 'Goal' });
    expect(screen.queryByRole('button', { name: /^Heads up/ })).not.toBeInTheDocument();
  });
});
