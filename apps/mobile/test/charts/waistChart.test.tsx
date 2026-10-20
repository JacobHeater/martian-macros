import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WaistChart } from '../../src/charts/WaistChart';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { WaistObservation } from '../../src/domain/WaistObservation';
import { Fmt } from '../../src/format/Fmt';

/** MM-155: the waist over time in the trend chart's language: dots, a smoothed line, a noise band. */
const today = CalendarDate.of(2026, 10, 20);
const metric = new Fmt('metric');

const weekly = (cms: readonly number[], { single = -1 }: { single?: number } = {}) =>
  cms.map((cm, i) => {
    const daysAgo = 7 * (cms.length - 1 - i);
    return new WaistObservation({ date: today.addDays(-daysAgo), waistCm: cm, readings: i === single ? [cm] : [cm - 0.5, cm, cm + 0.5] });
  });

const draw = (waist: readonly WaistObservation[], rangeDays = 90) =>
  render(<WaistChart waist={waist} today={today} rangeDays={rangeDays} fmt={metric} label="Waist over the last 90 days." />);

describe('the waist chart', () => {
  it('draws one dot per measurement in range, a line through the middles and a band of the noise', () => {
    draw(weekly([93, 92.5, 92.6, 92.2, 91.0, 90.4, 90.0]));
    const chart = screen.getByRole('img', { name: 'Waist over the last 90 days.' });
    expect(chart.querySelectorAll('.chart-waist-entry')).toHaveLength(7);
    expect(chart.querySelector('.chart-line')?.getAttribute('d')).toMatch(/^M.*L/);
    expect(chart.querySelector('.chart-waist-band')?.getAttribute('d')).toMatch(/Z$/);
    // Dots are days of the range: the latest is today, day 89.
    expect([...chart.querySelectorAll('.chart-waist-entry')].map((dot) => dot.getAttribute('data-day'))).toEqual(['47', '54', '61', '68', '75', '82', '89']);
  });

  it('over a year shows the measurements ninety days leaves out', () => {
    const waist = weekly(Array.from({ length: 30 }, (_, i) => 94 - i * 0.1));
    draw(waist, 90);
    expect(screen.getByRole('img').querySelectorAll('.chart-waist-entry')).toHaveLength(13);
    draw(waist, 365);
    expect(screen.getAllByRole('img')[1]?.querySelectorAll('.chart-waist-entry')).toHaveLength(30);
  });

  it('under three measurements there are dots alone: no middle of three to draw a line through', () => {
    draw(weekly([92]));
    const one = screen.getByRole('img');
    expect(one.querySelectorAll('.chart-waist-entry')).toHaveLength(1);
    expect(one.querySelector('.chart-waist-band')).toBeNull();
    expect(one.querySelector('.chart-line')).toBeNull();
    draw(weekly([92, 93]));
    const two = screen.getAllByRole('img')[1] as HTMLElement;
    expect(two.querySelectorAll('.chart-waist-entry')).toHaveLength(2);
    expect(two.querySelector('.chart-line')).toBeNull();
    expect(two.querySelector('.chart-waist-band')).toBeNull();
    draw(weekly([92, 93, 92.5]));
    expect((screen.getAllByRole('img')[2] as HTMLElement).querySelector('.chart-line')).not.toBeNull();
  });

  it('none in range says so', () => {
    draw(weekly([92]).map((w) => new WaistObservation({ date: w.date.addDays(-200), waistCm: w.waistCm })));
    expect(screen.getByText('No waist measurements in this range.')).toBeInTheDocument();
  });

  it('the band is half as wide again around a single reading', () => {
    // Same measurements twice; in the second a middle entry is a quick entry, which widens the band there.
    const steady = [92, 92, 92, 92, 92];
    const { container: triples } = draw(weekly(steady));
    const { container: withSingle } = draw(weekly(steady, { single: 2 }));
    const bandOf = (c: HTMLElement) => c.querySelector('.chart-waist-band')?.getAttribute('d') ?? '';
    expect(bandOf(triples)).not.toBe(bandOf(withSingle));
    expect(bandOf(withSingle)).not.toBe('');
  });
});
