import type { CoachNarrationRequest } from '../../domain/integration/CoachNarrationRequest';
import type { ExecutiveBrief } from '../../engine/analysis/ExecutiveBrief';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { executiveBriefArchetypeText } from './executiveBriefArchetypeText';

const systemPrompt =
  'You are the Martian Macros nutrition coach. Write 2 to 3 concise, direct sentences summarizing the user position from the supplied JSON only. ' +
  'Use only numbers present in the JSON, written as they are given, as whole numbers. Never use exclamation marks. Never moralize food. ' +
  'Speak in plain words: never say a JSON field name (a camelCase word) or a true or false value. ' +
  'When the JSON marks the protein left as unable to fit inside the calories left today, say that the protein gap cannot fit inside today’s calorie cap, tell the person to hold their calorie ceiling tonight, and to front-load protein in the morning.';

/**
 * Builds a `CoachNarrationRequest` from an `ExecutiveBrief`, pairing the
 * deterministic state hash and allowed numbers with the offline archetype
 * fallback (MM-665).
 */
export function executiveBriefNarrationRequest(brief: ExecutiveBrief): CoachNarrationRequest {
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
          replacement:
            driver.replacement === undefined
              ? undefined
              : {
                  name: driver.replacement.name,
                  kcal: wholeOr(driver.replacement.kcal),
                  proteinG: wholeOr(driver.replacement.proteinG),
                  caloriesSaved: whole(driver.replacement.caloriesSaved),
                  proteinGained: whole(driver.replacement.proteinGained),
                },
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
    const replacement = primaryDriver.replacement;
    if (replacement !== undefined) {
      if (replacement.kcal !== undefined) allowedNumbers.push(replacement.kcal);
      if (replacement.proteinG !== undefined) allowedNumbers.push(replacement.proteinG);
      allowedNumbers.push(replacement.caloriesSaved, replacement.proteinGained);
    }
  }
  return {
    cacheKey: `exec:${brief.briefHash}`,
    systemPrompt,
    userPrompt: JSON.stringify(payload),
    fallbackText: executiveBriefArchetypeText(brief),
    protectedPath: brief.protectedPath,
    proteinUnrecoverable: brief.proteinUnrecoverable,
    allowedNumbers,
  };
}
