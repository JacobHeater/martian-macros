import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HistoryChart } from '../../src/charts/HistoryChart';
import { linePath } from '../../src/charts/linePath';
import { MacroSplitChart } from '../../src/charts/MacroSplitChart';
import { MiniTrend } from '../../src/charts/MiniTrend';
import { TrendChart } from '../../src/charts/TrendChart';
import { TrendSparkline } from '../../src/charts/TrendSparkline';
import { TrendStats } from '../../src/charts/TrendStats';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { IntakeDay } from '../../src/domain/IntakeDay';
import type { WeightTrendPoint } from '../../src/engine/WeightTrendPoint';
import { Fmt } from '../../src/format/Fmt';

/** MM-232: the charts, by what they say and what they draw. */
const today = CalendarDate.of(2026, 10, 10);

describe('the macronutrient split', () => {
  // Carried over from macro_split_chart_test.dart.
  const intake = (proteinG: number, carbsG: number, fatG: number, kcal = 2000) =>
    new IntakeDay({ date: today, kcal, proteinG, carbsG, fatG });
  const sectors = () => [...document.querySelectorAll('.chart-sector')].map((s) => Number(s.getAttribute('data-energy')));
  const item = (text: string) => screen.getByText(text).closest('li');

  it('energy split uses 4/4/9, labels grams and shares', () => {
    render(<MacroSplitChart intake={intake(100, 150, 50)} />);
    expect(sectors()).toEqual([400, 600, 450]);
    expect(item('Protein')).toHaveTextContent('100 g · 27.6%');
    expect(item('Carbs')).toHaveTextContent('150 g · 41.4%');
    expect(item('Fat')).toHaveTextContent('50 g · 31.0%');
    expect(screen.getByText(/1,450 kcal from recorded macros/)).toBeInTheDocument();
    expect(screen.getByText(/Alcohol and other calorie differences/)).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Logged macronutrient energy split. Protein: 100 g · 27.6%. Carbs: 150 g · 41.4%. Fat: 50 g · 31.0%.',
    );
  });

  it('empty macro history does not invent sectors', () => {
    render(<MacroSplitChart intake={intake(0, 0, 0, 500)} />);
    expect(sectors()).toEqual([]);
    expect(screen.getByText('Log food with protein, carbs or fat to see the split.')).toBeInTheDocument();
  });

  it('zero shares have labels but no fake sectors', () => {
    render(<MacroSplitChart intake={intake(50, 0, 0)} />);
    expect(sectors()).toEqual([200]);
    expect(item('Protein')).toHaveTextContent('50 g · 100.0%');
    expect(item('Carbs')).toHaveTextContent('0 g · 0.0%');
    expect(item('Fat')).toHaveTextContent('0 g · 0.0%');
  });

  it('food preview semantics and labels do not imply logged intake', () => {
    render(<MacroSplitChart intake={intake(100, 150, 50)} isPreview />);
    expect(screen.getByRole('img', { name: /Food preview macronutrient energy split/ })).toBeInTheDocument();
    expect(screen.getByText(/1,450 kcal from food macros/)).toBeInTheDocument();
    expect(screen.queryByText(/from recorded macros/)).not.toBeInTheDocument();
  });

  it('empty preview asks for entry rather than logging', () => {
    render(<MacroSplitChart intake={intake(0, 0, 0)} isPreview />);
    expect(sectors()).toEqual([]);
    expect(screen.getByText(/Enter macro amounts to preview/)).toBeInTheDocument();
  });
});

describe('a line', () => {
  it('is broken where there is no record, never dropped to zero', () => {
    expect(linePath([[0, 10], [10, 20], undefined, [30, 5], [40, 6]])).toBe('M0 10L10 20M30 5L40 6');
    expect(linePath([undefined, [5, 5]])).toBe('M5 5');
    expect(linePath([])).toBe('');
  });
});

