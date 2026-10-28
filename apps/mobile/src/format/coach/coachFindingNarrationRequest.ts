import type { CoachNarrationRequest } from '../../domain/integration/CoachNarrationRequest';
import type { CoachFinding } from '../../engine/analysis/CoachFinding';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';

const systemPrompt =
  'You are the Martian Macros coach: direct, specific and accountable. The person logs their food and training and you hold them to their plan. ' +
  'Rewrite the finding in the JSON as 2 to 3 short sentences to the person, in your own words: what the numbers show, why it matters for their goal, and one concrete order for their next meal or session. ' +
  'Use only numbers present in the JSON, written as they are given, as whole numbers; keep every food and exercise name as given. ' +
  'Speak in plain words: never say a JSON field name (a camelCase word) or a true or false value. ' +
  'Never use exclamation marks. Never moralize food. Do not repeat the title. Do not soften an order with "maybe" or "try to".';

/** Every number in a text, read whole (2176.9 is 2177; 2,177 is 2177). */
function numbersIn(text: string): number[] {
  return [...text.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((match) => roundHalfAwayFromZero(Number(match[0].replace(/,/g, ''))) + 0);
}

/** A short stable hash of a text, for the cache key (djb2). */
function hashOf(text: string): string {
  let hash = 5381;
  for (let at = 0; at < text.length; at += 1) hash = ((hash << 5) + hash + text.charCodeAt(at)) >>> 0;
  return hash.toString(36);
}

/**
 * Builds a `CoachNarrationRequest` for one finding of "Coach's feedback"
 * (MM-672): the built-in sentence, the title and "The numbers behind this"
 * go to the person's own model to be said in its words, and the built-in
 * sentence is the fallback. The numbers it may cite are those in the words
 * and rows it was given, and the finding's figures, whole. Keyed by the
 * finding and its words, so a finding said the same way is asked once.
 */
export function coachFindingNarrationRequest(
  finding: CoachFinding,
  words: { readonly title: string; readonly body: string; readonly evidence: readonly (readonly [label: string, value: string])[] },
  protectedPath: boolean,
): CoachNarrationRequest {
  const payload = {
    kind: finding.kind,
    signal: finding.signal,
    daysShown: finding.span,
    title: words.title,
    builtInWords: words.body,
    numbersBehindThis: words.evidence.map(([label, value]) => ({ label, value })),
    foods: finding.foods.map((food) => food.name),
    subjects: finding.subjects ?? [],
  };
  const allowedNumbers = [
    ...numbersIn(words.title),
    ...numbersIn(words.body),
    ...words.evidence.flatMap(([, value]) => numbersIn(value)),
    ...Object.values(finding.figures).map((figure) => roundHalfAwayFromZero(Math.abs(figure)) + 0),
    finding.span,
  ];
  return {
    cacheKey: `finding:${finding.id}:${hashOf(`${words.title}\n${words.body}`)}`,
    systemPrompt,
    userPrompt: JSON.stringify(payload),
    fallbackText: words.body,
    protectedPath,
    proteinUnrecoverable: false,
    allowedNumbers,
  };
}
