import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { analysisFatWeekScenario } from '../../src/gallery/screens/analysisFatWeekScenario';
import { firstMorningScenario } from '../../src/gallery/screens/firstMorningScenario';
import { quietWeekScenario } from '../../src/gallery/screens/quietWeekScenario';
import type { StoryScenario } from '../../src/gallery/screens/StoryScenario';
import { weightLossMedicationScenario } from '../../src/gallery/screens/weightLossMedicationScenario';
import { Fmt } from '../../src/format/Fmt';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-610: "What your data says" on the Coach tab, from the app's own cells:
 * under the one thing to do and above the targets, opening on today, with
 * the spans the data supports, the lists, the numbers behind each finding,
 * the hidden ones, and the areas a span cannot judge.
 */
const today = CalendarDate.of(2026, 10, 24);

async function onCoach(scenario: StoryScenario, then?: (repos: InMemoryRepositories) => Promise<void>) {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await scenario(repos, today);
  await then?.(repos);
  renderApp(repos, today);
  await openTab('Coach');
  return repos;
}

/** The section, once it has drawn. */
const section = async () => within(await screen.findByRole('region', { name: 'What your data says' }, { timeout: 5000 }));

async function choose(label: string) {
  const s = await section();
  await userEvent.click(await s.findByRole('button', { name: label }));
}

