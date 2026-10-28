import { describe, expect, it } from 'vitest';
import { executiveBriefOf } from '../../src/engine/analysis/executiveBriefOf';
import { analyseFoodDay } from '../../src/engine/analysis/food/analyseFoodDay';
import { mealBreakdownAnalysisOf } from '../../src/engine/analysis/mealBreakdownAnalysisOf';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import { executiveBriefArchetypeText } from '../../src/format/coach/executiveBriefArchetypeText';
import { foodFindingText } from '../../src/format/coach/foodFindingText';
import { mealBreakdownArchetypeText } from '../../src/format/coach/mealBreakdownArchetypeText';
import { verifyCoachNarration } from '../../src/format/coach/verifyCoachNarration';
import { Fmt } from '../../src/format/Fmt';
import { food, inputOf, safeguards, today, yesterday } from './support/foodAnalysis';

const fmt = new Fmt('metric');

describe('protein runway invariant and deterministic pre-calc (MM-663)', () => {
  it('never instructs the user to consume remaining protein today when proteinLeftG * 4 > kcalLeft', () => {
    // 2,231 kcal logged with 56 g protein against 2,400 kcal and 170 g protein -> 169 kcal left, 114 g protein left.
    const entries = [
      food(today, 'breakfast', 'Croissant and butter', 680, 12, 38),
      food(today, 'lunch', 'Cheese pizza', 950, 28, 44),
      food(today, 'dinner', 'Pasta carbonara', 601, 16, 28),
    ];
    const input = inputOf([
      {
        date: yesterday,
        entries: [food(yesterday, 'dinner', 'Chicken breast', 165, 31, 4)],
      },
      { date: today, entries },
    ]);

    const findings = analyseFoodDay(input, today);
    const left = findings.find((f) => f.kind === 'left') as CoachFinding;
    expect(left.figures).toMatchObject({
      kcalLeft: 169,
      proteinLeftG: 114,
      proteinUnrecoverable: 1,
    });
    expect(left.foods).toEqual([]);

    const [, body] = foodFindingText(left, fmt);
    expect(body).not.toMatch(/Get 114 g more protein/i);
    expect(body).toMatch(/Hold your calorie cap tonight|Hold your calorie target tonight/i);
    expect(body).toMatch(/front-load protein/i);

    const fix = findings.find((f) => f.kind === 'fix' && f.signal === 'protein') as CoachFinding;
    const [, fixBody] = foodFindingText(fix, fmt);
    expect(fixBody).not.toMatch(/Get 114 g more protein/i);
    expect(fixBody).toMatch(/Hold your calorie cap tonight|Hold your calorie target tonight/i);
  });

  it('computes ExecutiveBrief and synthesizes whole-situation archetypes across states', () => {
    const unrecoverableInput = inputOf([
      {
        date: yesterday,
        entries: [food(yesterday, 'dinner', 'Chicken breast', 2200, 175, 45)],
      },
      {
        date: today,
        entries: [food(today, 'dinner', 'Cheese pizza', 2231, 56, 98)],
      },
    ]);
    const unrecoverableBrief = executiveBriefOf(unrecoverableInput, today);
    expect(unrecoverableBrief.runwayState).toBe('proteinUnrecoverable');
    expect(unrecoverableBrief.proteinUnrecoverable).toBe(true);
    expect(unrecoverableBrief.sevenDay.loggedDays).toBe(2);
    expect(unrecoverableBrief.sevenDay.proteinFloorHitDays).toBe(1);

    const unrecoverableText = executiveBriefArchetypeText(unrecoverableBrief);
    expect(unrecoverableText).toMatch(/169 kcal/);
    expect(unrecoverableText).toMatch(/114 g/);
    expect(unrecoverableText).toMatch(/front-load protein/i);

    const tightInput = inputOf([
      {
        date: today,
        entries: [food(today, 'lunch', 'Burger and fries', 1950, 100, 95)],
      },
    ]);
    const tightBrief = executiveBriefOf(tightInput, today);
    expect(tightBrief.runwayState).toBe('tightRunway');
    expect(executiveBriefArchetypeText(tightBrief)).toMatch(/450 kcal/);

    const protectedInput = inputOf(
      [{ date: today, entries: [food(today, 'lunch', 'Salmon bowl', 650, 42, 22)] }],
      { safeguards: safeguards('activeEatingDisorder') },
    );
    const protectedBrief = executiveBriefOf(protectedInput, today);
    expect(protectedBrief.protectedPath).toBe(true);
    const protectedText = executiveBriefArchetypeText(protectedBrief);
    expect(protectedText).not.toMatch(/kcal|calorie/i);
  });

  it('computes MealBreakdownAnalysis with tactical impact, outlier item, and deterministic swap', () => {
    const mealEntries = [
      food(today, 'lunch', 'Grilled chicken', 220, 40, 5),
      food(today, 'lunch', 'Loaded nachos', 780, 14, 48),
    ];
    const allToday = mealEntries;
    const candidates = [
      food(yesterday, 'lunch', 'Turkey breast wrap', 340, 38, 6),
      ...mealEntries,
    ];
    const analysis = mealBreakdownAnalysisOf({
      meal: 'lunch',
      mealEntries,
      dayEntries: allToday,
      candidates,
      kcalTarget: 2400,
      proteinTargetG: 170,
      protectedPath: false,
    });

    expect(analysis.mealKcal).toBe(1000);
    expect(analysis.mealProteinG).toBe(54);
    expect(analysis.outlierItem?.name).toBe('Loaded nachos');
    expect(analysis.suggestedSwap?.replacementName).toBe('Turkey breast wrap');
    expect(analysis.suggestedSwap?.caloriesSaved).toBe(440);
    expect(analysis.suggestedSwap?.proteinGained).toBe(24);

    const text = mealBreakdownArchetypeText(analysis);
    expect(text).toMatch(/Lunch used 42% of your daily calorie budget/);
    expect(text).toMatch(/loaded nachos/i);
    expect(text).toMatch(/Turkey breast wrap/);
  });

  it('verifies candidate narrations against numbers, voice rules, protected path, and protein invariant', () => {
    expect(
      verifyCoachNarration(
        'You have 169 kcal left today against 114 g of remaining protein. Hold your calorie cap tonight and front-load protein in the morning.',
        {
          protectedPath: false,
          proteinUnrecoverable: true,
          allowedNumbers: [169, 114, 2400, 170],
        },
      ),
    ).toBe(true);

    // Rejects impossible directive when protein is unrecoverable.
    expect(
      verifyCoachNarration('Get 114 g more protein in tonight before bed.', {
        protectedPath: false,
        proteinUnrecoverable: true,
        allowedNumbers: [114],
      }),
    ).toBe(false);

    // Rejects hallucinated numbers.
    expect(
      verifyCoachNarration('You have 999 kcal left today and 88 g of protein to go.', {
        protectedPath: false,
        proteinUnrecoverable: false,
        allowedNumbers: [610, 62],
      }),
    ).toBe(false);

    // Rejects calorie mentions on the protected path.
    expect(
      verifyCoachNarration('You have 500 kcal left in your calorie budget today.', {
        protectedPath: true,
        proteinUnrecoverable: false,
      }),
    ).toBe(false);
  });
});
