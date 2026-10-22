import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { MacroSplitChart } from '../../src/charts/MacroSplitChart';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { IntakeDay } from '../../src/domain/IntakeDay';
import { declarationsOf } from '../support/stylesheetRules';

const day = CalendarDate.of(2026, 10, 16);
const charts = 'src/charts/charts.css';

/** MM-354: nothing logged, the split is still a donut: whole, grey, with what it needs beneath. */
it('with nothing logged the split is a grey ring and a line saying what it needs', () => {
  const view = render(<MacroSplitChart intake={new IntakeDay({ date: day, kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 })} compact />);
  expect(view.container.querySelector('svg .chart-split-empty')).not.toBeNull();
  expect(screen.getByText('Log food with protein, carbs or fat to see the split.')).toBeInTheDocument();
  expect(declarationsOf(charts, '.chart-split-empty')).toMatch(/stroke: var\(--track\)/);
});

it('the donut is centred, empty or not, with its figures beneath it', () => {
  for (const selector of ['.chart-split', '.chart-split-row']) {
    expect(declarationsOf(charts, selector), selector).toMatch(/flex-direction: column/);
    expect(declarationsOf(charts, selector), selector).toMatch(/align-items: center/);
  }
  render(<MacroSplitChart intake={new IntakeDay({ date: day, kcal: 566, proteinG: 40, carbsG: 61, fatG: 18 })} compact />);
  expect(screen.getByText('40 g · 28.3%')).toBeInTheDocument();
});

it('at a narrow width the figures wrap to a new row whole, never broken inside a column', () => {
  expect(declarationsOf(charts, '.chart-split-list')).toMatch(/flex-wrap: wrap/);
  expect(declarationsOf(charts, '.chart-split-item')).toMatch(/white-space: nowrap/);
});

it('the line saying what it needs is as tall as the figures, so the hero does not grow with the first food', () => {
  expect(declarationsOf(charts, '.chart-split-needs')).toMatch(/min-height: calc\(2 \* var\(--split-figure-line\) \+ 2 \* var\(--space-4\)\)/);
  expect(declarationsOf(charts, '.chart-split-item')).toMatch(/line-height: var\(--split-figure-line\)/);
});

/** MM-179: switching Grams to Split keeps each macro's colour: a sector is filled with the token its bar is. */
it('each split sector uses the colour token of its macro bar', () => {
  for (const macro of ['protein', 'carbs', 'fat']) {
    const bar = declarationsOf('src/ui/ui.css', `.mm-progress-${macro} .mm-progress-fill`).match(/background: (var\(--[a-z0-9-]+\))/)?.[1];
    const sector = declarationsOf(charts, `.chart-sector-${macro}`).match(/fill: (var\(--[a-z0-9-]+\))/)?.[1];
    expect(bar, macro).toBe(`var(--${macro})`);
    expect(sector, macro).toBe(bar);
  }
});

it('MM-179: inside the hero the split keeps one line saying what its shares are of, empty or not', () => {
  const empty = render(<MacroSplitChart intake={new IntakeDay({ date: day, kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 })} compact />);
  expect(screen.getByText('Share of calories from each')).toBeInTheDocument();
  empty.unmount();
  render(<MacroSplitChart intake={new IntakeDay({ date: day, kcal: 566, proteinG: 40, carbsG: 61, fatG: 18 })} compact />);
  expect(screen.getByText('Share of calories from each')).toBeInTheDocument();
  expect(screen.queryByText(/kcal\/g/)).toBeNull();
});
