import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { MacroSplitChart } from '../../src/charts/MacroSplitChart';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { IntakeDay } from '../../src/domain/IntakeDay';
import { rules, stylesheets } from '../support/stylesheetRules';

/**
 * MM-554: a macro colour is a graphic colour (3:1), not a text colour; fat is under 4.5:1 on raised and overlay in
 * Martian. A rule may give `color` a macro token only to drive `currentColor` in a chart's lines, dots and legend
 * glyph; every one of those is named here, so a new use as text has to be argued for.
 */
const graphicOnly = new Set(['.chart-protein', '.chart-measurement', '.chart-recovery']);

it('no stylesheet gives text a macro colour', () => {
  const offending: string[] = [];
  for (const path of stylesheets('src')) {
    for (const rule of rules(readFileSync(path, 'utf8'))) {
      if (!/(^|[;\s])color:\s*var\(--(protein|carbs|fat)\)/.test(rule.body)) continue;
      for (const selector of rule.selectors) if (!graphicOnly.has(selector)) offending.push(`${path}: ${selector}`);
    }
  }
  expect(offending).toEqual([]);
});

it("the split's names and figures are text, with the macro's colour on a key before the name", () => {
  const day = CalendarDate.of(2026, 10, 16);
  const view = render(<MacroSplitChart intake={new IntakeDay({ date: day, kcal: 566, proteinG: 40, carbsG: 61, fatG: 18 })} compact />);
  const item = screen.getByText('40 g · 28.3%').closest('li')!;
  expect(item.className).toBe('chart-split-item');
  for (const macro of ['protein', 'carbs', 'fat']) {
    expect(view.container.querySelector(`.chart-split-item .chart-key-${macro}`), macro).not.toBeNull();
  }
});
