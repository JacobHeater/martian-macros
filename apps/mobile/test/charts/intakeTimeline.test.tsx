import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { IntakeTimeline } from '../../src/charts/IntakeTimeline';
import { intakeStepsOf } from '../../src/domain/food/timeline/intakeStepsOf';
import { minuteOfDayText } from '../../src/format/minuteOfDayText';

/** MM-571: the hero's running total over the clock. */
const day = intakeStepsOf([
  { kcal: 675, meal: 'breakfast', eatenAt: 460 },
  { kcal: 713, meal: 'lunch', eatenAt: 750 },
  { kcal: 1200, meal: 'dinner', eatenAt: 1155 },
]);

it('draws the target, what went past it, the moment it was crossed, and now', () => {
  const view = render(<IntakeTimeline steps={day} targetKcal={2175} nowMinute={21 * 60 + 30} />);
  const chart = screen.getByRole('img');
  expect(chart.getAttribute('aria-label')).toBe(
    'Running total: 2,588 kcal eaten, 675 after breakfast at 7:40 AM, 1,388 after lunch at 12:30 PM, 2,588 after dinner at 7:15 PM, target 2,175, passed at dinner.',
  );
  expect(view.container.querySelector('.chart-intake-target')).not.toBeNull();
  expect(view.container.querySelector('.chart-intake-crossed')).not.toBeNull();
  expect(view.container.querySelector('.chart-intake-now')).not.toBeNull();
  expect(view.container.querySelectorAll('.chart-intake-step')).toHaveLength(3);
  expect(screen.getByText('target 2,175')).toBeInTheDocument();
  expect(screen.getByText('D 7:15')).toBeInTheDocument();
});

it('under the target nothing is crossed; a past day has no now; a food without a time is an open dot', () => {
  const view = render(
    <IntakeTimeline steps={intakeStepsOf([{ kcal: 500, meal: 'lunch', eatenAt: undefined }])} targetKcal={2000} />,
  );
  expect(view.container.querySelector('.chart-intake-crossed')).toBeNull();
  expect(view.container.querySelector('.chart-intake-now')).toBeNull();
  expect(view.container.querySelectorAll('.chart-intake-step-approximate')).toHaveLength(1);
  expect(screen.getByText('L ~12:30')).toBeInTheDocument();
});

it('says a minute of the day as a clock does', () => {
  expect(minuteOfDayText(0)).toBe('12:00 AM');
  expect(minuteOfDayText(460)).toBe('7:40 AM');
  expect(minuteOfDayText(12 * 60)).toBe('12:00 PM');
  expect(minuteOfDayText(23 * 60 + 59)).toBe('11:59 PM');
});

// MM-572: until there are enough days with meal times, the key says what the usual day waits for, with the count.
it('says what the usual day waits for, then draws it', () => {
  const waiting = render(<IntakeTimeline steps={day} targetKcal={2175} usual={{ timedDays: 2, needed: 7, curve: undefined }} />);
  expect(screen.getByText('Your usual day appears after 7 days with meal times · 2 of 7')).toBeInTheDocument();
  expect(waiting.container.querySelector('.chart-intake-usual')).toBeNull();
  waiting.unmount();
  const curve = Array.from({ length: 97 }, (_, i) => [i * 15, i * 15 >= 720 ? 1400 : 500] as const);
  const drawn = render(<IntakeTimeline steps={day} targetKcal={2175} usual={{ timedDays: 9, needed: 7, curve }} />);
  expect(drawn.container.querySelector('.chart-intake-usual')).not.toBeNull();
  expect(screen.getByText('Your usual day')).toBeInTheDocument();
});
