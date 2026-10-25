import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { analysisFatWeekScenario } from '../../src/gallery/screens/analysisFatWeekScenario';
import { firstMorningScenario } from '../../src/gallery/screens/firstMorningScenario';
import { nothingLoggedScenario } from '../../src/gallery/screens/nothingLoggedScenario';
import { quietWeekScenario } from '../../src/gallery/screens/quietWeekScenario';
import type { StoryScenario } from '../../src/gallery/screens/StoryScenario';
import { weightLossMedicationScenario } from '../../src/gallery/screens/weightLossMedicationScenario';
import { Fmt } from '../../src/format/Fmt';
import { openTab } from '../support/openTab';
import { coachBannedWords } from '../support/coachBannedWords';
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
/** MM-617's headline for the fat week over 2w: the top fix, and the food that did it. */
const headline = /^Fat averaged 90 g against 70 g\. (Peanut butter did it|That was peanut butter|Peanut butter put you there)\.$/;

const section = async () => within(await screen.findByRole('region', { name: 'What your data says' }, { timeout: 5000 }));

async function choose(label: string) {
  const s = await section();
  await userEvent.click(await s.findByRole('button', { name: label }));
}

describe("the owner's fat week on the tab", () => {
  it('"Worth changing" lists the fat and protein finding first, with peanut butter, its share and a trade; the headline is the verdict (MM-617)', async () => {
    await onCoach(analysisFatWeekScenario());
    await choose('2w');
    const s = await section();
    const titles = (await s.findAllByRole('heading', { level: 4 })).map((h) => h.textContent);
    expect(titles[0]).toBe('Fat averaged 90 g against 70 g');
    expect(s.getByText(/^Fat (averaged 90 g against 70 g|90 g a day, against 70 g)\. Peanut butter (gave|was) 22% of it\./)).toBeInTheDocument();
    expect(s.getByText(/Peanut butter(,| on) \d+ of \d+ days: .* (Swap it for|Have) .+[Aa]bout \d+ g less fat a day/)).toBeInTheDocument();
    expect(s.getByText(headline)).toBeInTheDocument();
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
    expect(s.queryByRole('group', { name: 'Days shown' })).not.toBeInTheDocument();
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

  it('nothing logged today yet, with history: it says so, points to 7d, and shows what is left at the full targets', async () => {
    await onCoach(quietWeekScenario());
    const s = await section();
    expect(await s.findByText('Nothing logged today yet. 7d reads the last week.')).toBeInTheDocument();
    expect(s.getByRole('heading', { level: 3, name: '150 g protein and 2,400 kcal left' })).toBeInTheDocument();
    expect(s.queryByText('Log a food and the coach reads it here.')).not.toBeInTheDocument();
  });

  it('nothing ever logged: the section asks for a food', async () => {
    await onCoach(nothingLoggedScenario);
    const s = await section();
    expect(await s.findByText('Log a food and the coach reads it here.')).toBeInTheDocument();
    expect(s.queryByText(/^Nothing logged today yet/)).not.toBeInTheDocument();
  });
});

describe('numbers behind it', () => {
  it('shows the span, the days counted and left out, each figure against its reference, and the rule', async () => {
    await onCoach(analysisFatWeekScenario());
    await choose('2w');
    const s = await section();
    const numbers = await s.findByRole('button', { name: 'The numbers behind this: Fat averaged 90 g against 70 g' });
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
    await userEvent.click(await s.findByRole('button', { name: '1 finding hidden' }));
    expect(s.getByText(`shows again ${Fmt.shortDay(today.addDays(18))}`)).toBeInTheDocument();
    expect(s.queryByRole('heading', { name: 'Fat averaged 90 g against 70 g' })).not.toBeInTheDocument();
  });

  it('dismissing one hides it at once, and counts it', async () => {
    await onCoach(analysisFatWeekScenario());
    await choose('2w');
    const s = await section();
    await userEvent.click(await s.findByRole('button', { name: 'Dismiss: Fat averaged 90 g against 70 g' }));
    expect(await s.findByRole('button', { name: '1 finding hidden' })).toBeInTheDocument();
    await userEvent.click(s.getByRole('button', { name: '1 finding hidden' }));
    expect(s.getByText(`shows again ${Fmt.shortDay(today.addDays(28))}`)).toBeInTheDocument();
  });

  it('dismissing says until when, with no undo, and puts the focus on the next finding’s title', async () => {
    await onCoach(analysisFatWeekScenario());
    await choose('2w');
    const s = await section();
    await userEvent.click(await s.findByRole('button', { name: 'Dismiss: Fat averaged 90 g against 70 g' }));
    expect(await screen.findByText(`Hidden until ${Fmt.shortDay(today.addDays(28))}`)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Undo/ })).not.toBeInTheDocument();
    await waitFor(() => {
      const focused = document.activeElement;
      expect(focused?.tagName).toBe('H4');
      expect(focused?.textContent).not.toBe('Fat averaged 90 g against 70 g');
    });
  });
});

