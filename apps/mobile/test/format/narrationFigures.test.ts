import { describe, expect, it } from 'vitest';
import { executiveBriefOf } from '../../src/engine/analysis/executiveBriefOf';
import { mealBreakdownAnalysisOf } from '../../src/engine/analysis/mealBreakdownAnalysisOf';
import { executiveBriefNarrationRequest } from '../../src/format/coach/executiveBriefNarrationRequest';
import { mealBreakdownNarrationRequest } from '../../src/format/coach/mealBreakdownNarrationRequest';
import { whyCoachNarrationRejected } from '../../src/format/coach/whyCoachNarrationRejected';
import { food, inputOf, today, yesterday } from '../engine/support/foodAnalysis';
import { CardioSession } from '../../src/domain/training/CardioSession';
import { trainingBriefOf } from '../../src/engine/analysis/trainingBriefOf';
import { trainingInput } from '../engine/support/trainingInput';

/**
 * MM-671: the owner's first answer from Anthropic was good words refused for "903968363784": the brief went to the
 * model unrounded (2176.903968363784 kcal), the model wrote it back digit for digit, and the check read the digits
 * after the point as a number of their own. The model is given whole numbers, and a decimal is read as one number.
 */
const everyNumber = (value: unknown): number[] => {
  if (typeof value === 'number') return [value];
  if (Array.isArray(value)) return value.flatMap(everyNumber);
  if (value !== null && typeof value === 'object') return Object.values(value).flatMap(everyNumber);
  return [];
};

describe('the figures sent to the model', () => {
  const brief = () =>
    executiveBriefOf(
      inputOf([
        { date: yesterday, entries: [food(yesterday, 'dinner', 'Chicken breast', 2200.4, 175.25, 45.1)] },
        { date: today, entries: [food(today, 'lunch', 'Cheese pizza', 2231.7, 56.6, 98.3)] },
      ]),
      today,
    )!;

  it('are whole in the brief’s request, and so are the numbers allowed back', () => {
    const req = executiveBriefNarrationRequest(brief());
    const sent = everyNumber(JSON.parse(req.userPrompt));
    expect(sent.length).toBeGreaterThan(5);
    expect(sent.every(Number.isInteger), req.userPrompt).toBe(true);
    expect(req.allowedNumbers.every(Number.isInteger)).toBe(true);
    expect(req.systemPrompt).toContain('as whole numbers');
  });

  // MM-681: the training figures go to the model too, and may be said back, in hours and minutes as well.
  it('carry the training block, whole, with its minutes allowed back as hours and minutes', () => {
    const start = new Date(today.year, today.month - 1, today.day - 1, 7, 5);
    const training = trainingBriefOf(
      trainingInput(today, {
        goal: 'fatLoss',
        cardio: [new CardioSession({ platformId: 'w', sourceName: 'Watch', activity: 'walking', start, end: new Date(start.getTime() + 96.4 * 60000) })],
        steps: [{ date: today, steps: 6100 }],
      }),
      today,
    );
    const req = executiveBriefNarrationRequest({ ...brief(), training });
    const sent = JSON.parse(req.userPrompt) as { training: Record<string, unknown> };
    expect(sent.training).toMatchObject({ liftingSessionsThisWeek: 0, liftingSessionsSet: 4, cardioMinutesThisWeek: 96, cardioMinutesFloor: 150, cardioMinutesMore: 54, stepsPerDay: 6100, stepsFloor: 8000, stepsMorePerDay: 1900 });
    expect(everyNumber(sent).every(Number.isInteger)).toBe(true);
    for (const allowed of [4, 96, 150, 54, 6100, 8000, 1900, 1, 36, 2, 30]) expect(req.allowedNumbers).toContain(allowed);
    expect(req.systemPrompt).toContain('hold the person to it');
    expect(req.systemPrompt).not.toMatch(/burn off|earn/);
    expect(req.fallbackText).toContain('Cardio 1 h 36 min against the 2 h 30 min floor');
  });

  it('are whole in a meal’s request too', () => {
    const analysis = mealBreakdownAnalysisOf({
      meal: 'lunch',
      mealEntries: [food(today, 'lunch', 'Loaded nachos', 780.6, 14.2, 48.9)],
      dayEntries: [food(today, 'lunch', 'Loaded nachos', 780.6, 14.2, 48.9)],
      candidates: [food(yesterday, 'lunch', 'Turkey breast wrap', 340.3, 38.4, 6.1)],
      kcalTarget: 2400,
      proteinTargetG: 170,
      protectedPath: false,
    });
    const req = mealBreakdownNarrationRequest(analysis);
    expect(everyNumber(JSON.parse(req.userPrompt)).every(Number.isInteger), req.userPrompt).toBe(true);
    expect(req.allowedNumbers.every(Number.isInteger)).toBe(true);
  });
});

describe('the check on the words', () => {
  const context = { protectedPath: false, proteinUnrecoverable: false, allowedNumbers: [2177, 187, 6, 34] };

  it('reads a decimal as one number, which passes when it rounds to a figure given', () => {
    expect(
      whyCoachNarrationRejected('Nothing is logged yet today, so you have 2176.903968363784 kcal and 186.8643 g of protein still available.', context),
    ).toBeUndefined();
    expect(whyCoachNarrationRejected('You have 2,177 kcal and 187 g of protein left, a 34% density over 6 days.', context)).toBeUndefined();
  });

  // MM-674: "Because proteinUnrecoverable is true" reached the owner's breakdown.
  it('refuses a JSON field name read aloud', () => {
    expect(whyCoachNarrationRejected('Because proteinUnrecoverable is true, the 187 g gap cannot fit tonight. Front-load protein tomorrow.', context)).toBe(
      'It read out a field name (proteinUnrecoverable)',
    );
    expect(whyCoachNarrationRejected('The protein left cannot fit inside the 2,177 kcal left today. Front-load protein tomorrow.', context)).toBeUndefined();
  });

  it('still refuses a number that is not a figure given', () => {
    expect(whyCoachNarrationRejected('You have about 1,900 kcal left today and 187 g of protein to find.', context)).toBe(
      'It used a number not in your figures (1,900)',
    );
  });
});