describe("the owner's fat week on the tab", () => {
  it('"Worth changing" lists the fat and protein finding first, with peanut butter, its share and a trade; the headline pairs a strength with it', async () => {
    await onCoach(analysisFatWeekScenario());
    await choose('2w');
    const s = await section();
    const titles = (await s.findAllByRole('heading', { level: 4 })).map((h) => h.textContent);
    expect(titles[0]).toBe('Fat averaged 90 g against 70 g');
    expect(s.getByText(/^Fat averaged 90 g against 70 g; Peanut butter supplied 22% of it\./)).toBeInTheDocument();
    expect(s.getByText(/Peanut butter on \d+ of \d+ days: .* Trading it on those days would have meant about \d+ g less fat a day/)).toBeInTheDocument();
    expect(s.getByText(/^[A-Z][a-z]+( [a-z0-9]+)* (is|are) holding up; worth changing: fat averaged 90 g against 70 g\.$/)).toBeInTheDocument();
    expect(s.getByText('Worth changing')).toBeInTheDocument();
    expect(s.getByText('Holding up')).toBeInTheDocument();
  });

  it('sits under the one thing to do and above "Your targets"', async () => {
    await onCoach(analysisFatWeekScenario());
    const region = await screen.findByRole('region', { name: 'What your data says' }, { timeout: 5000 });
    const targets = screen.getByRole('region', { name: 'Your targets' });
    expect(region.compareDocumentPosition(targets) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('opens on today', () => {
  it('a person whose first entry was this morning sees 1d for today, and no switcher', async () => {
    await onCoach(firstMorningScenario);
    const s = await section();
    expect(await s.findByText('Today so far')).toBeInTheDocument();
    expect(s.queryByRole('group', { name: 'Days read' })).not.toBeInTheDocument();
    expect(s.queryByRole('button', { name: '7d' })).not.toBeInTheDocument();
  });

  it('a span chosen is put back to 1d when the tab is opened again', async () => {
    await onCoach(analysisFatWeekScenario());
    await choose('2w');
    expect(await (await section()).findByText('14 days through yesterday · 14 fully logged')).toBeInTheDocument();
    await openTab('Food');
    await openTab('Coach');
    expect(await (await section()).findByText('Today so far')).toBeInTheDocument();
  });
});

describe('spans appear with data', () => {
  it('14 days logged in full offer 1d, 7d and 2w, not 1m or 3m', async () => {
    await onCoach(analysisFatWeekScenario());
    const s = await section();
    expect(await s.findByRole('button', { name: '7d' })).toBeInTheDocument();
    expect(s.getByRole('button', { name: '2w' })).toBeInTheDocument();
    expect(s.queryByRole('button', { name: '1m' })).not.toBeInTheDocument();
    expect(s.queryByRole('button', { name: '3m' })).not.toBeInTheDocument();
  });
});

describe("a span's analysis", () => {
  it('7d reads the last 7 days through yesterday, and the period line says how many were fully logged', async () => {
    await onCoach(analysisFatWeekScenario());
    await choose('7d');
    const s = await section();
    expect(await s.findByText('7 days through yesterday · 7 fully logged')).toBeInTheDocument();
    expect(s.getByText('Worth changing')).toBeInTheDocument();
  });
});

describe('areas a span cannot judge', () => {
  it('7d chosen and training logged for 1 week: "Not enough data in this span" lists training with "needs 4 weeks"', async () => {
    await onCoach(quietWeekScenario({ trained: true }));
    await choose('7d');
    const s = await section();
    expect(await s.findByText('Not enough data in this span')).toBeInTheDocument();
    expect(s.getByText('Training · needs 4 weeks')).toBeInTheDocument();
  });

  it('nothing found: it says so, with the areas checked', async () => {
    await onCoach(quietWeekScenario());
    await choose('7d');
    expect(await (await section()).findByText('Nothing stands out. Checked: food.')).toBeInTheDocument();
  });

  it('nothing logged today yet: the 1d analysis asks for a food', async () => {
    await onCoach(quietWeekScenario());
    expect(await (await section()).findByText('Log a food and the coach reads it here.')).toBeInTheDocument();
  });
});

describe('numbers behind it', () => {
  it('shows the span, the days counted and left out, each figure against its reference, and the rule', async () => {
    await onCoach(analysisFatWeekScenario());
    await choose('2w');
    const s = await section();
    const [numbers] = await s.findAllByRole('button', { name: /^The numbers behind this/ });
    if (numbers === undefined) throw new Error('No numbers to open.');
    await userEvent.click(numbers);
    expect(await s.findByText('14 days through Oct 23')).toBeInTheDocument();
    expect(s.getByText('Days counted')).toBeInTheDocument();
    expect(s.getByText('Average fat')).toBeInTheDocument();
    expect(s.getByText('Fat target')).toBeInTheDocument();
    expect(s.getByText('Rule')).toBeInTheDocument();
    expect(s.getByText('Fat against your target')).toBeInTheDocument();
  });
});

describe('dismissed but visible', () => {
  it('a finding dismissed 10 days ago: the fold says "1 hidden" with the date it shows again', async () => {
    await onCoach(analysisFatWeekScenario(), (repos) => repos.trendLog.dismissFinding('fatAgainstTarget:level', today.addDays(-10)));
    await choose('2w');
    const s = await section();
    expect(await s.findByText(`1 hidden · shows again ${Fmt.shortDay(today.addDays(18))}`)).toBeInTheDocument();
    expect(s.queryByText('Fat averaged 90 g against 70 g')).not.toBeInTheDocument();
  });

  it('dismissing one hides it at once, and counts it', async () => {
    await onCoach(analysisFatWeekScenario());
    await choose('2w');
    const s = await section();
    await userEvent.click(await s.findByRole('button', { name: 'Dismiss: Fat averaged 90 g against 70 g' }));
    expect(await s.findByText(`1 hidden · shows again ${Fmt.shortDay(today.addDays(28))}`)).toBeInTheDocument();
  });
});

describe('safeguards', () => {
  it('hidden weight: no weight figure appears in any finding or its numbers', async () => {
    await onCoach(analysisFatWeekScenario({ weightDisplay: 'hidden' }));
    await choose('2w');
    const s = await section();
    await s.findByText('Worth changing');
    for (const numbers of s.getAllByRole('button', { name: /^The numbers behind this/ })) await userEvent.click(numbers);
    const region = screen.getByRole('region', { name: 'What your data says' });
    expect(region.textContent).not.toMatch(/\d\s?(kg|lb)\b/);
  });

  it('under-eating: the section opens by pointing to the notice', async () => {
    await onCoach(weightLossMedicationScenario());
    const s = await section();
    expect(await s.findByText(/^Start with “About your logged days” at the top/)).toBeInTheDocument();
  });

  it('an eating-disorder history: the protein minimum only, naming no food and offering no trade', async () => {
    await onCoach(analysisFatWeekScenario({ eatingDisorderHistory: true }));
    await choose('2w');
    const s = await section();
    const titles = (await s.findAllByRole('heading', { level: 4 })).map((h) => h.textContent ?? '');
    expect(titles.every((t) => t.startsWith('Protein'))).toBe(true);
    expect(s.queryByText(/Peanut butter/)).not.toBeInTheDocument();
    expect(s.queryByText(/Trading it/)).not.toBeInTheDocument();
  });
});

describe('words', () => {
  it('every finding on the tab passes the banned-word test, including the new words', async () => {
    await onCoach(analysisFatWeekScenario({ busy: true }));
    await choose('2w');
    const s = await section();
    await s.findByText('Worth changing');
    const text = screen.getByRole('region', { name: 'What your data says' }).textContent ?? '';
    for (const word of ['too much', 'unhealthy', 'fattening', 'empty calories', 'burn rate', 'should', 'avoid', 'good', 'bad']) {
      expect(text).not.toMatch(new RegExp(`\\b${word}\\b`, 'i'));
    }
  });
});
