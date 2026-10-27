/**
 * What a source's serving says about the food's form beyond its measure
 * (MM-636): "chopped" of "1 cup, chopped", "packed" of "1 cup packed";
 * nothing for "1 cup" or "1 cup (240 ml)". A volume weighed through that
 * serving is of that form, so it is said with it ("Tablespoons, chopped").
 */
export function servingForm(description: string): string | undefined {
  const form = description
    .replace(/\([^)]*\)/g, ' ')
    .replace(/^\s*[\d\s./,]+\s*[a-z.]+(?:\s+oz|\s+ounces?)?\b/i, '')
    .replace(/^[\s,;:-]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return form === '' ? undefined : form;
}
