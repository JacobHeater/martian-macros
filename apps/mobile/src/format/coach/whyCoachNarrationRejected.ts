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
 * Why a candidate coaching narration (such as one returned by a BYOK LLM
 * provider) may not be shown, in a few words, or undefined when it may: it
 * must be non-empty, bounded in length, free of banned words, respect the
 * protected eating-disorder safeguard, not contradict the mathematical
 * invariant when protein is unrecoverable, and cite only the figures it was
 * given (MM-663). The reason is shown by Settings' test of the voice (MM-671).
 */
export function whyCoachNarrationRejected(
  text: string,
  context: {
    readonly protectedPath: boolean;
    readonly proteinUnrecoverable: boolean;
    readonly allowedNumbers?: readonly number[] | undefined;
  },
): string | undefined {
  const trimmed = text.trim();
  if (trimmed.length < 20) return 'It said too little';
  if (trimmed.length > 900) return 'It said too much';
  if (trimmed.includes('!')) return 'It used an exclamation mark';
  // A JSON field read aloud ("Because proteinUnrecoverable is true", the owner's breakdown, MM-674).
  const fieldName = /\b[a-z]+[A-Z][A-Za-z]*\b/.exec(trimmed)?.[0];
  if (fieldName !== undefined) return `It read out a field name (${fieldName})`;
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(trimmed)) return 'It used a word the coach never uses';
  }
  if (context.protectedPath) {
    if (/\b(calorie|kcal|fat|skip|cut|halve|limit|over\s+budget|deficit)\b/i.test(trimmed)) {
      return 'It spoke of calories where only protein may be spoken of';
    }
  }
  if (context.proteinUnrecoverable) {
    // Must not instruct the user to eat the remaining protein tonight when mathematically impossible.
    if (/\b(get|eat|hit|find)\s+\d+\s*g\s+(more\s+)?protein\s+(in\s+)?(today|tonight|before\s+bed)\b/i.test(trimmed)) {
      return 'It asked for protein tonight that cannot fit in today’s calories';
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
    // A figure with a decimal part is one number (2176.9 kcal is 2177), never the digits after the point on their
    // own: the owner's first answer from Anthropic was refused for "903968363784" (MM-671).
    for (const match of trimmed.matchAll(/\b\d[\d,]*(?:\.\d+)?\b/g)) {
      const parsed = Number(match[0].replace(/,/g, ''));
      if (!Number.isNaN(parsed) && !allowed.has(roundHalfAwayFromZero(parsed) + 0)) {
        return `It used a number not in your figures (${match[0]})`;
      }
    }
  }
  return undefined;
}
