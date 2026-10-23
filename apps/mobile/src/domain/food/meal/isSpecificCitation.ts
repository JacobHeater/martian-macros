/** A source's name on its own says which database, not which food in it. */
const bareNames = new Set([
  'usda',
  'fdc',
  'fooddata central',
  'usda fooddata central',
  'open food facts',
  'nutrition label',
  'label',
  'package',
  'estimate',
  'estimated',
  'general knowledge',
  'typical values',
  'various',
  'nutritionix',
  'myfitnesspal',
]);

/**
 * Whether a citation names a particular food in a particular source
 * (MM-586): an address, a number long enough to be an id or a barcode, or at
 * least three words that are not only a source's name. The app cannot check
 * a citation offline; this only refuses the vague ones.
 */
export function isSpecificCitation(citation: string | undefined): boolean {
  const text = (citation ?? '').trim();
  if (text === '') return false;
  if (/https?:\/\/\S+\.\S+/i.test(text)) return true;
  if (/\d{4,}/.test(text)) return true;
  const plain = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (bareNames.has(plain)) return false;
  return plain.split(' ').filter((word) => word.length > 1).length >= 3;
}