describe('safeguards', () => {
  it('hidden weight: no weight figure appears in any finding or its numbers', async () => {
    await onCoach(analysisFatWeekScenario({ weightDisplay: 'hidden' }));
    await choose('2w');
    const s = await section();
    await s.findByText('Worth changing');
    for (const numbers of s.getAllByRole('button', { name: /^The numbers behind this: / })) await userEvent.click(numbers);
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
    expect(s.queryByText(/Trading /)).not.toBeInTheDocument();
    expect(s.queryByText(/Swap it for|instead, which you log|Skip it/)).not.toBeInTheDocument();
  });
});

describe('the review fixes (MM-610, 2026-10-24)', () => {
  it('the switcher sits under "Days shown", the period line is said again on a change, and the headline follows it', async () => {
    await onCoach(analysisFatWeekScenario());
    const s = await section();
    expect(await s.findByRole('group', { name: 'Days shown' })).toBeInTheDocument();
    await choose('2w');
    const period = await s.findByText('14 days through yesterday · 14 fully logged');
    expect(period).toHaveAttribute('aria-live', 'polite');
    expect(period.nextElementSibling).toBe(s.getByText(headline));
  });

  it('each finding is marked as worth changing or holding up, in words a screen reader says', async () => {
    await onCoach(analysisFatWeekScenario());
    await choose('2w');
    const s = await section();
    expect((await s.findAllByRole('img', { name: 'Worth changing' })).length).toBeGreaterThan(0);
    expect(s.getAllByRole('img', { name: 'Holding up' }).length).toBeGreaterThan(0);
  });

  it('the list labels are headings above their findings, and 1d’s "what is left" is a heading of its own', async () => {
    await onCoach(analysisFatWeekScenario());
    const s = await section();
    expect(await s.findByRole('heading', { level: 3, name: /left/ })).toBeInTheDocument();
    await choose('2w');
    expect(await s.findByRole('heading', { level: 3, name: 'Worth changing' })).toBeInTheDocument();
  });

  it('"N more from your data" keeps fixes and strengths apart, under the same labels', async () => {
    await onCoach(analysisFatWeekScenario({ busy: true }));
    await choose('2w');
    const s = await section();
    await userEvent.click(await s.findByRole('button', { name: /more from your data$/ }));
    const labels = s.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    // More is worth changing than the three listed, so the fold has its own "Worth changing" group under the list's.
    expect(labels.filter((label) => label === 'Worth changing')).toHaveLength(2);
  });
});

describe('words', () => {
  it('every finding on the tab passes the banned-word test, including the new words', async () => {
    await onCoach(analysisFatWeekScenario({ busy: true }));
    await choose('2w');
    const s = await section();
    await s.findByText('Worth changing');
    const text = screen.getByRole('region', { name: 'What your data says' }).textContent ?? '';
    // The coach's list (MM-617): verdicts on choices are its voice; profanity and words about the person never are.
    expect(coachBannedWords.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)).toEqual([]);
  });
});
