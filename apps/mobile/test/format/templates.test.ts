import { describe, expect, it } from 'vitest';
import { CalendarDate, FoodEntry, NutritionTotals, type Portion, Workout, WorkoutExercise, WorkoutSet } from '../../src/domain';
import { CoachConfidence, ExplanationLine, type ProgressionSuggestion, TargetsExplanation } from '../../src/engine';
import { CatalogFood } from '../../src/foodCatalog';
import { confidenceNextStepText } from '../../src/format/confidenceNextStepText';
import { explanationLineText } from '../../src/format/explanationLineText';
import { extraNutrientsLine } from '../../src/format/extraNutrientsLine';
import { Fmt } from '../../src/format/Fmt';
import { foodSourceLabel } from '../../src/format/foodSourceLabel';
import { importedWeighInText } from '../../src/format/importedWeighInText';
import { loggingStreakText } from '../../src/format/loggingStreakText';
import { personalRecordText } from '../../src/format/personalRecordText';
import { portionSummary } from '../../src/format/portionSummary';
import { progressionSettingsText } from '../../src/format/progressionSettingsText';
import { progressionText } from '../../src/format/progressionText';
import { reliefOfferText } from '../../src/format/reliefOfferText';
import { restTargetText } from '../../src/format/restTargetText';
import { roundedToZeroNote } from '../../src/format/roundedToZeroNote';
import { setText } from '../../src/format/setText';
import { underEatingText } from '../../src/format/underEatingText';
import { whatWouldChangeIt } from '../../src/format/whatWouldChangeIt';
import { workoutSummaryText } from '../../src/format/workoutSummaryText';

/**
 * Added in the move. The Flutter app tested these sentences through its
 * screens; here each is tested where it is made. The expected text is the
 * Dart function's own documented example where it has one, and otherwise
 * what the Dart source says for that branch.
 */
const metric = new Fmt('metric');
const imperial = new Fmt('imperial');
const day = CalendarDate.of(2026, 10, 5);

describe('a set', () => {
  const set = (reps: number, lb: number, rir?: number) => new WorkoutSet({ reps, loadKg: imperial.weightToKg(lb), rir });

  it('with added weight: "8 × 225 lb", and reps in reserve when recorded', () => {
    expect(setText(set(8, 225), imperial, 'addedWeight')).toBe('8 × 225 lb');
    expect(setText(set(8, 225, 2), imperial, 'addedWeight')).toBe('8 × 225 lb · 2 RIR');
    expect(setText(set(8, 225, 5), imperial, 'addedWeight')).toBe('8 × 225 lb · 5+ RIR');
    expect(setText(new WorkoutSet({ reps: 5, loadKg: 102.5 }), metric, 'addedWeight')).toBe('5 × 102.5 kg');
  });

  it('with bodyweight: reps alone, added weight with a plus, or assisted', () => {
    expect(setText(set(8, 0), imperial, 'bodyweight')).toBe('8 reps');
    expect(setText(set(1, 0), imperial, 'bodyweight')).toBe('1 rep');
    expect(setText(set(8, 25), imperial, 'bodyweight')).toBe('8 × +25 lb');
    expect(setText(set(8, -20), imperial, 'bodyweight')).toBe('8 × 20 lb assisted');
  });
});

