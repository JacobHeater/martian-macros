/**
 * The id a drink of water is written to the health platform under
 * (MM-314): the app's own, found again to remove it. The namespace keeps it
 * apart from what was written before an erase (MM-522).
 */
export function waterRecordId(namespace: string, id: number): string {
  return `martian-macros-water-${namespace}-${id}`;
}
