import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { RecompReviewBody } from '../../src/coach/RecompReviewBody';
import { RecompReview } from '../../src/engine/RecompReview';
import { Fmt } from '../../src/format/Fmt';

/** MM-341: a trend that held is "0.0%", never "+0.0%"; a fall carries the app's minus sign. */
const shown = (weightChangeFraction: number) => {
  const view = render(
    <RecompReviewBody
      review={new RecompReview({ week: 12, periodDays: 84, verdict: 'working', missing: [], waistMeasurements: 13, weightChangeFraction })}
      fmt={new Fmt('metric')}
    />,
  );
  const value = screen.getByText('Trend weight').parentElement?.textContent ?? '';
  view.unmount();
  return value;
};

it('a held trend is unsigned', () => {
  expect(shown(0.00004)).toContain('0.0%');
  expect(shown(0.00004)).not.toContain('+0.0%');
});

it('a fall uses the minus sign', () => {
  expect(shown(-0.012)).toContain('−1.2%');
});
