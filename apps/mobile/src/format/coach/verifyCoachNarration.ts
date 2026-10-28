import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';

/**
 * Patterns that may never appear in any coaching narration, whether
 * deterministic or returned by a BYOK language model (MM-617, MM-663).
 */
const forbiddenPatterns: readonly RegExp[] = [
  /\b(fuck|shit|bitch|asshole|damn|hell|crap|bastard|dick|piss)\w*\b/i,
  /\b(you\s+are|your\s+body\s+is)\s+(fat|lazy|weak|disgusting|pathetic|worthless)\b/i,
  /\b(lazy|pathetic|worthless|disgusting|sinful|naughty)\b/i,
  /\bcheat\s+(day|meal)\b/i,
  /\bburn\s+(it\s+)?off\b/i,
  /\b(starve|skip\s+meals\s+tomorrow|eat\s+less\s+tomorrow)\b/i,
];

/**
 * Verifies that a candidate coaching narration (such as one returned by a BYOK
 * LLM provider) is non-empty, bounded in length, free of banned words, respects
 * the protected eating-disorder safeguard, and does not contradict the
 * mathematical invariant when protein is unrecoverable (MM-663).
 */
export function verifyCoachNarration(
  text: string,
  context: {
    readonly protectedPath: boolean;
    readonly proteinUnrecoverable: boolean;
    readonly allowedNumbers?: readonly number[] | undefined;
  },
): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 20 || trimmed.length > 900) return false;
  if (trimmed.includes('!')) return false;
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(trimmed)) return false;
  }
  if (context.protectedPath) {
    if (/\b(calorie|kcal|fat|skip|cut|halve|limit|over\s+budget|deficit)\b/i.test(trimmed)) {
      return false;
    }
  }
  if (context.proteinUnrecoverable) {
    // Must not instruct the user to eat the remaining protein tonight when mathematically impossible.
    if (/\b(get|eat|hit|find)\s+\d+\s*g\s+(more\s+)?protein\s+(in\s+)?(today|tonight|before\s+bed)\b/i.test(trimmed)) {
      return false;
    }
  }
  if (context.allowedNumbers !== undefined && context.allowedNumbers.length > 0) {
    const allowed = new Set<number>([0, 1, 2, 3, 4, 7, 14, 24, 30, 90, 100]);
    for (const value of context.allowedNumbers) {
      const rounded = roundHalfAwayFromZero(Math.abs(value)) + 0;
      allowed.add(rounded);
      allowed.add(Math.floor(Math.abs(value)));
      allowed.add(Math.ceil(Math.abs(value)));
    }
    for (const match of trimmed.matchAll(/\b\d[\d,]*\b/g)) {
      const parsed = Number(match[0].replace(/,/g, ''));
      if (!Number.isNaN(parsed) && !allowed.has(parsed)) {
        return false;
      }
    }
  }
  return true;
}
