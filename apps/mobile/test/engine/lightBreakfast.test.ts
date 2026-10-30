import { describe, expect, it } from 'vitest';
import type { TrainingBrief } from '../../src/engine/analysis/TrainingBrief';
import { executiveBriefOf } from '../../src/engine/analysis/executiveBriefOf';
import { mealBreakdownAnalysisOf } from '../../src/engine/analysis/mealBreakdownAnalysisOf';
import { runwayIsTight } from '../../src/engine/analysis/runwayIsTight';
import { executiveBriefArchetypeText } from '../../src/format/coach/executiveBriefArchetypeText';
import { executiveBriefNarrationRequest } from '../../src/format/coach/executiveBriefNarrationRequest';
import { mealBreakdownNarrationRequest } from '../../src/format/coach/mealBreakdownNarrationRequest';
import { mealMovesText } from '../../src/format/coach/mealMovesText';
import { whyCoachNarrationRejected } from '../../src/format/coach/whyCoachNarrationRejected';
import { food, inputOf, safeguards, targets, today, yesterday } from './support/foodAnalysis';
import { catalogFood, catalogOf } from './support/movesFixtures';

/**
 * MM-713: the owner's breakfast of 2026-10-30, oatmeal, maple syrup and
 * butter, 243 kcal for 5 g on a 2,178 kcal and 187 g day. The sheet called
 * the oatmeal "the drag" and ordered a chicken breast into it; the brief
 * called the day "tight" and said breakfast "drove the squeeze". Nothing
 * was wrong with the breakfast, and the coach now says so.
 */
const chickenBreast = catalogFood(1, 'Chicken breast filet', 'meatAndPoultry', 180, 37, 3);
const breakfast = [
  food(today, 'breakfast', 'BANANA NUT WITH PREBIOTIC FIBER SUPERFOOD OATMEAL', 160, 5, 4),
  food(today, 'breakfast', 'Simple Truth Organic Dark Color Maple Syrup, Grade A.', 50, 0, 0),
  food(today, 'breakfast', 'UNSALTED SWEET CREAM BUTTER', 33, 0, 4),
];
const ownersTargets = { kcal: 2178, proteinG: 187, proteinMinimumG: 150 };

/** The sheet's words on the owner's phone, from the model. */
const ownersSheet =
  'Breakfast was 243 kcal for 5 g of protein, 8% protein. The banana nut with prebiotic fiber superfood oatmeal is the drag: 160 kcal for 5 g. ' +
  'Next time build it around protein: add chicken breast filet, 180 kcal for 37 g, and breakfast stands at 42 g. You have 1,935 kcal left for 182 g today. Lunch carries it.';

/** The brief's words on the owner's phone, from the model. */
const ownersBrief =
  'Runway is tight with 1,935 kcal left and 182 g of protein still to hit (38% of remaining calories from protein). Breakfast drove the squeeze: banana nut with prebiotic fiber superfood oatmeal, 160 kcal for 5 g. ' +
  'Next time build it around protein: add chicken breast filet, 180 kcal for 37 g, and breakfast stands at 42 g. Cut calorie-dense sides for the rest of today and spend your remaining budget on lean protein. ' +
  'No lifting logged yet. 3 sessions a week is what you set; log the first one. Cardio 38 min against the 2 h 30 min floor: 1 h 52 min more on the watch this week. Steps about 5,881 a day against 8,000: 2,119 more a day.';

const training: TrainingBrief = {
  goal: 'fatLoss',
  cardioHeld: true,
  sessionsThisWeek: 0,
  sessionsTarget: 3,
  daysSinceSession: undefined,
  wearableInUse: true,
  cardioMinutes: 38,
  cardioFloorMinutes: 150,
  stepsPerDay: 5881,
  stepsDays: 7,
  stepsFloor: 8000,
};

