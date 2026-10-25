/**
 * A name in the possessive (MM-617's grammar): "Barbell bench press's".
 * A name that already is one ("General Tso's", "McDonald's", "Lifters'")
 * stays as it is.
 */
export function possessiveText(name: string): string {
  return /['’]s$|s['’]$/.test(name) ? name : `${name}'s`;
}
