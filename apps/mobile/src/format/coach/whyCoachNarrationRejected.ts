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
 * Words about the figures, the instructions or the tools instead of the
 * day (MM-689): the owner's brief of 2026-10-28 opened "I'll work from
 * the JSON you supplied; the protein gap is marked as unable to fit".
 */
const metaTalk: readonly RegExp[] = [
  /\bjson\b/i,
  /\b(you|that\s+you)\s+(supplied|provided|sent|gave\s+me)\b/i,
  /\bI\s+(was|have\s+been|(?:'|’)ve\s+been)\s+(given|supplied|provided|sent)\b/i,
  /\b(supplied|provided|given)\s+(json|data|figures|numbers|input|payload)\b/i,
  /\b(data|figures|numbers|input|payload)\s+(you\s+|that\s+you\s+)?(supplied|provided|gave|sent)\b/i,
  /\b(according\s+to|based\s+on|from)\s+(the|your)\s+(json|data|figures|payload|input)\b/i,
  /\bI(?:'|’)?(?:ll|\s+will|\s+am\s+going\s+to|(?:'|’)m\s+going\s+to)\s+(work|go|start)\s+(from|with|off|straight)\b/i,
  /\b(is|are|was|were)\s+(marked|flagged)\s+as\b/i,
  /\b(the|a|my|your)\s+(tools?|function|tool\s+calls?|instructions?|prompt|system\s+prompt)\b/i,
  /\b(tool|function)\s+(call|calls|answer|result|results|output)s?\b/i,
];

/**
 * Why a candidate coaching narration (such as one returned by a BYOK LLM
 * provider) may not be shown, in a few words, or undefined when it may: it
 * must be non-empty, bounded in length, free of banned words, respect the
 * protected eating-disorder safeguard, not contradict the mathematical
 * invariant when protein is unrecoverable, and cite only the figures it was
 * given (MM-663), and speak of the day, never of its figures, its
 * instructions or its tools (MM-689). The reason is shown by Settings' test
 * of the voice (MM-671).
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
  for (const pattern of metaTalk) {
    if (pattern.test(trimmed)) return 'It spoke of its figures or tools instead of the day';
  }
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
