import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { MacroSplitChart } from '../../src/charts/MacroSplitChart';
import type { IntakeDay } from '../../src/domain/IntakeDay';

/** MM-331: macros too small to round to a calorie draw no split, never "0 g · 100%". */
it('a gram of cola has no split to show', () => {
  render(<MacroSplitChart intake={{ kcal: 0.42, proteinG: 0, carbsG: 0.106, fatG: 0 } as IntakeDay} isPreview />);
  expect(screen.getByText('Enter macro amounts to preview the protein, carbs and fat split.')).toBeInTheDocument();
  expect(screen.queryByText(/100\.0%/)).not.toBeInTheDocument();
});

it('a real amount still has its split', () => {
  render(<MacroSplitChart intake={{ kcal: 42, proteinG: 0, carbsG: 10.6, fatG: 0 } as IntakeDay} isPreview />);
  expect(screen.getAllByText(/100\.0%/).length).toBeGreaterThan(0);
});
