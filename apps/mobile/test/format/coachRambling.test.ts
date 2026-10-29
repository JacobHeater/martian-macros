import { describe, expect, it } from 'vitest';
import type { CoachToolbox } from '../../src/domain/integration/CoachToolbox';
import { executiveBriefOf } from '../../src/engine/analysis/executiveBriefOf';
import { executiveBriefNarrationRequest } from '../../src/format/coach/executiveBriefNarrationRequest';
import { whyCoachNarrationRejected } from '../../src/format/coach/whyCoachNarrationRejected';
import { food, inputOf, today, yesterday } from '../engine/support/foodAnalysis';

/**
 * MM-693: the brief is the owner's shape, verdict, drag, order, one training
 * line, at most 4 sentences and 60 words. The owner's Executive summary of
 * 2026-10-28 opened "The figures are already in front of me, so I can answer
 * directly without calling tools", ran to 170 words and recited the rows
 * under it, and the check let it through.
 */
const brief = { protectedPath: false, proteinUnrecoverable: true, maxSentences: 4, maxWords: 60 };
const sheet = { protectedPath: false, proteinUnrecoverable: true };

const ownersPreamble = 'The figures are already in front of me, so I can answer directly without calling tools. ';
const ownersBody =
  "Today you have 347 calories left and 100 grams of protein still to find, which cannot fit inside today's calorie cap, so hold your calorie ceiling tonight and front-load protein at breakfast tomorrow. " +
  'The drag is the lunch buttermilk biscuit at 254 calories and only 5 grams of protein; adding a chicken breast filet beside it would bring the meal to 1043 calories and 86 grams of protein. ' +
  'This week you have lifted 0 times against the 3 sessions you set, with 38 of the 150 cardio minutes done and 6909 steps a day against the 8000 floor, so get three lifting sessions in before the week closes and add 112 cardio minutes and 1091 steps a day.';

const approvedDraft =
  '347 kcal left and 100 g of protein to go does not fit. Hold the 347 and spend every one on lean protein; protein first tomorrow morning. ' +
  'The lunch biscuit, 254 kcal for 5 g, is the drag: build lunch around chicken breast next time. Zero lifts of the three you set this week: book one tonight.';

/** The sheet's approved line A (MM-682), longer than the brief's 60 words. */
const lineA =
  'Breakfast took 844 kcal, 39% of your day, for 34 g of protein. The buttermilk biscuit is the drag: 541 kcal for 10 g. ' +
  '347 kcal left and 100 g of protein to go does not fit. Hold the 347 and spend every one of them on lean protein: chicken breast, 165 kcal for 31 g, is the closest you get. Protein first tomorrow morning.';

describe('the owner’s brief of 2026-10-28', () => {
  it('is refused for its first sentence', () => {
    expect(whyCoachNarrationRejected(ownersPreamble + ownersBody, brief)).toBe('It spoke of its figures or tools instead of the day');
  });

  it('is refused for rambling without it', () => {
    expect(whyCoachNarrationRejected(ownersBody, brief)).toBe('It rambled');
  });

  it('refuses each way of talking about figures or tools', () => {
    for (const text of [
      'The figures are already in front of me. Hold the 347 tonight and spend it on lean protein.',
      'I can answer directly: hold the 347 tonight and spend it on lean protein. Protein first tomorrow.',
      'No tools needed here: hold the 347 tonight and spend it on lean protein. Protein first tomorrow.',
      'Without calling anything, the day is 347 kcal short of fitting 100 g of protein. Hold the line tonight.',
    ]) {
      expect(whyCoachNarrationRejected(text, brief), text).toBe('It spoke of its figures or tools instead of the day');
    }
  });
});

describe('the brief’s shape', () => {
  it('lets the owner’s approved draft through', () => {
    expect(whyCoachNarrationRejected(approvedDraft, brief)).toBeUndefined();
    expect(whyCoachNarrationRejected(approvedDraft, { ...brief, allowedNumbers: [347, 100, 254, 5, 3] })).toBeUndefined();
  });

  it('refuses a fifth sentence', () => {
    const five = `${approvedDraft} Cardio is behind too.`;
    expect(whyCoachNarrationRejected(five, brief)).toBe('It rambled');
  });

  it('refuses a sixty-first word', () => {
    const words = Array.from({ length: 61 }, () => 'protein').join(' ');
    expect(whyCoachNarrationRejected(`Hold the line: ${words}.`, brief)).toBe('It rambled');
    const sixty = Array.from({ length: 57 }, () => 'protein').join(' ');
    expect(whyCoachNarrationRejected(`Hold the line: ${sixty}.`, brief)).toBeUndefined();
  });

  it('reads a decimal as part of one sentence, not two', () => {
    const text = 'Dinner was 2.5 times breakfast. Hold the 347 tonight. Lean protein only. Protein first tomorrow.';
    expect(whyCoachNarrationRejected(text, brief)).toBeUndefined();
  });

  it('does not bind the sheet, whose approved line A is longer', () => {
    expect(whyCoachNarrationRejected(lineA, sheet)).toBeUndefined();
    expect(whyCoachNarrationRejected(lineA, brief)).toBe('It rambled');
  });
});

describe('what the brief’s model is told', () => {
  const toolbox: CoachToolbox = { tools: [], call: async () => ({ result: {}, numbers: [] }) };
  const executive = executiveBriefOf(
    inputOf([
      { date: yesterday, entries: [food(yesterday, 'dinner', 'Chicken breast', 2200, 175, 45)] },
      { date: today, entries: [food(today, 'lunch', 'Cheese pizza', 2231, 56, 98)] },
    ]),
    today,
  )!;

  it('carries the shape, and the request carries its limits', () => {
    for (const request of [executiveBriefNarrationRequest(executive), executiveBriefNarrationRequest(executive, toolbox)]) {
      expect(request.maxSentences).toBe(4);
      expect(request.maxWords).toBe(60);
      expect(request.systemPrompt).toContain('at most 4 short sentences and 60 words');
      expect(request.systemPrompt).toContain('never recite them');
      expect(request.systemPrompt).toContain('next time that meal is built, never for tonight');
      expect(request.systemPrompt).toContain('No preamble');
      expect(request.systemPrompt).not.toMatch(/the figures given|against their floors/);
    }
  });
});