describe('a suggestion for next time', () => {
  const suggestion = (kind: ProgressionSuggestion['kind'], loadKg: number): ProgressionSuggestion => ({
    kind,
    loadKg,
    reps: 6,
    lastLoadKg: loadKg,
    lastReps: [10, 10],
    rangeTop: 10,
  });

  it('says what a step up would be, in the user’s units', () => {
    expect(progressionText(suggestion('addReps', 100), metric, 'addedWeight')).toBe(
      'One more rep on any set would be a step up.',
    );
    expect(progressionText(suggestion('addLoad', 102.5), metric, 'addedWeight')).toBe(
      'Every set reached 10 last time. A step up would be 102.5 kg × 6.',
    );
    expect(progressionText(suggestion('hold', 100), metric, 'addedWeight')).toBe(
      'No more reps at this load in three sessions. Holding 100 kg × 6 is a fair aim.',
    );
    expect(progressionText(suggestion('match', 100), metric, 'addedWeight')).toBe(
      'Matching last time holds your strength while you lose fat.',
    );
  });

  it('for bodyweight: reps alone, a plus for added weight, or assisted', () => {
    expect(progressionText(suggestion('addLoad', 0), metric, 'bodyweight')).toBe(
      'Every set reached 10 last time. A step up would be 6 reps.',
    );
    expect(progressionText(suggestion('addLoad', 5), metric, 'bodyweight')).toBe(
      'Every set reached 10 last time. A step up would be +5 kg × 6.',
    );
    expect(progressionText(suggestion('hold', -10), metric, 'bodyweight')).toBe(
      'No more reps at this load in three sessions. Holding 10 kg assisted × 6 is a fair aim.',
    );
  });

  it('the range and step it works with: "6 to 10 reps · 5 lb steps"', () => {
    expect(
      progressionSettingsText({ repsLow: 6, repsHigh: 10, loadStepKg: imperial.weightToKg(5), fmt: imperial }),
    ).toBe('6 to 10 reps · 5 lb steps');
    expect(progressionSettingsText({ repsLow: 3, repsHigh: 6, loadStepKg: 2.5, fmt: metric })).toBe(
      '3 to 6 reps · 2.5 kg steps',
    );
  });
});

describe('a workout in a line', () => {
  const six = new Date(2026, 9, 5, 18);
  const squats = (sets: number) =>
    new WorkoutExercise({
      exerciseId: 'back-squat',
      sets: Array.from({ length: sets }, () => new WorkoutSet({ reps: 8, loadKg: 100 })),
    });

  it('"3 exercises · 9 sets · 55 min", without the time while in progress', () => {
    const exercises = [squats(3), squats(3), squats(3)];
    const done = new Workout({ id: 1, date: day, startedAt: six, endedAt: new Date(six.getTime() + 55 * 60000), exercises });
    expect(workoutSummaryText(done)).toBe('3 exercises · 9 sets · 55 min');
    expect(workoutSummaryText(new Workout({ id: 1, date: day, startedAt: six, exercises }))).toBe('3 exercises · 9 sets');
  });

  it('counts one of each in the singular, leaves out a pause, and adds records', () => {
    const one = new Workout({
      id: 1,
      date: day,
      startedAt: six,
      endedAt: new Date(six.getTime() + 30 * 60000 + 59000),
      pausedForMs: 10 * 60000,
      exercises: [squats(1)],
    });
    expect(workoutSummaryText(one)).toBe('1 exercise · 1 set · 20 min');
    expect(workoutSummaryText(one, { records: 1 })).toBe('1 exercise · 1 set · 20 min · 1 personal record');
    expect(workoutSummaryText(one, { records: 2 })).toBe('1 exercise · 1 set · 20 min · 2 personal records');
  });
});