describe('a history chart', () => {
  const days = (entries: readonly (readonly [number, number])[]) =>
    new Map(entries.map(([daysAgo, value]) => [today.addDays(-daysAgo), value]));

  it('says what it shows: the unit, the span and how many points each line has', () => {
    render(
      <HistoryChart
        today={today}
        days={7}
        unit="kcal"
        series={[
          { label: 'Logged intake', kind: 'energy', values: days([[0, 2100], [2, 1900], [9, 1500]]) },
          { label: 'Target in force', kind: 'target', dashed: true, values: days([[0, 2300], [1, 2300]]) },
        ]}
      />,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'kcal history, Oct 4 to Oct 10. Logged intake: 2 recorded points. Target in force: 2 recorded points',
    );
    // A dot for each recorded day of the solid line, none for the dashed one or the day out of range.
    expect(document.querySelectorAll('.chart-dot').length).toBe(2);
  });

  it('leaves a gap for a day with no record', () => {
    render(
      <HistoryChart
        today={today}
        days={7}
        unit="kcal"
        series={[{ label: 'Logged intake', kind: 'energy', values: days([[0, 2100], [2, 1900], [3, 2000]]) }]}
      />,
    );
    const path = document.querySelector('.chart-energy .chart-line')?.getAttribute('d') ?? '';
    expect(path.match(/M/g)?.length, path).toBe(2);
  });

  it('joins things measured now and then, unless they are too far apart', () => {
    const waist = days([[20, 92], [13, 91.5], [1, 91]]);
    const { rerender } = render(
      <HistoryChart
        today={today}
        days={30}
        unit="cm"
        series={[{ label: 'Recorded waist', kind: 'measurement', connectRecordedPoints: true, values: waist }]}
      />,
    );
    const path = () => document.querySelector('.chart-measurement .chart-line')?.getAttribute('d') ?? '';
    expect(path().match(/M/g)?.length).toBe(1);
    rerender(
      <HistoryChart
        today={today}
        days={30}
        unit="cm"
        series={[
          { label: 'Recorded waist', kind: 'measurement', connectRecordedPoints: true, maximumGapDays: 8, values: waist },
        ]}
      />,
    );
    expect(path().match(/M/g)?.length).toBe(2);
  });

  it('with nothing in range says so and draws nothing', () => {
    render(<HistoryChart today={today} days={7} unit="g" series={[{ label: 'Logged protein', kind: 'protein', values: new Map() }]} />);
    expect(screen.getByText('No records in this range yet.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('the weight trend', () => {
  const trend = (count: number): WeightTrendPoint[] =>
    Array.from({ length: count }, (_, i) => ({
      date: today.addDays(i - count + 1),
      levelKg: 83 - i * 0.1,
      levelSigmaKg: 0.3,
      slopeKgPerDay: -0.1,
      slopeSigmaKgPerDay: 0.02,
    })) as unknown as WeightTrendPoint[];
  const metric = new Fmt('metric');

  it('draws a line, a band, a dot for each weigh-in and a mark for each event in range', () => {
    render(
      <TrendChart
        label="Weight trend over the last 30 days"
        trend={trend(8)}
        weights={[
          { date: today, weightKg: 82.4 },
          { date: today.addDays(-3), weightKg: 82.9 },
          { date: today.addDays(-40), weightKg: 85 },
        ]}
        weightEvents={[
          { date: today.addDays(-2), type: 'illness' },
          { date: today.addDays(-45), type: 'travel' },
        ]}
        today={today}
        rangeDays={30}
        fmt={metric}
      />,
    );
    expect(screen.getByRole('img', { name: 'Weight trend over the last 30 days' })).toBeInTheDocument();
    expect(document.querySelectorAll('.chart-weigh-in').length).toBe(2);
    const events = [...document.querySelectorAll('.chart-event')];
    expect(events.map((e) => e.getAttribute('data-day'))).toEqual(['27']);
    expect(document.querySelector('.chart-band')?.getAttribute('d')).toMatch(/^M.*Z$/);
  });

  it('with no weigh-in in range says so', () => {
    render(<TrendChart label="Weight trend" trend={[]} weights={[]} today={today} rangeDays={30} fmt={metric} />);
    expect(screen.getByText('No weigh-ins in this range.')).toBeInTheDocument();
  });

  // Carried over from charts_test.dart.
  it('a single weigh-in says a trend needs more; several do not', () => {
    const { rerender } = render(<TrendSparkline trend={trend(1)} />);
    expect(screen.getByText('A trend needs more weigh-ins.')).toBeInTheDocument();
    rerender(<TrendSparkline trend={trend(8)} />);
    expect(screen.queryByText('A trend needs more weigh-ins.')).not.toBeInTheDocument();
    expect(document.querySelector('.chart-spark')).toHaveAttribute('aria-hidden', 'true');
  });

  it('states the trend weight, the last week and the whole span, with a dash where there is too little', () => {
    const { rerender } = render(<TrendStats trend={trend(9)} fmt={metric} />);
    const value = (label: string) => screen.getByText(label).nextElementSibling?.textContent;
    expect(value('Trend weight')).toBe('82.2 kg');
    expect(value('Last 7 days')).toBe('−0.7 kg');
    expect(value('Since start')).toBe('−0.8 kg');
    rerender(<TrendStats trend={trend(1)} fmt={metric} />);
    expect(value('Last 7 days')).toBe('—');
    expect(value('Since start')).toBe('—');
  });
});

describe('a small line of a few values', () => {
  it('says what it shows and has a dot for each value', () => {
    render(<MiniTrend values={[3, 4, 2]} min={1} max={5} slots={8} label="Hunger over 3 check-ins: 3, 4, 2" />);
    expect(screen.getByRole('img', { name: 'Hunger over 3 check-ins: 3, 4, 2' })).toBeInTheDocument();
    expect(document.querySelectorAll('.chart-mini-dot').length).toBe(3);
  });
});
