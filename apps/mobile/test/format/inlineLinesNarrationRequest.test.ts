import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { CoachToolbox } from '../../src/domain/integration/CoachToolbox';
import { inlineLinesNarrationRequest } from '../../src/format/coach/inlineLinesNarrationRequest';
import { inlineLinesOf } from '../../src/format/coach/inlineLinesOf';

/** MM-687: the day's inline lines go to the model in one request, numbered, and come back one line per number. */
const day = CalendarDate.of(2026, 10, 28);
const toolbox: CoachToolbox = { tools: [], call: async () => ({ result: {}, numbers: [] }) };
const items = [
  { food: 'Buttermilk biscuit', meal: 'breakfast' as const, content: { line: 'Light on protein: 541 kcal for 10 g. Half of it next time keeps 271 kcal for protein.', evidence: [['Protein', '10 g, 7% of calories'] as const] } },
  { food: 'Fries', meal: 'lunch' as const, content: { line: 'Light on protein: 420 kcal for 5 g. Add chicken breast, 165 kcal for 31 g, alongside next time.', evidence: [] } },
];

describe('the request for the day’s lines', () => {
  it('numbers the items, allows their numbers back, and falls back to the built-in lines numbered the same way', () => {
    const req = inlineLinesNarrationRequest(day, items, toolbox, false);
    expect(req.cacheKey).toMatch(/^inline:2026-10-28:/);
    const sent = JSON.parse(req.userPrompt) as { items: { n: number; food: string; builtInLine: string }[] };
    expect(sent.items.map((i) => [i.n, i.food])).toEqual([
      [1, 'Buttermilk biscuit'],
      [2, 'Fries'],
    ]);
    expect(req.fallbackText).toBe(`1. ${items[0]!.content.line}\n2. ${items[1]!.content.line}`);
    for (const n of [1, 2, 541, 10, 271, 7, 420, 5, 165, 31]) expect(req.allowedNumbers).toContain(n);
    expect(req.toolbox).toBe(toolbox);
    expect(req.systemPrompt).toContain('one line per item');
  });

  it('is keyed by the day and the lines, so the same day asks once', () => {
    expect(inlineLinesNarrationRequest(day, items, toolbox, false).cacheKey).toBe(inlineLinesNarrationRequest(day, items, toolbox, false).cacheKey);
    expect(inlineLinesNarrationRequest(day.addDays(1), items, toolbox, false).cacheKey).not.toBe(inlineLinesNarrationRequest(day, items, toolbox, false).cacheKey);
  });
});

describe('reading the answer', () => {
  it('takes one line per number, in any order, the first of a number said twice', () => {
    const lines = inlineLinesOf('2) Fries again: 420 kcal for 5 g. Add the chicken.\n1. The biscuit is 541 kcal for 10 g. Half of it.\n1. Said again.\nA stray line.');
    expect([...lines]).toEqual([
      [2, 'Fries again: 420 kcal for 5 g. Add the chicken.'],
      [1, 'The biscuit is 541 kcal for 10 g. Half of it.'],
    ]);
  });
});