describe('what was eaten', () => {
  const entry = (portion?: Portion, extras: { fiberG?: number; sugarAlcoholsG?: number; sodiumMg?: number; alcoholG?: number } = {}) =>
    new FoodEntry({
      id: 1,
      date: day,
      meal: 'lunch',
      name: 'Food',
      kcal: 240,
      proteinG: 15,
      carbsG: 22.5,
      fatG: 9,
      source: portion?.method ?? 'weighed',
      portion,
      ...extras,
    });
  const perServing = {
    basis: 'perServing',
    nutrition: new NutritionTotals({ kcal: 160.4, proteinG: 10, carbsG: 15, fatG: 6 }),
    servingDescription: '1 bar',
    servingGrams: 40,
  } as const;
  const per100g = {
    basis: 'per100g',
    nutrition: new NutritionTotals({ kcal: 389, proteinG: 17, carbsG: 66, fatG: 7 }),
  } as const;

  it('an entry from before portions were recorded says so', () => {
    expect(portionSummary(entry())).toBe('Weighed · amount not recorded');
  });

  it('a portion with no amount is an estimate of the totals', () => {
    expect(portionSummary(entry({ method: 'quickAdd', basis: 'enteredTotals' }))).toBe('Estimated totals');
  });

  it('servings name the serving, with its weight and what it was calculated from', () => {
    expect(
      portionSummary(
        entry({ method: 'labelServing', basis: 'calculated', quantity: 1.5, unit: 'serving', reference: perServing }),
      ),
    ).toBe('1.5 × 1 bar (60 g) · calculated from 160 kcal per serving');
  });

  it('a weight is not given its weight again', () => {
    expect(
      portionSummary(entry({ method: 'weighed', basis: 'calculated', quantity: 80, unit: 'gram', reference: per100g })),
    ).toBe('80 g · calculated from 389 kcal per 100 g');
  });

  it('typed totals say they were typed, and a hand portion says it is estimated', () => {
    expect(
      portionSummary(entry({ method: 'householdMeasure', basis: 'enteredTotals', quantity: 2, unit: 'cup' })),
    ).toBe('2 cups · totals entered by you');
    expect(
      portionSummary(
        entry({ method: 'palm', basis: 'calculated', quantity: 1, unit: 'palm', reference: per100g, impliedGrams: 99.6 }),
      ),
    ).toBe('1 palm (100 g) · estimated');
  });

  it('the extra nutrients are only the ones the source stated', () => {
    expect(extraNutrientsLine(entry(), true)).toBeUndefined();
    expect(extraNutrientsLine(entry(undefined, { fiberG: 4.5, sodiumMg: 349.5, alcoholG: 0 }), false)).toBe(
      'Fiber 5 g · Net carbs 18 g · Sodium 350 mg',
    );
    expect(extraNutrientsLine(entry(undefined, { alcoholG: 10.6 }), true)).toBe('Alcohol 11 g');
  });

  // MM-396, the designer's PD-1: while carbs are shown net, the line gives the total, so no entry shows net twice.
  it('the extra line gives the carbohydrate figure the entry is not shown as', () => {
    const bar = entry(undefined, { fiberG: 9, sugarAlcoholsG: 10 });
    expect(extraNutrientsLine(bar, true)).toBe(`Fiber 9 g · Sugar alcohols 10 g · Total carbs ${Math.round(bar.carbsG)} g`);
    expect(extraNutrientsLine(bar, false)).toBe(`Fiber 9 g · Sugar alcohols 10 g · Net carbs ${Math.round(bar.netCarbsG)} g`);
  });
});

describe('a food from a pack', () => {
  const food = (source: string, kcal = 100) =>
    new CatalogFood({ id: 1, packId: 'p', name: 'Food', kcal, proteinG: 1, carbsG: 1, fatG: 1, source, tier: 'label', tierReason: '' });

  it('says where its numbers came from, and never "verified"', () => {
    expect(foodSourceLabel(food('usda_foundation'))).toBe('USDA, lab-analyzed');
    expect(foodSourceLabel(food('usda_sr_legacy'))).toBe('USDA, lab-analyzed');
    expect(foodSourceLabel(food('usda_branded'))).toBe('Manufacturer label (USDA)');
    expect(foodSourceLabel(food('off'))).toBe('Community label (Open Food Facts)');
    expect(foodSourceLabel(food('user_scan'))).toBe('Your label scan');
    expect(foodSourceLabel(food('user'))).toBe('Your food');
    expect(foodSourceLabel(food('estimate'))).toBe('Estimate');
    expect(foodSourceLabel(food('something else'))).toBe('Food database');
  });

  it('a tiny serving that rounds to zero energy gets a note; others do not', () => {
    const note = 'Labels may round small servings to zero. Many servings add up.';
    expect(roundedToZeroNote(food('off', 8), { description: '1 spray', grams: 0.25 })).toBe(note);
    expect(roundedToZeroNote(food('off', 8), { description: '1 tsp', grams: 5 })).toBeUndefined();
    expect(roundedToZeroNote(food('off', 884), { description: '1 spray', grams: 0.25 })).toBeUndefined();
  });
});

