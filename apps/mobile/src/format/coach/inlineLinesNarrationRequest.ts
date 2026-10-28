import type { CalendarDate } from '../../domain/CalendarDate';
import type { CoachNarrationRequest } from '../../domain/integration/CoachNarrationRequest';
import type { CoachToolbox } from '../../domain/integration/CoachToolbox';
import type { Meal } from '../../domain/Meal';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';

const systemPrompt =
  'You are the Martian Macros coach: direct, specific and accountable, a real coach, never a page of numbers. ' +
  'The figures list the foods the person logged today that the coach has a line for, numbered, each with its built-in line: the fact about the food and the one move for next time. ' +
  'Say each line in your own words, one short sentence or two, keeping the fact and the move; name the foods as given. ' +
  'Answer with one line per item, in the order given, each starting with its number and a period, and nothing else. ' +
  'Use only numbers present in the figures or in a tool’s answer, as whole numbers. Never use exclamation marks. Never moralize food. Do not soften an order with "maybe" or "try to". ' +
  'Speak in plain words: never say a field name (a camelCase word) or a true or false value. ' +
  'Speak as the coach who looked at the day: never mention figures, JSON, instructions or tools, never say what you are about to do, and never say that something is marked or flagged. ' +
  'You have tools: my_foods_at_meal, search_catalog and price_move, to look a food up or price a move you would rather give; every number you say must come from the figures or a tool’s answer, and the lines say nothing of the tools.';

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
 * One request for the day's inline food lines (MM-687): each item's
 * built-in line and evidence, numbered, with the day's tools; the model
 * answers one line per number. The numbers it may say are those in the
 * lines and rows it was given, and the items' numbers. Keyed by the day
 * and the lines, so a day whose foods did not change is asked once. The
 * fallback is the built-in lines, numbered the same way.
 */
export function inlineLinesNarrationRequest(
  day: CalendarDate,
  items: readonly {
    readonly food: string;
    readonly meal: Meal;
    readonly content: { readonly line: string; readonly evidence: readonly (readonly [label: string, value: string])[] };
  }[],
  toolbox: CoachToolbox,
  protectedPath: boolean,
): CoachNarrationRequest {
  const numbered = items.map((item, at) => ({
    n: at + 1,
    food: item.food,
    meal: item.meal,
    builtInLine: item.content.line,
    numbersBehindThis: item.content.evidence.map(([label, value]) => ({ label, value })),
  }));
  const fallbackText = numbered.map((item) => `${item.n}. ${item.builtInLine}`).join('\n');
  const allowedNumbers = [
    ...numbered.map((item) => item.n),
    ...items.flatMap((item) => [...numbersIn(item.content.line), ...item.content.evidence.flatMap(([, value]) => numbersIn(value))]),
  ];
  return {
    cacheKey: `inline:${day.toString()}:${hashOf(fallbackText)}`,
    systemPrompt,
    userPrompt: JSON.stringify({ day: day.toString(), items: numbered }),
    fallbackText,
    protectedPath,
    proteinUnrecoverable: false,
    allowedNumbers,
    toolbox,
  };
}
