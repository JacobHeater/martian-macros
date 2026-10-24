/**
 * What a person hears for a finding's own controls (MM-610), each named
 * with the finding's title so a list of them can be told apart: "The
 * numbers behind this: Fat averaged 90 g against 70 g", "Dismiss: …".
 */
export function findingControlName(control: 'numbers' | 'dismiss', title: string): string {
  return `${control === 'numbers' ? 'The numbers behind this' : 'Dismiss'}: ${title}`;
}