describe('why targets changed', () => {
  it('names each cause and its size', () => {
    expect(explanationLineText(new ExplanationLine('firstTargets', 0))).toBe(
      'Your first targets, from your starting estimate of expenditure.',
    );
    expect(explanationLineText(new ExplanationLine('expenditureEstimate', -90, { from: 2950, to: 2860 }))).toBe(
      'Your expenditure is 2,860 kcal a day, down from 2,950 (−90).',
    );
    expect(explanationLineText(new ExplanationLine('expenditureEstimate', 40, { from: 2400, to: 2440 }))).toBe(
      'Your expenditure is 2,440 kcal a day, up from 2,400 (+40).',
    );
    expect(explanationLineText(new ExplanationLine('goalChange', 0))).toBe('You changed your goal (0).');
    expect(explanationLineText(new ExplanationLine('stepLimit', 15))).toBe(
      'Weekly changes are limited, so 15 kcal of the decrease is held for next week.',
    );
    expect(explanationLineText(new ExplanationLine('stepLimit', -1250.4))).toBe(
      'Weekly changes are limited, so 1,250 kcal of the increase is held for next week.',
    );
    expect(explanationLineText(new ExplanationLine('calorieFloor', 120, { from: 1380, to: 1500 }))).toBe(
      'Your calorie floor is 1,500 kcal; the target would otherwise be 1,380 kcal.',
    );
    expect(explanationLineText(new ExplanationLine('userHold', 0))).toBe('You kept last week’s targets for now (0).');
    expect(explanationLineText(new ExplanationLine('paceChange', 180))).toBe('You chose a different pace (+180).');
  });

  it('what would change them next, in order of what matters most', () => {
    const explanation = (
      lines: readonly ExplanationLine[],
      { held = false, excludedPartialDays = 0 }: { held?: boolean; excludedPartialDays?: number } = {},
    ) => new TargetsExplanation({ lines, newKcal: 2300, estimateStatus: held ? 'held' : 'updated', excludedPartialDays });

    expect(whatWouldChangeIt(explanation([new ExplanationLine('calorieFloor', 1)], { held: true }))).toBe(
      'More fully logged days and regular weigh-ins would let the app measure your expenditure.',
    );
    expect(
      whatWouldChangeIt(explanation([new ExplanationLine('stepLimit', 1), new ExplanationLine('calorieFloor', 1)])),
    ).toBe('The floor stays until your resting energy or body-fat estimate changes.');
    expect(whatWouldChangeIt(explanation([new ExplanationLine('stepLimit', 1)], { excludedPartialDays: 2 }))).toBe(
      'The rest of the change arrives over the next weeks, in weekly steps.',
    );
    expect(whatWouldChangeIt(explanation([], { excludedPartialDays: 2 }))).toBe(
      'More complete days would make this estimate firmer.',
    );
    expect(whatWouldChangeIt(explanation([]))).toBe(
      'If your weight trend changes at this intake, expect targets to follow.',
    );
  });
});

describe('how sure the coach is', () => {
  const confidence = (nextStep: CoachConfidence['nextStep'], usableFoodDays: number, weighInDays: number) =>
    new CoachConfidence({
      level: 'learning',
      estimate: 'learning',
      foodLog: 'learning',
      weighIns: 'learning',
      stability: 'good',
      nextStep,
      usableFoodDays,
      weighInDays,
    });

  it('counts the days still needed, in the singular for one', () => {
    expect(confidenceNextStepText(confidence('completeFoodLog', 7, 0))).toBe(
      'Log food and mark days complete when they are. You need 3 more usable days to reach the minimum.',
    );
    expect(confidenceNextStepText(confidence('completeFoodLog', 9, 0))).toBe(
      'Log food and mark days complete when they are. You need 1 more usable day to reach the minimum.',
    );
    expect(confidenceNextStepText(confidence('completeFoodLog', 14, 0))).toBe(
      'Mark days complete when they are. 6 more usable days would make the estimate firmer.',
    );
    expect(confidenceNextStepText(confidence('recordWeight', 20, 5))).toBe(
      'Weigh in on 3 more mornings to make the estimate clearer.',
    );
    expect(confidenceNextStepText(confidence('recordWeight', 20, 12))).toBe(
      'Weigh in on 8 more mornings to make the estimate clearer.',
    );
  });

  it('says so when there is nothing to do', () => {
    expect(confidenceNextStepText(confidence('waitForStability', 20, 20))).toBe(
      'Nothing to do: the estimate is settling after a recent change.',
    );
  });
});