describe('the owner’s breakfast on the sheet', () => {
  const analysis = () =>
    mealBreakdownAnalysisOf({
      meal: 'breakfast',
      mealEntries: breakfast,
      dayEntries: breakfast,
      candidates: breakfast,
      catalog: catalogOf(chickenBreast),
      kcalTarget: ownersTargets.kcal,
      proteinTargetG: ownersTargets.proteinG,
      safeguards: safeguards(),
    });

  it('is fine: no drag, no move, and the coach says so and where the protein comes from', () => {
    const a = analysis();
    expect(a.kcalRemaining).toBe(1935);
    expect(a.proteinRemainingG).toBe(182);
    expect(a.verdict).toBe('fine');
    expect(a.outlierItem).toBeUndefined();
    expect(a.moves.moves).toEqual([]);
    expect(mealMovesText(a)).toBe('Breakfast is fine. Nothing to fix here. Build lunch around protein.');
  });

  it('is asked plainly, without the day’s totals or tools, and no number may come back', () => {
    const req = mealBreakdownNarrationRequest(analysis());
    expect(JSON.parse(req.userPrompt)).toEqual({ meal: 'breakfast', verdict: 'fine: nothing to fix', proteinComesAt: 'lunch and dinner', protectedPath: false, proteinUnrecoverable: false });
    expect(req.allowedNumbers).toEqual([]);
    expect(req.toolbox).toBeUndefined();
    expect(req.maxSentences).toBe(5);
    expect(req.maxWords).toBe(80);
    expect(req.systemPrompt).toContain('Never call a fine meal a problem, a drag, tight or a squeeze');
    expect(req.fallbackText).toBe('Breakfast is fine. Nothing to fix here. Build lunch around protein.');
  });

  it('refuses the words the owner’s phone showed', () => {
    const req = mealBreakdownNarrationRequest(analysis());
    expect(whyCoachNarrationRejected(ownersSheet, req)).toBe('It used a number not in your figures (243)');
    expect(whyCoachNarrationRejected('Breakfast is fine, light and nothing to fix. Lunch and dinner carry the protein today.', req)).toBeUndefined();
  });

  it('a breakfast built wrong still has its drag: 400 kcal of granola for 8 g', () => {
    const granola = [food(today, 'breakfast', 'Granola', 400, 8, 14), food(today, 'breakfast', 'Orange juice', 110, 2, 0)];
    const a = mealBreakdownAnalysisOf({
      meal: 'breakfast',
      mealEntries: granola,
      dayEntries: granola,
      candidates: granola,
      catalog: catalogOf(chickenBreast),
      kcalTarget: ownersTargets.kcal,
      proteinTargetG: ownersTargets.proteinG,
      safeguards: safeguards(),
    });
    expect(a.verdict).toBe('drag');
    expect(a.outlierItem?.name).toBe('Granola');
    expect(a.moves.best?.kind).toBe('addProtein');
    expect(mealMovesText(a)).toMatch(/^Breakfast was 510 kcal for 10 g of protein, 8% protein\. The granola is the drag: 400 kcal for 8 g\./);
    const req = mealBreakdownNarrationRequest(a);
    expect(JSON.parse(req.userPrompt)).toMatchObject({ verdict: 'built wrong: a drag and a move', proteinComesAt: 'lunch and dinner' });
  });

  it('a fine meal on a day that is tight gets the day’s order, with the meal itself fine', () => {
    const lunch = [food(today, 'lunch', 'Chicken wrap', 400, 30, 12)];
    const earlier = [food(today, 'breakfast', 'Pancakes with syrup', 1000, 20, 30)];
    const a = mealBreakdownAnalysisOf({
      meal: 'lunch',
      mealEntries: lunch,
      dayEntries: [...earlier, ...lunch],
      candidates: [...earlier, ...lunch],
      catalog: catalogOf(chickenBreast),
      kcalTarget: ownersTargets.kcal,
      proteinTargetG: ownersTargets.proteinG,
      safeguards: safeguards(),
    });
    // 778 kcal left for 137 g: 70% protein from here, tight.
    expect(a.verdict).toBe('order');
    expect(a.outlierItem).toBeUndefined();
    expect(a.moves.best?.kind).toBe('nextMeal');
    expect(mealMovesText(a)).toBe('Lunch was 400 kcal for 30 g of protein. You have 778 kcal left for 137 g today. Dinner carries it.');
    expect(JSON.parse(mealBreakdownNarrationRequest(a).userPrompt)).toMatchObject({ verdict: 'fine in itself; the day needs its order' });
  });
});

