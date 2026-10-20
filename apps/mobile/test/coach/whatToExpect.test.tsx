import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { Fmt } from '../../src/format/Fmt';
import { whatToExpectClosing } from '../../src/format/whatToExpectClosing';
import { whatToExpectPoints } from '../../src/format/whatToExpectPoints';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-158: what the first month will actually look like, every figure the person's own, no promises. */
const today = CalendarDate.of(2026, 10, 5);
const imperial = new Fmt('imperial');
const metric = new Fmt('metric');
const lb = 0.45359237;

describe('the points', () => {
  it('fat loss at Standard for a 200 lb person: the aim as a range of about 1 to 2 lb a week, and the first week explained', () => {
    const points = whatToExpectPoints({ goal: 'fatLoss', paceFraction: 0.0075, weightKg: 200 * lb, sex: 'male', fmt: imperial });
    expect(points[0]).toBe('Your plan aims for about 1.0 to 2.0 lb a week.');
    expect(points[1]).toBe('The first week often shows more. That extra is water, and it does not keep coming.');
    expect(points.some((p) => p.includes('creatine'))).toBe(true);
    expect(points).toHaveLength(5);
  });

  it('their own noise: a 60 kg person is told a smaller day-to-day figure than a 110 kg person', () => {
    const figure = (weightKg: number) =>
      whatToExpectPoints({ goal: 'fatLoss', paceFraction: 0.0075, weightKg, sex: 'male', fmt: metric }).find((p) => p.startsWith('Day to day'));
    expect(figure(110)).toContain('1 to 2 kg');
    expect(figure(60)).toContain('1 to 2 kg');
    const sigma = (kg: number) => 0.006 * kg;
    expect(sigma(60)).toBeLessThan(sigma(110));
    expect(whatToExpectPoints({ goal: 'fatLoss', paceFraction: 0.0075, weightKg: 60, sex: 'male', fmt: imperial }).find((p) => p.startsWith('Day to day'))).toContain('1 to 2 lb');
    expect(whatToExpectPoints({ goal: 'fatLoss', paceFraction: 0.0075, weightKg: 110, sex: 'male', fmt: imperial }).find((p) => p.startsWith('Day to day'))).toContain('1 to 3 lb');
  });

  it('recomp: the scale is meant to stay flat, waist and strength, the eight-week review', () => {
    const points = whatToExpectPoints({ goal: 'recomp', paceFraction: 0, weightKg: 80, sex: 'male', fmt: metric });
    expect(points[0]).toContain('meant to stay roughly flat');
    expect(points.join(' ')).toContain('waist and your strength');
    expect(points.join(' ')).toContain('eight weeks');
  });

  it('every version says targets hold for two weeks and the first change will be small', () => {
    for (const goal of ['fatLoss', 'leanGain', 'recomp', 'maintenance'] as const) {
      const points = whatToExpectPoints({ goal, paceFraction: 0.005, weightKg: 80, sex: 'female', menstruates: true, fmt: metric });
      expect(points.join(' '), goal).toContain('For 14 days your targets stay put');
      expect(points.join(' '), goal).toContain('will be small');
      expect(points.length, goal).toBeLessThanOrEqual(6);
    }
  });

  it('no promises: no amount of fat or muscle by a date, and the closing line says so', () => {
    for (const goal of ['fatLoss', 'leanGain', 'recomp', 'maintenance'] as const) {
      const all = whatToExpectPoints({ goal, paceFraction: 0.005, weightKg: 80, sex: 'male', fmt: metric }).join(' ').toLowerCase();
      for (const word of ['you will lose', 'you will gain', 'by week', 'by day 30', 'guarantee', 'promise']) expect(all, goal).not.toContain(word);
    }
    expect(whatToExpectClosing).toBe('These are the plan’s aims, not promises. Bodies vary, and the coach adjusts to yours.');
  });

  it('the point about periods is for a female profile who menstruates, never a male one', () => {
    const female = whatToExpectPoints({ goal: 'fatLoss', paceFraction: 0.0075, weightKg: 70, sex: 'female', menstruates: true, fmt: metric });
    expect(female.join(' ')).toContain('around your period');
    const male = whatToExpectPoints({ goal: 'fatLoss', paceFraction: 0.0075, weightKg: 70, sex: 'male', fmt: metric });
    expect(male.join(' ')).not.toContain('period');
    const after = whatToExpectPoints({ goal: 'fatLoss', paceFraction: 0.0075, weightKg: 70, sex: 'female', menstruates: false, fmt: metric });
    expect(after.join(' ')).not.toContain('period');
  });
});

describe('on the Coach tab', () => {
  let repos: InMemoryRepositories;
  beforeEach(async () => {
    repos = new InMemoryRepositories();
    await repos.preferences.saveThemePreference('martian');
  });

  it('the same screen can be reread after onboarding, from the goal and pace in force', async () => {
    await repos.setup.saveSetup(typicalSetup({ sex: 'female', onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today, screening: new ScreeningAnswers() }));
    await repos.weights.saveWeight(today, 70);
    await repos.targets.saveTargets(targetsFrom(today.addDays(-3), { kcal: 1900, tdeeKcal: 2400, weeklyRateFraction: -0.005 }));
    renderApp(repos, today);
    await openTab('Coach');
    await userEvent.click(await screen.findByRole('button', { name: /^What to expect/ }));
    expect(await screen.findByRole('heading', { name: 'What to expect' })).toBeInTheDocument();
    expect(screen.getByText(/^Your plan aims for about/)).toBeInTheDocument();
    expect(screen.getByText(/around your period/)).toBeInTheDocument();
    expect(screen.getByText(whatToExpectClosing)).toBeInTheDocument();
  });
});