describe('quiet lines', () => {
  it('a logging streak is mentioned from three days, with the forgiven day when there was one', () => {
    expect(loggingStreakText({ days: 2 })).toBeUndefined();
    expect(loggingStreakText({ days: 3 })).toBe('3 whole days logged in a row.');
    expect(loggingStreakText({ days: 12, forgivenOn: day })).toBe(
      '12 whole days logged in a row. A missed day is forgiven, once a week.',
    );
  });

  it('a personal record: "Back squat: estimated max 110.0 kg, up from 107.5 kg."', () => {
    expect(
      personalRecordText({ exerciseId: 'back-squat', name: 'Back squat', estimateKg: 110, previousBestKg: 107.5 }, metric),
    ).toBe('Back squat: estimated max 110.0 kg, up from 107.5 kg.');
  });

  it('a rest target: "2:00", or "None"', () => {
    expect(restTargetText(120000)).toBe('2:00');
    expect(restTargetText(undefined)).toBe('None');
  });

  it('an imported weigh-in says where it came from and why it counts', () => {
    const at = new Date(2026, 9, 5, 6, 42);
    const weighIn = { day: at, kg: 80, sourceName: 'Bathroom scale' };
    expect(importedWeighInText({ ...weighIn, basis: 'firstMorning', readings: 2, at }, 'android')).toBe(
      'From Bathroom scale at 6:42 AM.',
    );
    expect(importedWeighInText({ ...weighIn, basis: 'medianOfDay', readings: 3 }, 'android')).toBe(
      'The middle of 3 readings from Bathroom scale.',
    );
    expect(importedWeighInText({ ...weighIn, basis: 'medianOfDay', readings: 1 }, 'android')).toBe('From Bathroom scale.');
  });
});

