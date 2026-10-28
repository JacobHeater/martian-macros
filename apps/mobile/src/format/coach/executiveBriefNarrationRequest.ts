import type { CoachNarrationRequest } from '../../domain/integration/CoachNarrationRequest';
import type { ExecutiveBrief } from '../../engine/analysis/ExecutiveBrief';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { executiveBriefArchetypeText } from './executiveBriefArchetypeText';

const systemPrompt =
  'You are the Martian Macros nutrition coach. Write 2 to 3 concise, direct sentences summarizing the user position from the supplied JSON only. ' +
  'Use only numbers present in the JSON. Never use exclamation marks. Never moralize food. ' +
  'When proteinUnrecoverable is true, state that the protein gap cannot fit inside today calorie cap, instruct the user to hold their calorie ceiling tonight, and front-load protein in the morning.';

/**
 * Builds a `CoachNarrationRequest` from an `ExecutiveBrief`, pairing the
 * deterministic state hash and allowed numbers with the offline archetype
 * fallback (MM-665).
 */
export function executiveBriefNarrationRequest(brief: ExecutiveBrief): CoachNarrationRequest {
  const densityPct = roundHalfAwayFromZero(brief.requiredProteinDensity * 100) + 0;
  const allowedNumbers: number[] = [
    brief.kcalLogged,
    brief.kcalTarget,
    Math.abs(brief.kcalRemaining),
    brief.proteinLoggedG,
    brief.proteinTargetG,
    brief.proteinRemainingG,
    densityPct,
    brief.sevenDay.loggedDays,
    brief.sevenDay.calorieAdherenceDays,
    brief.sevenDay.proteinFloorHitDays,
    brief.sevenDay.averageKcal,
    brief.sevenDay.averageProteinG,
    brief.sevenDay.weighIns,
  ];
  if (brief.primaryDriver !== undefined) {
    allowedNumbers.push(brief.primaryDriver.kcal, brief.primaryDriver.proteinG);
    if (brief.primaryDriver.replacement !== undefined) {
      if (brief.primaryDriver.replacement.kcal !== undefined) {
        allowedNumbers.push(brief.primaryDriver.replacement.kcal);
      }
      if (brief.primaryDriver.replacement.proteinG !== undefined) {
        allowedNumbers.push(brief.primaryDriver.replacement.proteinG);
      }
      allowedNumbers.push(
        brief.primaryDriver.replacement.caloriesSaved,
        brief.primaryDriver.replacement.proteinGained,
      );
    }
  }
  const payload = {
    runwayState: brief.runwayState,
    protectedPath: brief.protectedPath,
    proteinUnrecoverable: brief.proteinUnrecoverable,
    kcalLogged: brief.kcalLogged,
    kcalTarget: brief.kcalTarget,
    kcalRemaining: brief.kcalRemaining,
    proteinLoggedG: brief.proteinLoggedG,
    proteinTargetG: brief.proteinTargetG,
    proteinRemainingG: brief.proteinRemainingG,
    requiredProteinDensityPercent: densityPct,
    sevenDay: brief.sevenDay,
    primaryDriver: brief.primaryDriver,
  };
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
