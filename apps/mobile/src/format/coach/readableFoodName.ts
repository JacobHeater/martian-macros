/** A size or a pack, and everything after it: "12 Fluid Ounce Aluminum Can", "500 ml", "2 ct". */
const sizeNoise =
  /\s+\d+(?:[.,]\d+)?\s*(?:fl(?:uid)?\.?\s*(?:oz|ounces?)|ounces?|oz|ml|millilit(?:er|re)s?|lit(?:er|re)s?|l|g|grams?|kg|lbs?|pounds?|ct|count|pack|pk)\b.*$/i;

/** A container at the end of a name: "Aluminum Can", "bottle". */
const container = /\s+(?:(?:aluminum|aluminium|plastic|glass|tin)\s+)?(?:can|bottle|jar|box|bag|pouch|carton|tub)s?$/i;

/**
 * A food's name as the person logged it, made readable for a sentence
 * (MM-617's grammar):
 *
 * - brackets go, with what is in them: "(LOTUS)", "(Pepsi)", "[frozen]";
 * - a size or pack and what follows it goes: "Diet Pepsi Cola 12 Fluid
 *   Ounce Aluminum Can" is "Diet Pepsi Cola";
 * - a catalog name in capitals keeps its first part, in sentence case:
 *   "COOKIE BUTTER, CRUNCHY" is "Cookie butter"; a one-word first part
 *   keeps the next ("CHEESE, COTTAGE" is "Cheese, cottage");
 * - anything else keeps the case it was logged in ("General Tso's
 *   chicken").
 *
 * A name that would be left empty is given back trimmed.
 */
export function readableFoodName(name: string): string {
  let text = name.replace(/\s*\([^)]*\)/g, ' ').replace(/\s*\[[^\]]*\]/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  text = text.replace(sizeNoise, '').replace(container, '');
  text = text.replace(/[\s,;:–-]+$/, '').trim();
  if (/[A-Z]/.test(text) && !/[a-z]/.test(text)) {
    const parts = text.split(',').map((p) => p.trim()).filter((p) => p !== '');
    const first = parts[0] ?? text;
    const kept = !first.includes(' ') && parts[1] !== undefined ? `${first}, ${parts[1]}` : first;
    const lower = kept.toLowerCase();
    text = `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
  }
  return text === '' ? name.trim() : text;
}