describe('notices', () => {
  it('under-eating: what was seen, the innocent explanation first, support only when asked for', () => {
    const finding = { averageKcal: 1149.6, floorKcal: 1500, days: 7, lowDays: [] };
    const base =
      'Your logged days average 1,150 kcal. The lowest the app would ever suggest for you is 1,500. ' +
      'If those days are missing food, mark them partial. ' +
      'If they are complete, that is less than the app considers enough. Eating at your target will not slow ' +
      'your progress the way it feels like it will.';
    expect(underEatingText(finding, { supportLine: false })).toBe(base);
    expect(underEatingText(finding, { supportLine: true })).toBe(
      `${base} If eating has become a source of distress, a doctor or a registered dietitian is the right person to talk to.`,
    );
  });

  it('easing a deficit: a break or a slower pace, and sleep only when it has been short', () => {
    const hard = ['hardCheckIns'] as const;
    const signals = { reason: 'recoverySignals', signals: hard, fallingLifts: [], sleepAverage: undefined, shortSleep: false } as const;
    const early = reliefOfferText({ ...signals, suggestion: 'slowerPace', slowerPace: 0.005, deficitWeeks: 3 });
    expect(early.title).toBe('Two hard weeks in a row');
    expect(early.suggestion).toBe(
      'The coach would slow the pace: you are early in this deficit, and a gentler pace is easier to hold than a break.',
    );
    expect(early.sleep).toBeUndefined();

    const late = reliefOfferText({ ...signals, suggestion: 'break', slowerPace: 0.005, deficitWeeks: 9, shortSleep: true });
    expect(late.suggestion).toBe(
      'The coach would take a break: you are 9 weeks into this deficit, and two weeks at maintenance is a rest from dieting, ' +
        'which many people find makes the next weeks easier. Once taken, it runs its two weeks.',
    );
    expect(late.sleep).toContain('under six hours');

    const noSlower = reliefOfferText({ ...signals, suggestion: 'break', slowerPace: undefined, deficitWeeks: 2 });
    expect(noSlower.suggestion).toBe(
      'The coach would take a break: two weeks at maintenance is a rest from dieting, which many people find makes the next ' +
        'weeks easier, and the deficit resumes after it. Once taken, it runs its two weeks.',
    );

    // MM-252: short sleep from the record is a signal of its own, with its own title and the average in the body.
    const from = CalendarDate.of(2026, 9, 22);
    const sleepOnly = reliefOfferText({
      reason: 'recoverySignals',
      suggestion: 'slowerPace',
      slowerPace: 0.005,
      deficitWeeks: 3,
      shortSleep: true,
      signals: ['shortSleep'],
      fallingLifts: [],
      sleepAverage: { averageMinutes: 330, nights: 12, from, to: from.addDays(13) },
    });
    expect(sleepOnly.title).toBe('Two weeks of short sleep');
    expect(sleepOnly.body).toBe(
      'Your sleep averaged 5 h 30 m over the last 12 nights. With short sleep, more of what you lose appears to be lean tissue and hunger runs higher.',
    );
    expect(sleepOnly.suggestion).toContain('slow the pace');
    expect(sleepOnly.sleep).toBeUndefined();
  });

  // MM-117: falling lifts have their own title alone, a sentence beside the hard weeks, and carrying on answers a deload.
  it('easing a deficit when lifts are falling', () => {
    const lifts = [
      { exerciseId: 'back-squat', name: 'Back squat', fromKg: 120, toKg: 112, sessions: 3 },
      { exerciseId: 'barbell-row', name: 'Barbell row', fromKg: 80, toKg: 75, sessions: 4 },
    ];
    const base = { reason: 'recoverySignals', fallingLifts: lifts, sleepAverage: undefined, shortSleep: false } as const;
    const alone = reliefOfferText({ ...base, signals: ['strengthFalling'], suggestion: 'break', slowerPace: 0.005, deficitWeeks: 9 });
    expect(alone.title).toBe('Your lifts are falling');
    expect(alone.body).toBe(
      'Over three weeks your estimated max has dropped 5% or more on back squat and barbell row, going by the trend, not one ' +
        'session. On a deficit that usually means it is too large, or has run too long, for you right now. Easing it is the fix. ' +
        'A planned lighter week does this too; if that is it, carry on.',
    );
    expect(alone.suggestion).toContain('take a break');
    const early = reliefOfferText({ ...base, signals: ['strengthFalling'], suggestion: 'slowerPace', slowerPace: 0.005, deficitWeeks: 3 });
    expect(early.suggestion).toContain('easier to hold than a break');

    const both = reliefOfferText({ ...base, signals: ['hardCheckIns', 'strengthFalling'], suggestion: 'break', slowerPace: 0.005, deficitWeeks: 9 });
    expect(both.title).toBe('Two hard weeks in a row');
    expect(both.body).toContain('back squat and barbell row');

    const many = reliefOfferText({
      ...base,
      fallingLifts: [...lifts, { exerciseId: 'deadlift', name: 'Deadlift', fromKg: 150, toKg: 140, sessions: 3 }],
      signals: ['strengthFalling'],
      suggestion: 'break',
      slowerPace: 0.005,
      deficitWeeks: 9,
    });
    expect(many.body).toContain('back squat, barbell row and 1 more');
    for (const text of [alone.title, alone.body, alone.suggestion, both.body]) {
      expect(text.toLowerCase()).not.toMatch(/eat less|cardio|train more|exercise|push through/);
    }
  });

  // MM-135: the offer at twelve unbroken weeks says what a break is and what happens at twenty, and claims nothing about metabolism.
  it('twelve weeks in a deficit: the break offer names the weeks and the cap', () => {
    const offer = reliefOfferText({ reason: 'longDeficit', suggestion: 'break', slowerPace: undefined, deficitWeeks: 12, shortSleep: false, signals: [], fallingLifts: [], sleepAverage: undefined });
    expect(offer.title).toBe('12 weeks in a deficit');
    expect(offer.body).toBe(
      'A break is two weeks at maintenance: a rest from dieting, which many people find makes the next weeks easier. ' +
        'The deficit resumes after it, and the count starts again. Once taken, it runs its two weeks.',
    );
    expect(offer.suggestion).toBe(
      'The coach would take the break now. If you carry on, the coach asks again in three weeks, and at 20 weeks it plans a break itself.',
    );
    expect(offer.sleep).toBeUndefined();
    for (const text of [offer.title, offer.body, offer.suggestion]) {
      expect(text.toLowerCase()).not.toMatch(/metabol|reset|recover|repair/);
    }
    // Near the cap, "asks again in three weeks" would be false (the panel's UX-3): the planned break is what comes next.
    const at = (deficitWeeks: number) =>
      reliefOfferText({ reason: 'longDeficit', suggestion: 'break', slowerPace: undefined, deficitWeeks, shortSleep: false, signals: [], fallingLifts: [], sleepAverage: undefined }).suggestion;
    expect(at(16)).toContain('asks again in three weeks');
    expect(at(17)).toBe('The coach would take the break now. If you carry on, the app plans the break itself in 3 weeks, at 20 weeks.');
    expect(at(18)).toBe('The coach would take the break now. If you carry on, the app plans the break itself in 2 weeks, at 20 weeks.');
    expect(at(19)).toBe('The coach would take the break now. If you carry on, the app plans the break itself at the next check-in, at 20 weeks.');
  });
});
