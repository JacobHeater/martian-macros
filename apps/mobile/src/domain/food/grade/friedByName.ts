/** The words a source uses for a fried, battered or breaded food, or one that is such a food by name. */
const friedWords =
  /\b(?:fried|deep[- ]?fried|battered|breaded|doughnuts?|donuts?|french fries|fries|fritters?|tempura|onion rings|hush ?pupp\w*|corn ?dogs?|nuggets?|funnel cakes?|churros?|hash browns?|potato chips|tortilla chips|corn chips|potato crisps)\b/i;

/**
 * Names that say "fried" and are not deep-fried food: a stir-fry or a quick
 * pan-fry of lean meat, refried beans, an egg, a food said not to be fried,
 * or one whose coating the person did not eat.
 */
const notFried = /stir[- ]?fr|pan[- ]?fried|air[- ]?fried|fast fried|refried|not fried|NS as to fried|not breaded|breading removed|coating not eaten|coating removed|\beggs?\b|omelet/i;

/**
 * Whether a food's name says it is fried, battered or breaded (MM-660): the
 * source's own words, never a guess from its numbers, so almonds and a
 * salmon fillet, as fat-rich as fried chicken, are never called fried. A
 * bounded list of words, not of foods: a name the words miss grades as it
 * would without the cap.
 */
export function friedByName(name: string): boolean {
  return !notFried.test(name) && friedWords.test(name);
}
