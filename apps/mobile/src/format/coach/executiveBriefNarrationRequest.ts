import type { CoachNarrationRequest } from '../../domain/integration/CoachNarrationRequest';
import type { CoachToolbox } from '../../domain/integration/CoachToolbox';
import type { ExecutiveBrief } from '../../engine/analysis/ExecutiveBrief';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { executiveBriefArchetypeText } from './executiveBriefArchetypeText';
import { mealMoveFigures } from '../../engine/analysis/moves/mealMoveFigures';

const systemPrompt =
  'You are the Martian Macros coach: direct, specific and accountable, a real coach, never a page of numbers. Write 2 to 4 short sentences on where the person stands today and this week from the figures given, ending in one order. ' +
  'When the figures name a primary driver, name that food with its calories and protein as the drag, and give its move where one is given. ' +
  'Use only numbers present in the figures, written as they are given, as whole numbers. Never use exclamation marks. Never moralize food. ' +
  'Speak in plain words: never say a field name (a camelCase word) or a true or false value. ' +
  'Speak as the coach who looked at the day: never mention figures, JSON, instructions or tools, never say what you are about to do, and never say that something is marked or flagged. ' +
  'When the figures say the protein left cannot fit inside the calories left today, say that the protein gap cannot fit inside today’s calorie cap, tell the person to hold their calorie ceiling tonight, and to front-load protein in the morning. ' +
  'When the figures have a training block, hold the person to it in one or two blunt sentences: lifting sessions this week against the sessions they set, and, where cardio is held, cardio minutes and steps a day against their floors, ordering the shortfall. Never offer exercise as a way to make up for food.';

/** What the model is told when it has tools (MM-685): look, price, then order; every number from what it was given or looked up. */
const toolGuidance =
  ' You have tools. Before you order, read today_meals, week and training; search_catalog for a food when you want to name one; price any move you propose with price_move, and give only a move it allows. ' +
  'Every number you say must come from the figures or a tool’s answer. Then answer in words alone, with no tool call, and without a word about the tools.';

/**
 * Builds a `CoachNarrationRequest` from an `ExecutiveBrief`, pairing the
 * deterministic state hash and allowed numbers with the offline archetype
 * fallback (MM-665); with the day's tools when a toolbox is given (MM-685).
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
  const payload = {
    runwayState: brief.runwayState,
    protectedPath: brief.protectedPath,
    proteinUnrecoverable: brief.proteinUnrecoverable,
    kcalLogged: whole(brief.kcalLogged),
    kcalTarget: whole(brief.kcalTarget),
    kcalRemaining: whole(brief.kcalRemaining),
    proteinLoggedG: whole(brief.proteinLoggedG),
    proteinTargetG: whole(brief.proteinTargetG),
    proteinRemainingG: whole(brief.proteinRemainingG),
    requiredProteinDensityPercent: densityPct,
    sevenDay,
    primaryDriver,
    training,
  };
  const allowedNumbers: number[] = [
    payload.kcalLogged,
    payload.kcalTarget,
    Math.abs(payload.kcalRemaining),
    payload.proteinLoggedG,
    payload.proteinTargetG,
    payload.proteinRemainingG,
    densityPct,
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
    ...(toolbox === undefined ? {} : { toolbox }),
  };
}
