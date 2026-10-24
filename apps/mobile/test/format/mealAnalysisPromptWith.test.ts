import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { mealAnalysisPrompt } from '../../src/format/mealAnalysisPrompt';
import { mealAnalysisPromptWith } from '../../src/format/mealAnalysisPromptWith';

/** MM-599: the fixed prompt with the person's answers in place of its questions. */
const today = CalendarDate.of(2026, 10, 24);
const answers = {
  name: '  Taco "night"  ',
  eaten: 'half' as const,
  notEaten: 'the chips',
  from: '',
  day: today.addDays(-1),
  eatenAt: undefined,
  photosAttached: true,
};

it('replaces the questions with the answers, and keeps the rest of the prompt as it is', () => {
  const prompt = mealAnalysisPromptWith(answers, today);
  expect(prompt).not.toContain('Before you answer, ask me');
  expect(prompt).toContain('- The meal is called "Taco \\"night\\"". Use it exactly as the meal\'s "name".');
  expect(prompt).toContain('- I ate about half of what is shown, except the chips.');
  expect(prompt).toContain('- It is not from a brand or a restaurant.');
  expect(prompt).toContain('- I ate it on Friday, October 23, 2026; I did not give a time, so leave "eaten_at" out.');
  expect(prompt).toContain('- Today is Saturday, October 24, 2026.');
  expect(prompt).toContain('My photos are attached to this message.');
  expect(prompt.startsWith(mealAnalysisPrompt.slice(0, mealAnalysisPrompt.indexOf('Before you answer')))).toBe(true);
  expect(prompt.endsWith(mealAnalysisPrompt.slice(mealAnalysisPrompt.indexOf('Then identify each separate food')))).toBe(true);
});

it('gives the time eaten as the eaten_at to use', () => {
  const prompt = mealAnalysisPromptWith({ ...answers, day: today, eatenAt: 18 * 60 + 5 }, today);
  expect(prompt).toContain('- I ate it on Saturday, October 24, 2026 at 6:05 PM. Use "eaten_at": "2026-10-24T18:05".');
});
