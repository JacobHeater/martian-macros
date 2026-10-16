import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { TrainingStep } from '../../src/onboarding/TrainingStep';

/** MM-349: the day creatine was started is written as the app writes dates, never "2026-10-12". */
it('the creatine start reads as a date', () => {
  const nothing = () => undefined;
  render(
    <TrainingStep
      status="novice"
      trainingDays={3}
      bodyFat={undefined}
      creatineStartedOn={CalendarDate.of(2026, 10, 12)}
      onCreatine={nothing}
      onPickCreatineStartDate={nothing}
      onStatus={nothing}
      onTrainingDays={nothing}
      onBodyFatKnown={nothing}
      onBodyFat={nothing}
    />,
  );
  expect(screen.getByText('October 12, 2026')).toBeInTheDocument();
  expect(screen.queryByText('2026-10-12')).not.toBeInTheDocument();
});
