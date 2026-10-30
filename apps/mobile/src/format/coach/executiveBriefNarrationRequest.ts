import type { CoachNarrationRequest } from '../../domain/integration/CoachNarrationRequest';
import type { CoachToolbox } from '../../domain/integration/CoachToolbox';
import type { Meal } from '../../domain/Meal';
import type { ExecutiveBrief } from '../../engine/analysis/ExecutiveBrief';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { executiveBriefArchetypeText } from './executiveBriefArchetypeText';
import { mealMoveFigures } from '../../engine/analysis/moves/mealMoveFigures';

/** The brief's sentences and words at most (MM-693, the owner's shape: verdict, drag, order, one training line). */
const maxSentences = 4;
const maxWords = 60;

const systemPrompt =
  'You are the Martian Macros coach: direct, specific and accountable, a real coach, never a page of numbers. ' +
  `Answer in at most ${maxSentences} short sentences and ${maxWords} words, as the coach who looked at the day. No preamble: the first sentence is the verdict on today, in the verdict’s own words. ` +
  'A day on track has nothing to fix: say so, say which meals carry the protein, and give no food order, no drag and no totals. Never call a day on track tight, a squeeze or a problem. ' +
  'Only a day that is tight, over, or whose protein does not fit gets its order for tonight; then name the one food that is the drag once, with its calories and protein, and give its move for the next time that meal is built, never for tonight. ' +
  'The week stands in rows under your words (calorie adherence, protein floor, lifting, cardio, steps): never recite them. ' +
  'Training is one blunt order with at most one number, lifting first: hold the person to it. When training is covered, one short sentence says so. Never offer exercise as a way to make up for food. ' +
  'Use only numbers you were given or looked up, as whole numbers, and only the ones an order needs. Never use exclamation marks. Never moralize food. Do not soften an order with "maybe" or "try to". ' +
  'Speak in plain words: never say a field name (a camelCase word) or a true or false value. ' +
  'Speak as the coach who looked at the day: never mention figures, JSON, instructions or tools, never say what you are about to do or how you will answer, and never say that something is marked or flagged. ' +
  'When the protein left cannot fit inside the calories left today, say that it does not fit, tell the person to hold their calorie ceiling tonight and spend it on lean protein, and to front-load protein in the morning.';

/** The verdict on the day in plain words (MM-711), never a camelCase state the model could read aloud. */
const verdictWords: Record<ExecutiveBrief['runwayState'], string> = {
  nothingLogged: 'nothing logged yet',
  onTrack: 'on track: nothing to fix',
  tightRunway: 'tight: lean protein only from here',
  proteinUnrecoverable: 'the protein left does not fit in the calories left',
  overBudget: 'over for the day',
  targetsLocked: 'protein covered: hold the line',
};

/** The main meals still to come after `lastMeal` today. */
function mealsToCome(lastMeal: Meal | undefined): readonly Meal[] {
  const mains: readonly Meal[] = ['breakfast', 'lunch', 'dinner'];
  return lastMeal === undefined ? mains : mains.slice(mains.indexOf(lastMeal) + 1);
}

/** What the model is told when it has tools (MM-685): look, price, then order; every number from what it was given or looked up. */
const toolGuidance =
  ' You have tools. Before you order, read today_meals, week and training; search_catalog for a food when you want to name one; price any move you propose with price_move, and give only a move it allows. ' +
  'Every number you say must come from what you were given or a tool’s answer. Then answer in words alone, with no tool call, and without a word about the tools.';

/**
 * Builds a `CoachNarrationRequest` from an `ExecutiveBrief`, pairing the
 * deterministic state hash and allowed numbers with the offline archetype
 * fallback (MM-665); with the day's tools when a toolbox is given (MM-685),
 * and the brief's sentences and words at most (MM-693). A day on track
 * (MM-711) goes without its totals, and none is allowed back: the rows
 * under the words hold them, and there is nothing to order.
 */