describe('the owner’s morning in the brief', () => {
  const input = () =>
    inputOf(
      [
        ...[1, 2, 3, 4, 5, 6].map((ago) => ({
          date: today.addDays(-ago),
          entries: [
            food(today.addDays(-ago), 'breakfast', 'Greek yogurt with oats', 500, 40, 12),
            food(today.addDays(-ago), 'lunch', 'Chicken rice bowl', 800, 70, 20),
            food(today.addDays(-ago), 'dinner', 'Salmon with potatoes', 850, 75, 35),
          ],
        })),
        { date: today, entries: breakfast },
      ],
      { history: [targets(yesterday.addDays(-200), ownersTargets)] },
    );

  it('is on track, with no drag and the breakfast as the last meal', () => {
    const brief = executiveBriefOf(input(), today)!;
    expect(brief.runwayState).toBe('onTrack');
    expect(brief.primaryDriver).toBeUndefined();
    expect(brief.lastMeal).toBe('breakfast');
    expect(executiveBriefArchetypeText(brief)).toBe('Breakfast is in and the day is on track. Nothing to fix. Build lunch and dinner around protein.');
    expect(executiveBriefArchetypeText({ ...brief, training })).toBe(
      'Breakfast is in and the day is on track. Nothing to fix. Build lunch and dinner around protein. Zero lifts of the three you set this week: book one tonight.',
    );
  });

  it('goes to the model without its totals, and none may come back', () => {
    const req = executiveBriefNarrationRequest({ ...executiveBriefOf(input(), today)!, training });
    const sent = JSON.parse(req.userPrompt) as Record<string, unknown>;
    expect(sent).toMatchObject({ verdict: 'on track: nothing to fix', lastMeal: 'breakfast', mealsToCome: ['lunch', 'dinner'] });
    for (const key of ['runwayState', 'kcalRemaining', 'proteinRemainingG', 'kcalLogged', 'requiredProteinDensityPercent']) expect(sent).not.toHaveProperty(key);
    expect(req.allowedNumbers).not.toContain(1935);
    expect(req.allowedNumbers).not.toContain(182);
    expect(req.allowedNumbers).toContain(3);
    expect(req.allowedNumbers).toContain(38);
    expect(req.systemPrompt).toContain('Never call a day on track tight, a squeeze or a problem');
  });

  it('refuses the words the owner’s phone showed', () => {
    const req = executiveBriefNarrationRequest({ ...executiveBriefOf(input(), today)!, training });
    expect(whyCoachNarrationRejected(ownersBrief, req)).toBe('It rambled');
    const twoSentences = 'Runway is tight with 1,935 kcal left and 182 g of protein still to hit. Breakfast drove the squeeze.';
    expect(whyCoachNarrationRejected(twoSentences, req)).toBe('It used a number not in your figures (1,935)');
    expect(whyCoachNarrationRejected('Breakfast is in and the day is on track. Lunch and dinner carry the protein. Zero lifts of the three you set: book one tonight.', req)).toBeUndefined();
  });

  it('is tight only when the rest of the day is lean protein only', () => {
    const target = (187 * 4) / 2178;
    expect(runwayIsTight(728 / 1935, target)).toBe(false);
    expect(runwayIsTight(0.49, target)).toBe(false);
    expect(runwayIsTight(0.62, target)).toBe(true);
    // A high-protein plan, 45% of its calories from protein, is tight only past 60%.
    expect(runwayIsTight(0.55, 0.45)).toBe(false);
    expect(runwayIsTight(0.61, 0.45)).toBe(true);
    const heavy = inputOf([{ date: today, entries: [food(today, 'breakfast', 'Pancakes with syrup', 1200, 60, 40)] }], {
      history: [targets(yesterday.addDays(-200), ownersTargets)],
    });
    const brief = executiveBriefOf(heavy, today)!;
    // 978 kcal left for 127 g: 52% protein from here.
    expect(brief.runwayState).toBe('tightRunway');
    expect(brief.primaryDriver?.foodName).toBe('Pancakes with syrup');
    expect(executiveBriefArchetypeText(brief)).toMatch(/^(Runway is tight: 978 kcal left for 127 g of protein\.|978 kcal left for 127 g of protein: tight\.) The breakfast pancakes with syrup, 1,200 kcal for 60 g, (is|are) the drag/);
    expect(executiveBriefArchetypeText(brief)).not.toMatch(/squeeze/);
  });
});
