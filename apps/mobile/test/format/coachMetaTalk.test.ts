import { describe, expect, it } from 'vitest';
import type { CoachToolbox } from '../../src/domain/integration/CoachToolbox';
import { executiveBriefOf } from '../../src/engine/analysis/executiveBriefOf';
import { mealBreakdownAnalysisOf } from '../../src/engine/analysis/mealBreakdownAnalysisOf';
import { executiveBriefNarrationRequest } from '../../src/format/coach/executiveBriefNarrationRequest';
import { inlineLinesNarrationRequest } from '../../src/format/coach/inlineLinesNarrationRequest';
import { mealBreakdownNarrationRequest } from '../../src/format/coach/mealBreakdownNarrationRequest';
import { whyCoachNarrationRejected } from '../../src/format/coach/whyCoachNarrationRejected';
import { food, inputOf, safeguards, today, yesterday } from '../engine/support/foodAnalysis';
import { day, logged } from '../engine/support/movesFixtures';

/**
 * MM-689: the coach speaks of the day, never of its figures, its
 * instructions or its tools. The owner's Executive summary of 2026-10-28
 * opened "I'll work from the JSON you supplied; the protein gap is marked
 * as unable to fit inside today's calories, so I'll go straight to the
 * order", and the check let it through.
 */
const plain = { protectedPath: false, proteinUnrecoverable: false };

describe('words about the figures instead of the day', () => {
  it('refuses the owner’s brief', () => {
    const brief =
      "I'll work from the JSON you supplied; the protein gap is marked as unable to fit inside today's calories, so I'll go straight to the order. " +
      'Today you have 347 calories left and 100 grams of protein to find.';
    expect(whyCoachNarrationRejected(brief, plain)).toBe('It spoke of its figures or tools instead of the day');
  });

  it('refuses each way of saying it', () => {
    for (const text of [
      'Based on the data provided, breakfast took 844 kcal for 34 g of protein.',
      'The protein gap is marked as unable to fit inside the calories left today.',
      "I'll go straight to the order: hold the 347 and spend it on lean protein.",
      'The tool says chicken breast is 165 kcal for 31 g, so add it at lunch.',
      'According to the figures you gave me, lunch was 700 kcal for 22 g.',
      'From the JSON, the biscuit is the drag at 541 kcal for 10 g.',
    ]) {
      expect(whyCoachNarrationRejected(text, plain), text).toBe('It spoke of its figures or tools instead of the day');
    }
  });

  it('lets the coach’s own words through', () => {
    for (const text of [
      'Breakfast took 844 kcal, 39% of your day, for 34 g of protein. The buttermilk biscuit is the drag: 541 kcal for 10 g. Hold the 347 and spend every one of them on lean protein. Protein first tomorrow morning.',
      'Lunch was 700 kcal for 22 g of protein. The fries are the drag: 420 kcal for 5 g. Next time build it around protein: add chicken breast, 165 kcal for 31 g, and lunch stands at 53 g.',
      'You gave lunch 700 kcal and it gave you 22 g of protein back. Dinner carries the rest.',
    ]) {
      expect(whyCoachNarrationRejected(text, plain), text).toBeUndefined();
    }
  });
});

describe('what the model is told', () => {
  const toolbox: CoachToolbox = { tools: [], call: async () => ({ result: {}, numbers: [] }) };
  const asCoach = 'never mention figures, JSON, instructions or tools';

  it('speaks of the figures, never of "the JSON", on all three surfaces', () => {
    const brief = executiveBriefOf(
      inputOf([
        { date: yesterday, entries: [food(yesterday, 'dinner', 'Chicken breast', 2200, 175, 45)] },
        { date: today, entries: [food(today, 'lunch', 'Cheese pizza', 2231, 56, 98)] },
      ]),
      today,
    )!;
    const breakfast = [logged(day, 'breakfast', 'Buttermilk biscuit', 541, 10, 27)];
    const meal = mealBreakdownAnalysisOf({
      meal: 'breakfast',
      mealEntries: breakfast,
      dayEntries: breakfast,
      candidates: breakfast,
      catalog: undefined,
      kcalTarget: 2177,
      proteinTargetG: 187,
      safeguards: safeguards(),
    });
    const prompts = [
      executiveBriefNarrationRequest(brief).systemPrompt,
      executiveBriefNarrationRequest(brief, toolbox).systemPrompt,
      mealBreakdownNarrationRequest(meal).systemPrompt,
      mealBreakdownNarrationRequest(meal, toolbox).systemPrompt,
      inlineLinesNarrationRequest(day, [], toolbox, false).systemPrompt,
    ];
    for (const prompt of prompts) {
      expect(prompt).toContain(asCoach);
      expect(prompt).not.toMatch(/the JSON|supplied JSON|JSON field|JSON marks|from the JSON/);
    }
  });
});