export function executiveBriefNarrationRequest(brief: ExecutiveBrief, toolbox?: CoachToolbox): CoachNarrationRequest {
  // Every figure goes to the model whole: given 2176.903968363784 kcal it wrote it back, digit for digit (the
  // owner's first answer from Anthropic, MM-671). The engine's figures stay as they are; only what is said is rounded.
  const whole = (value: number) => roundHalfAwayFromZero(value) + 0;
  const wholeOr = (value: number | undefined) => (value === undefined ? undefined : whole(value));
  const densityPct = whole(brief.requiredProteinDensity * 100);
  const sevenDay = {
    loggedDays: brief.sevenDay.loggedDays,
    calorieAdherenceDays: brief.sevenDay.calorieAdherenceDays,
    proteinFloorHitDays: brief.sevenDay.proteinFloorHitDays,
    averageKcal: whole(brief.sevenDay.averageKcal),
    averageProteinG: whole(brief.sevenDay.averageProteinG),
    weighIns: brief.sevenDay.weighIns,
  };
  const driver = brief.primaryDriver;
  const primaryDriver =
    driver === undefined
      ? undefined
      : {
          meal: driver.meal,
          mealName: driver.mealName,
          foodName: driver.foodName,
          kcal: whole(driver.kcal),
          proteinG: whole(driver.proteinG),
          fatG: whole(driver.fatG),
          withoutKcalOver: wholeOr(driver.withoutKcalOver),
          move: driver.move === undefined ? undefined : mealMoveFigures(driver.move).figures,
        };
  const t = brief.training;
  const training =
    t === undefined
      ? undefined
      : {
          goal: t.goal,
          cardioHeld: t.cardioHeld,
          liftingSessionsThisWeek: t.sessionsThisWeek,
          liftingSessionsSet: t.sessionsTarget,
          liftingSessionsToGo: Math.max(0, t.sessionsTarget - t.sessionsThisWeek),
          daysSinceLastLift: t.daysSinceSession,
          watchConnected: t.wearableInUse,
          cardioMinutesThisWeek: t.cardioMinutes,
          cardioMinutesFloor: t.cardioFloorMinutes,
          cardioMinutesMore: Math.max(0, t.cardioFloorMinutes - t.cardioMinutes),
          stepsPerDay: t.stepsPerDay,
          stepsFloor: t.stepsFloor,
          stepsMorePerDay: t.stepsPerDay === undefined ? undefined : Math.max(0, t.stepsFloor - t.stepsPerDay),
        };
  // The day's totals (MM-711): none on a day on track, the calories left when protein is covered, all otherwise.
  const onTrack = brief.runwayState === 'onTrack';
  const totals: Readonly<Record<string, number>> = onTrack
    ? {}
    : brief.runwayState === 'targetsLocked'
      ? { kcalRemaining: whole(brief.kcalRemaining) }
      : {
          kcalLogged: whole(brief.kcalLogged),
          kcalTarget: whole(brief.kcalTarget),
          kcalRemaining: whole(brief.kcalRemaining),
          proteinLoggedG: whole(brief.proteinLoggedG),
          proteinTargetG: whole(brief.proteinTargetG),
          proteinRemainingG: whole(brief.proteinRemainingG),
          requiredProteinDensityPercent: densityPct,
        };
  const payload = {
    verdict: verdictWords[brief.runwayState],
    lastMeal: brief.lastMeal,
    mealsToCome: mealsToCome(brief.lastMeal),
    protectedPath: brief.protectedPath,
    proteinUnrecoverable: brief.proteinUnrecoverable,
    ...totals,
    sevenDay,
    primaryDriver,
    training,
  };
  const allowedNumbers: number[] = [
    ...Object.values(totals).map(Math.abs),
    sevenDay.loggedDays,
    sevenDay.calorieAdherenceDays,
    sevenDay.proteinFloorHitDays,
    sevenDay.averageKcal,
    sevenDay.averageProteinG,
    sevenDay.weighIns,
  ];
  if (primaryDriver !== undefined) {
    allowedNumbers.push(primaryDriver.kcal, primaryDriver.proteinG, primaryDriver.fatG);
    if (primaryDriver.withoutKcalOver !== undefined) allowedNumbers.push(primaryDriver.withoutKcalOver);
    if (driver?.move !== undefined) allowedNumbers.push(...mealMoveFigures(driver.move).numbers);
  }
  if (training !== undefined) {
    // Minutes may come back as hours and minutes ("1 h 36 min"): both parts are allowed too.
    const minutes = [training.cardioMinutesThisWeek, training.cardioMinutesFloor, training.cardioMinutesMore];
    allowedNumbers.push(
      training.liftingSessionsThisWeek,
      training.liftingSessionsSet,
      training.liftingSessionsToGo,
      ...minutes,
      ...minutes.flatMap((m) => [Math.floor(m / 60), m % 60]),
      training.stepsFloor,
    );
    if (training.daysSinceLastLift !== undefined) allowedNumbers.push(training.daysSinceLastLift);
    if (training.stepsPerDay !== undefined) allowedNumbers.push(training.stepsPerDay);
    if (training.stepsMorePerDay !== undefined) allowedNumbers.push(training.stepsMorePerDay);
  }
  return {
    cacheKey: `exec:${brief.briefHash}`,
    systemPrompt: toolbox === undefined ? systemPrompt : `${systemPrompt}${toolGuidance}`,
    userPrompt: JSON.stringify(payload),
    fallbackText: executiveBriefArchetypeText(brief),
    protectedPath: brief.protectedPath,
    proteinUnrecoverable: brief.proteinUnrecoverable,
    allowedNumbers,
    maxSentences,
    maxWords,
    ...(toolbox === undefined ? {} : { toolbox }),
  };
}
